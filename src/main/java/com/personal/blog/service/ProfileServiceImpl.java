package com.personal.blog.service;

import com.personal.blog.dto.AvatarImageDto;
import com.personal.blog.dto.ProfilePublicDto;
import com.personal.blog.dto.ProfileUpdateRequest;
import com.personal.blog.dto.ResearchDto;
import com.personal.blog.dto.SkillDto;
import com.personal.blog.dto.TestimonialDto;
import com.personal.blog.model.Profile;
import com.personal.blog.model.Research;
import com.personal.blog.model.Skill;
import com.personal.blog.model.Testimonial;
import com.personal.blog.repository.ProfileRepository;
import com.personal.blog.repository.ResearchRepository;
import com.personal.blog.repository.SkillRepository;
import com.personal.blog.repository.TestimonialRepository;
import com.personal.blog.util.UrlUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileServiceImpl implements ProfileService {

    public static final String CACHE_NAME = "authorProfile";

    private final ProfileRepository profileRepository;
    private final SkillRepository skillRepository;
    private final TestimonialRepository testimonialRepository;
    private final ResearchRepository researchRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'public'")
    public ProfilePublicDto getPublicProfile() {
        log.info("[CACHE MISS] Mengambil data profil publik langsung dari database PostgreSQL...");
        Profile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultProfile);

        List<Skill> skills = skillRepository.findByProfileIdOrderByDisplayOrderAscIdAsc(profile.getId());
        List<Testimonial> testimonials = testimonialRepository.findByProfileIdOrderByDisplayOrderAscIdAsc(profile.getId());
        List<Research> researches = researchRepository.findByProfileIdOrderByDisplayOrderAscYearDescIdAsc(profile.getId());

        return mapToDto(profile, skills, testimonials, researches);
    }

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public ProfilePublicDto updateProfile(ProfileUpdateRequest request) {
        log.info("[CACHE EVICT] Memperbarui profil penulis dan membersihkan cache '{}'...", CACHE_NAME);
        Profile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultProfile);

        if (request.getName() != null) profile.setName(request.getName());
        if (request.getFullName() != null) profile.setFullName(request.getFullName());
        if (request.getRole() != null) profile.setRole(request.getRole());
        if (request.getHeadline() != null) profile.setHeadline(request.getHeadline());
        if (request.getBio() != null) profile.setBio(request.getBio());
        String avatar = request.getPhotoUrl() != null && !request.getPhotoUrl().isBlank()
                ? request.getPhotoUrl()
                : request.getAvatarUrl();
        if (avatar != null && !avatar.isBlank()) {
            // Jika data biner avatar_data sudah tersimpan di database dan avatar_url saat ini
            // mengarah ke endpoint gambar database (/api/profile/avatar/image), pertahankan URL tersebut
            // agar perubahan teks profil tidak me-reset avatar ke default /author.jpg
            if (profile.getAvatarData() != null && profile.getAvatarData().length > 0) {
                if (profile.getAvatarUrl() != null && profile.getAvatarUrl().startsWith("/api/profile/avatar/image")) {
                    if (avatar.equals("/author.jpg") || !avatar.startsWith("/api/profile/avatar/image")) {
                        avatar = profile.getAvatarUrl();
                    }
                }
            }
            profile.setAvatarUrl(avatar);
        }
        if (request.getLocation() != null) profile.setLocation(request.getLocation());
        if (request.getExperience() != null) profile.setExperience(request.getExperience());
        if (request.getSpecialization() != null) profile.setSpecialization(request.getSpecialization());
        if (request.getStatus() != null) profile.setStatus(request.getStatus());
        if (request.getAvailability() != null) profile.setAvailability(request.getAvailability());
        if (request.getGithubUrl() != null) profile.setGithubUrl(request.getGithubUrl());
        if (request.getLinkedinUrl() != null) profile.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getTwitterUrl() != null) profile.setTwitterUrl(request.getTwitterUrl());
        if (request.getInstagramUrl() != null) profile.setInstagramUrl(request.getInstagramUrl());
        if (request.getEmail() != null) profile.setEmail(request.getEmail());
        if (request.getHighlightsJson() != null) profile.setHighlightsJson(request.getHighlightsJson());
        if (request.getCvUrl() != null) profile.setCvUrl(request.getCvUrl());
        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getSkillsJson() != null) profile.setSkillsJson(request.getSkillsJson());
        if (request.getTestimonialJson() != null) profile.setTestimonialJson(request.getTestimonialJson());

        // Update skills jika disediakan dalam request
        if (request.getSkills() != null) {
            skillRepository.deleteAll(skillRepository.findByProfileIdOrderByDisplayOrderAscIdAsc(profile.getId()));
            int order = 1;
            for (SkillDto dto : request.getSkills()) {
                int percentVal = dto.getProficiency() != null ? dto.getProficiency()
                        : (dto.getPercent() != null ? dto.getPercent() : 85);
                Skill s = Skill.builder()
                        .profile(profile)
                        .name(dto.getName())
                        .icon(dto.getIcon())
                        .proficiency(percentVal)
                        .color(dto.getColor())
                        .category(dto.getCategory() != null ? dto.getCategory() : "general")
                        .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : order++)
                        .build();
                skillRepository.save(s);
            }
        }

        // Update testimonials jika disediakan dalam request
        if (request.getTestimonials() != null) {
            testimonialRepository.deleteAll(testimonialRepository.findByProfileIdOrderByDisplayOrderAscIdAsc(profile.getId()));
            int order = 1;
            for (TestimonialDto tDto : request.getTestimonials()) {
                Testimonial t = Testimonial.builder()
                        .profile(profile)
                        .quote(tDto.getQuote())
                        .author(tDto.getAuthor())
                        .role(tDto.getRole())
                        .avatarUrl(tDto.getAvatarUrl())
                        .displayOrder(tDto.getDisplayOrder() != null ? tDto.getDisplayOrder() : order++)
                        .build();
                testimonialRepository.save(t);
            }
        } else if (request.getTestimonial() != null) {
            TestimonialDto tDto = request.getTestimonial();
            List<Testimonial> existing = testimonialRepository.findByProfileIdOrderByDisplayOrderAscIdAsc(profile.getId());
            if (!existing.isEmpty()) {
                Testimonial primary = existing.get(0);
                if (tDto.getQuote() != null) primary.setQuote(tDto.getQuote());
                if (tDto.getAuthor() != null) primary.setAuthor(tDto.getAuthor());
                if (tDto.getRole() != null) primary.setRole(tDto.getRole());
                if (tDto.getAvatarUrl() != null) primary.setAvatarUrl(tDto.getAvatarUrl());
                testimonialRepository.save(primary);
            } else {
                Testimonial t = Testimonial.builder()
                        .profile(profile)
                        .quote(tDto.getQuote())
                        .author(tDto.getAuthor())
                        .role(tDto.getRole())
                        .avatarUrl(tDto.getAvatarUrl())
                        .displayOrder(1)
                        .build();
                testimonialRepository.save(t);
            }
        }

        // Update researches jika disediakan dalam request
        if (request.getResearches() != null) {
            researchRepository.deleteAll(researchRepository.findByProfileIdOrderByDisplayOrderAscYearDescIdAsc(profile.getId()));
            int order = 1;
            for (ResearchDto rDto : request.getResearches()) {
                Research r = Research.builder()
                        .profile(profile)
                        .year(rDto.getYear() != null ? rDto.getYear() : "2026")
                        .journalName(rDto.getJournalName() != null ? rDto.getJournalName() : "")
                        .title(rDto.getTitle() != null ? rDto.getTitle() : "")
                        .summary(rDto.getSummary() != null ? rDto.getSummary() : "")
                        .researchers(rDto.getResearchers() != null ? rDto.getResearchers() : profile.getFullName())
                        .doi(rDto.getDoi())
                        .publicationUrl(rDto.getPublicationUrl() != null ? UrlUtils.cleanPublicationUrl(rDto.getPublicationUrl()) : null)
                        .displayOrder(rDto.getDisplayOrder() != null ? rDto.getDisplayOrder() : order++)
                        .build();
                researchRepository.save(r);
            }
        }

        Profile saved = profileRepository.save(profile);
        List<Skill> updatedSkills = skillRepository.findByProfileIdOrderByDisplayOrderAscIdAsc(saved.getId());
        List<Testimonial> updatedTestimonials = testimonialRepository.findByProfileIdOrderByDisplayOrderAscIdAsc(saved.getId());
        List<Research> updatedResearches = researchRepository.findByProfileIdOrderByDisplayOrderAscYearDescIdAsc(saved.getId());

        return mapToDto(saved, updatedSkills, updatedTestimonials, updatedResearches);
    }

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public String uploadAvatar(MultipartFile file) {
        log.info("[CACHE EVICT] Mengunggah foto profil baru dan membersihkan cache '{}'...", CACHE_NAME);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Berkas avatar tidak boleh kosong.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Ukuran berkas melebihi batas maksimum 10MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Tipe berkas tidak diizinkan. Hanya format JPG, PNG, dan WebP yang didukung.");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Gagal membaca byte berkas avatar", e);
        }

        // Simpan juga ke filesystem lokal sebagai fallback sekunder
        try {
            fileStorageService.storeAvatar(file);
        } catch (Exception e) {
            log.warn("Penyimpanan fallback filesystem lokal gagal (diabaikan karena PostgreSQL aktif): {}", e.getMessage());
        }

        Profile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultProfile);

        String avatarUrl = "/api/profile/avatar/image?t=" + System.currentTimeMillis();
        profile.setAvatarData(bytes);
        profile.setAvatarContentType(contentType);
        profile.setAvatarUrl(avatarUrl);
        profileRepository.save(profile);

        log.info("Foto profil berhasil disimpan secara permanen di PostgreSQL (ukuran: {} bytes, MIME: {})", bytes.length, contentType);
        return avatarUrl;
    }

    @Override
    @Transactional(readOnly = true)
    public AvatarImageDto getAvatarImage() {
        Profile profile = profileRepository.findFirstByOrderByIdAsc().orElse(null);
        if (profile == null || profile.getAvatarData() == null || profile.getAvatarData().length == 0) {
            return null;
        }
        return AvatarImageDto.builder()
                .data(profile.getAvatarData())
                .contentType(profile.getAvatarContentType() != null ? profile.getAvatarContentType() : "image/jpeg")
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public SkillDto addSkill(SkillDto skillDto) {
        Profile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultProfile);

        int percentVal = skillDto.getProficiency() != null ? skillDto.getProficiency()
                : (skillDto.getPercent() != null ? skillDto.getPercent() : 85);

        Skill skill = Skill.builder()
                .profile(profile)
                .name(skillDto.getName())
                .icon(skillDto.getIcon())
                .proficiency(percentVal)
                .color(skillDto.getColor())
                .category(skillDto.getCategory() != null ? skillDto.getCategory() : "general")
                .displayOrder(skillDto.getDisplayOrder() != null ? skillDto.getDisplayOrder() : 0)
                .build();

        Skill saved = skillRepository.save(skill);
        return mapSkillToDto(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public SkillDto updateSkill(Long skillId, SkillDto skillDto) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new IllegalArgumentException("Skill dengan ID " + skillId + " tidak ditemukan"));

        if (skillDto.getName() != null) skill.setName(skillDto.getName());
        if (skillDto.getIcon() != null) skill.setIcon(skillDto.getIcon());
        if (skillDto.getProficiency() != null) {
            skill.setProficiency(skillDto.getProficiency());
        } else if (skillDto.getPercent() != null) {
            skill.setProficiency(skillDto.getPercent());
        }
        if (skillDto.getColor() != null) skill.setColor(skillDto.getColor());
        if (skillDto.getCategory() != null) skill.setCategory(skillDto.getCategory());
        if (skillDto.getDisplayOrder() != null) skill.setDisplayOrder(skillDto.getDisplayOrder());

        Skill saved = skillRepository.save(skill);
        return mapSkillToDto(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void deleteSkill(Long skillId) {
        skillRepository.deleteById(skillId);
    }

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public TestimonialDto addTestimonial(TestimonialDto testimonialDto) {
        Profile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultProfile);

        Testimonial testimonial = Testimonial.builder()
                .profile(profile)
                .quote(testimonialDto.getQuote())
                .author(testimonialDto.getAuthor())
                .role(testimonialDto.getRole())
                .avatarUrl(testimonialDto.getAvatarUrl())
                .displayOrder(testimonialDto.getDisplayOrder() != null ? testimonialDto.getDisplayOrder() : 0)
                .build();

        Testimonial saved = testimonialRepository.save(testimonial);
        return mapTestimonialToDto(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public TestimonialDto updateTestimonial(Long testimonialId, TestimonialDto testimonialDto) {
        Testimonial testimonial = testimonialRepository.findById(testimonialId)
                .orElseThrow(() -> new IllegalArgumentException("Testimonial dengan ID " + testimonialId + " tidak ditemukan"));

        if (testimonialDto.getQuote() != null) testimonial.setQuote(testimonialDto.getQuote());
        if (testimonialDto.getAuthor() != null) testimonial.setAuthor(testimonialDto.getAuthor());
        if (testimonialDto.getRole() != null) testimonial.setRole(testimonialDto.getRole());
        if (testimonialDto.getAvatarUrl() != null) testimonial.setAvatarUrl(testimonialDto.getAvatarUrl());
        if (testimonialDto.getDisplayOrder() != null) testimonial.setDisplayOrder(testimonialDto.getDisplayOrder());

        Testimonial saved = testimonialRepository.save(testimonial);
        return mapTestimonialToDto(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void deleteTestimonial(Long testimonialId) {
        testimonialRepository.deleteById(testimonialId);
    }

    private Profile createDefaultProfile() {
        Profile defaultProfile = Profile.builder()
                .name("Rakadnp")
                .fullName("Raka Dwi P.")
                .role("Lead Backend Architect")
                .headline("Arsitektur Berdaya Tahan Tinggi dengan Caching Terpadu")
                .bio("Halo! Saya Rakadnp, seorang Software Engineer & Researcher yang berfokus pada arsitektur sistem backend berdaya tahan tinggi menggunakan Java Spring Boot dan PostgreSQL, dipadukan dengan pengalaman frontend interaktif menggunakan React.")
                .avatarUrl("/author.jpg")
                .location("Jakarta, Indonesia")
                .experience("5+ Tahun Pengalaman")
                .specialization("☕ Backend & System Architect")
                .status("Aktif Menulis & Riset")
                .availability(null)
                .githubUrl("https://github.com/rakandp")
                .linkedinUrl("https://linkedin.com")
                .twitterUrl("https://twitter.com")
                .instagramUrl("https://instagram.com")
                .email("rakandp.dev@gmail.com")
                .cvUrl("#")
                .phone("+62 812-3456-7890")
                .internalNotes("Profil terverifikasi sistem blog.")
                .build();

        Profile saved = profileRepository.save(defaultProfile);

        // Seed initial skills
        List<Skill> initialSkills = List.of(
                Skill.builder().profile(saved).name("HTML").icon("html").proficiency(95).color("#e34f26").category("frontend").displayOrder(1).build(),
                Skill.builder().profile(saved).name("CSS").icon("css").proficiency(90).color("#1572b6").category("frontend").displayOrder(2).build(),
                Skill.builder().profile(saved).name("JavaScript").icon("js").proficiency(90).color("#f7df1e").category("frontend").displayOrder(3).build(),
                Skill.builder().profile(saved).name("React.js").icon("react").proficiency(85).color("#61dafb").category("frontend").displayOrder(4).build(),
                Skill.builder().profile(saved).name("Next.js").icon("next").proficiency(80).color("#ffffff").category("frontend").displayOrder(5).build(),
                Skill.builder().profile(saved).name("TypeScript").icon("ts").proficiency(85).color("#3178c6").category("frontend").displayOrder(6).build(),
                Skill.builder().profile(saved).name("Node.js").icon("node").proficiency(80).color("#339933").category("backend").displayOrder(7).build(),
                Skill.builder().profile(saved).name("Tailwind CSS").icon("tailwind").proficiency(90).color("#06b6d4").category("frontend").displayOrder(8).build(),
                Skill.builder().profile(saved).name("Git").icon("git").proficiency(85).color("#f05032").category("devops").displayOrder(9).build(),
                Skill.builder().profile(saved).name("Java 21 & Spring Boot 4").icon("java").proficiency(95).color("#e76f00").category("backend").displayOrder(10).build(),
                Skill.builder().profile(saved).name("PostgreSQL").icon("postgres").proficiency(90).color("#336791").category("backend").displayOrder(11).build()
        );
        skillRepository.saveAll(initialSkills);

        // Seed initial testimonial
        Testimonial initialTestimonial = Testimonial.builder()
                .profile(saved)
                .quote("Alex is an exceptional developer who delivers high-quality work on time. His attention to detail and problem-solving skills are outstanding.")
                .author("Sarah Johnson")
                .role("CEO, TechStart")
                .avatarUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80")
                .displayOrder(1)
                .build();
        testimonialRepository.save(initialTestimonial);

        // Seed initial researches jika belum ada
        if (researchRepository.findByProfileIdOrderByDisplayOrderAscYearDescIdAsc(saved.getId()).isEmpty()) {
            List<Research> initialResearches = List.of(
                    Research.builder()
                            .profile(saved)
                            .year("2020")
                            .journalName("ETD Repository — Universitas Gadjah Mada")
                            .title("Pengembangan Aplikasi Pengenalan Suara Speech-to-Text Bahasa Indonesia pada Laptop dan Dekstop")
                            .summary("Aplikasi automatic speech recognition (ASR) bernama ARISE dikembangkan untuk memudahkan penyandang disabilitas dan pengguna yang kesulitan menggunakan keyboard atau touchscreen agar dapat mengetik angka \"nol\" hingga \"sembilan\" melalui suara. Sistem ini menggunakan metode ekstraksi ciri MFCC dan algoritma klasifikasi SVM (dengan KNN sebagai pembanding) yang menghasilkan performa F1-score pada model SVM berkisar antara 69% hingga 98%.")
                            .researchers("Raka Andinan Pratama, Dr. Ir. Risanuri Hidayat, M.Sc., IPM.")
                            .doi("ETD-UGM-573142")
                            .publicationUrl("http://etd.repository.ugm.ac.id/penelitian/unduh/573142")
                            .displayOrder(1)
                            .build(),
                    Research.builder()
                            .profile(saved)
                            .year("2025")
                            .journalName("ACM Computing Surveys (CSUR)")
                            .title("Comprehensive Benchmark Analysis of Modern JVM Garbage Collectors for Latency-Critical Distributed Systems")
                            .summary("Komparasi mendalam antara ZGC Generasional dan Shenandoah GC pada Java 21 LTS dalam menangani beban pemrosesan transaksi real-time dengan alokasi heap terdistribusi hingga 128 GB tanpa degradasi throughput pada SLA 99.99%.")
                            .researchers("Raka Dwi P., Dr. Marcus Vance")
                            .doi("10.1145/3618920.2025")
                            .publicationUrl("https://dl.acm.org")
                            .displayOrder(2)
                            .build(),
                    Research.builder()
                            .profile(saved)
                            .year("2024")
                            .journalName("International Conference on Distributed Computing Systems (ICDCS)")
                            .title("Adaptive Connection Pooling and Concurrency Control Optimization in Cloud-Native PostgreSQL Deployments")
                            .summary("Eksplorasi optimasi connection pooling dinamis pada PostgreSQL menggunakan HikariCP dan PgBouncer untuk mengatasi bottleneck lock contention dan memaksimalkan efisiensi resource CPU pada kluster Kubernetes berskala besar.")
                            .researchers("Raka Dwi P., Elena Rostova")
                            .doi("10.1109/ICDCS.2024.1054231")
                            .publicationUrl("https://ieeexplore.ieee.org")
                            .displayOrder(3)
                            .build()
            );
            researchRepository.saveAll(initialResearches);
        }

        return saved;
    }

    private ProfilePublicDto mapToDto(Profile profile, List<Skill> skills, List<Testimonial> testimonials, List<Research> researches) {
        List<SkillDto> skillDtos = skills != null
                ? skills.stream().map(this::mapSkillToDto).collect(Collectors.toList())
                : new ArrayList<>();

        List<TestimonialDto> testimonialDtos = testimonials != null
                ? testimonials.stream().map(this::mapTestimonialToDto).collect(Collectors.toList())
                : new ArrayList<>();

        List<ResearchDto> researchDtos = researches != null
                ? researches.stream().map(this::mapResearchToDto).collect(Collectors.toList())
                : new ArrayList<>();

        TestimonialDto primaryTestimonial = !testimonialDtos.isEmpty() ? testimonialDtos.get(0) : null;

        return ProfilePublicDto.builder()
                .id(profile.getId())
                .name(profile.getName())
                .fullName(profile.getFullName())
                .role(profile.getRole())
                .headline(profile.getHeadline())
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .photoUrl(profile.getAvatarUrl())
                .location(profile.getLocation())
                .experience(profile.getExperience())
                .specialization(profile.getSpecialization())
                .status(profile.getStatus())
                .availability(profile.getAvailability())
                .githubUrl(profile.getGithubUrl())
                .linkedinUrl(profile.getLinkedinUrl())
                .twitterUrl(profile.getTwitterUrl())
                .instagramUrl(profile.getInstagramUrl())
                .email(profile.getEmail())
                .phone(profile.getPhone())
                .cvUrl(profile.getCvUrl())
                .highlightsJson(profile.getHighlightsJson())
                .skillsJson(profile.getSkillsJson())
                .testimonialJson(profile.getTestimonialJson())
                .skills(skillDtos)
                .testimonials(testimonialDtos)
                .testimonial(primaryTestimonial)
                .researches(researchDtos)
                .build();
    }

    private ResearchDto mapResearchToDto(Research research) {
        if (research == null) return null;
        return ResearchDto.builder()
                .id(research.getId())
                .profileId(research.getProfile() != null ? research.getProfile().getId() : null)
                .year(research.getYear())
                .journalName(research.getJournalName())
                .title(research.getTitle())
                .summary(research.getSummary())
                .researchers(research.getResearchers())
                .doi(research.getDoi())
                .publicationUrl(research.getPublicationUrl())
                .displayOrder(research.getDisplayOrder())
                .build();
    }

    private SkillDto mapSkillToDto(Skill skill) {
        return SkillDto.builder()
                .id(skill.getId())
                .name(skill.getName())
                .icon(skill.getIcon())
                .proficiency(skill.getProficiency())
                .percent(skill.getProficiency())
                .color(skill.getColor())
                .category(skill.getCategory())
                .displayOrder(skill.getDisplayOrder())
                .build();
    }

    private TestimonialDto mapTestimonialToDto(Testimonial testimonial) {
        return TestimonialDto.builder()
                .id(testimonial.getId())
                .quote(testimonial.getQuote())
                .author(testimonial.getAuthor())
                .role(testimonial.getRole())
                .avatarUrl(testimonial.getAvatarUrl())
                .displayOrder(testimonial.getDisplayOrder())
                .build();
    }
}
