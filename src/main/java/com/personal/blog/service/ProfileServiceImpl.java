package com.personal.blog.service;

import com.personal.blog.dto.ProfilePublicDto;
import com.personal.blog.dto.ProfileUpdateRequest;
import com.personal.blog.model.Profile;
import com.personal.blog.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileServiceImpl implements ProfileService {

    public static final String CACHE_NAME = "authorProfile";

    private final ProfileRepository profileRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'public'")
    public ProfilePublicDto getPublicProfile() {
        log.info("[CACHE MISS] Mengambil data profil publik langsung dari database PostgreSQL...");
        Profile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultProfile);
        return mapToDto(profile);
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
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getLocation() != null) profile.setLocation(request.getLocation());
        if (request.getExperience() != null) profile.setExperience(request.getExperience());
        if (request.getSpecialization() != null) profile.setSpecialization(request.getSpecialization());
        if (request.getStatus() != null) profile.setStatus(request.getStatus());
        if (request.getAvailability() != null) profile.setAvailability(request.getAvailability());
        if (request.getGithubUrl() != null) profile.setGithubUrl(request.getGithubUrl());
        if (request.getLinkedinUrl() != null) profile.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getEmail() != null) profile.setEmail(request.getEmail());
        if (request.getHighlightsJson() != null) profile.setHighlightsJson(request.getHighlightsJson());

        Profile saved = profileRepository.save(profile);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public String uploadAvatar(MultipartFile file) {
        log.info("[CACHE EVICT] Mengunggah foto profil baru dan membersihkan cache '{}'...", CACHE_NAME);
        String avatarUrl = fileStorageService.storeAvatar(file);

        Profile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultProfile);
        profile.setAvatarUrl(avatarUrl);
        profileRepository.save(profile);

        return avatarUrl;
    }

    private Profile createDefaultProfile() {
        Profile defaultProfile = Profile.builder()
                .name("Rakadnp")
                .fullName("Raka Dwi P.")
                .role("Software Engineer & Technical Researcher")
                .headline("Membangun Sistem Tangguh, Skalabel & Berkinerja Tinggi.")
                .bio("Halo! Saya Rakadnp, seorang Software Engineer & Researcher yang berfokus pada arsitektur sistem backend berdaya tahan tinggi menggunakan Java Spring Boot dan PostgreSQL, dipadukan dengan pengalaman frontend interaktif menggunakan React.")
                .avatarUrl("/author.jpg")
                .location("Jakarta, Indonesia")
                .experience("5+ Tahun Pengalaman")
                .specialization("☕ Backend & System Architect")
                .status("Aktif Menulis & Riset")
                .availability(null)
                .githubUrl("https://github.com/rakandp")
                .linkedinUrl("https://linkedin.com")
                .email("rakandp.dev@gmail.com")
                .internalNotes("Admin internal profile notes - confidential")
                .highlightsJson("[{\"id\":1,\"icon\":\"⚡\",\"title\":\"Backend Architecture & Scalability\",\"desc\":\"Arsitektur Java 21, Spring Boot 4, microservices, dan performa RESTful APIs.\"},{\"id\":2,\"icon\":\"🗄️\",\"title\":\"Database & Concurrency Tuning\",\"desc\":\"Optimasi query PostgreSQL, pooling koneksi HikariCP, & konsistensi data tinggi.\"},{\"id\":3,\"icon\":\"🔬\",\"title\":\"Riset Teknologi & Analisis\",\"desc\":\"Eksplorasi benchmarking performa sistem, rekayasa software, dan publikasi riset terstruktur.\"},{\"id\":4,\"icon\":\"🛡️\",\"title\":\"Reliabilitas & Clean Code\",\"desc\":\"Komitmen pada standar uptime 99.9%, fault tolerance, dan maintainability jangka panjang.\"}]")
                .build();
        return profileRepository.save(defaultProfile);
    }

    private ProfilePublicDto mapToDto(Profile profile) {
        return ProfilePublicDto.builder()
                .name(profile.getName())
                .fullName(profile.getFullName())
                .role(profile.getRole())
                .headline(profile.getHeadline())
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .location(profile.getLocation())
                .experience(profile.getExperience())
                .specialization(profile.getSpecialization())
                .status(profile.getStatus())
                .availability(profile.getAvailability())
                .githubUrl(profile.getGithubUrl())
                .linkedinUrl(profile.getLinkedinUrl())
                .email(profile.getEmail())
                .highlightsJson(profile.getHighlightsJson())
                .build();
    }
}
