package com.personal.blog.service;

import com.personal.blog.dto.ResearchDto;
import com.personal.blog.model.Profile;
import com.personal.blog.model.Research;
import com.personal.blog.repository.ProfileRepository;
import com.personal.blog.repository.ResearchRepository;
import com.personal.blog.util.UrlUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResearchServiceImpl implements ResearchService {

    private final ResearchRepository researchRepository;
    private final ProfileRepository profileRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ResearchDto> getAllResearches() {
        return researchRepository.findAllByOrderByDisplayOrderAscYearDescIdAsc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ResearchDto getResearchById(Long id) {
        Research research = researchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Riset dengan ID " + id + " tidak ditemukan."));
        return mapToDto(research);
    }

    @Override
    @Transactional
    @CacheEvict(value = ProfileServiceImpl.CACHE_NAME, allEntries = true)
    public ResearchDto createResearch(ResearchDto dto) {
        log.info("[RESEARCH] Menambahkan data riset baru: {}", dto.getTitle());
        Profile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new IllegalStateException("Profil penulis belum diinisialisasi."));

        Research research = Research.builder()
                .profile(profile)
                .year(dto.getYear() != null ? dto.getYear() : "2026")
                .journalName(dto.getJournalName() != null ? dto.getJournalName() : "")
                .title(dto.getTitle() != null ? dto.getTitle() : "")
                .summary(dto.getSummary() != null ? dto.getSummary() : "")
                .researchers(dto.getResearchers() != null ? dto.getResearchers() : profile.getFullName())
                .doi(dto.getDoi())
                .publicationUrl(dto.getPublicationUrl() != null ? UrlUtils.cleanPublicationUrl(dto.getPublicationUrl()) : null)
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .build();

        Research saved = researchRepository.save(research);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = ProfileServiceImpl.CACHE_NAME, allEntries = true)
    public ResearchDto updateResearch(Long id, ResearchDto dto) {
        log.info("[RESEARCH] Memperbarui data riset ID: {}", id);
        Research research = researchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Riset dengan ID " + id + " tidak ditemukan."));

        if (dto.getYear() != null) research.setYear(dto.getYear());
        if (dto.getJournalName() != null) research.setJournalName(dto.getJournalName());
        if (dto.getTitle() != null) research.setTitle(dto.getTitle());
        if (dto.getSummary() != null) research.setSummary(dto.getSummary());
        if (dto.getResearchers() != null) research.setResearchers(dto.getResearchers());
        if (dto.getDoi() != null) research.setDoi(dto.getDoi());
        if (dto.getPublicationUrl() != null) research.setPublicationUrl(UrlUtils.cleanPublicationUrl(dto.getPublicationUrl()));
        if (dto.getDisplayOrder() != null) research.setDisplayOrder(dto.getDisplayOrder());

        Research updated = researchRepository.save(research);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = ProfileServiceImpl.CACHE_NAME, allEntries = true)
    public void deleteResearch(Long id) {
        log.info("[RESEARCH] Menghapus data riset ID: {}", id);
        if (!researchRepository.existsById(id)) {
            throw new IllegalArgumentException("Riset dengan ID " + id + " tidak ditemukan.");
        }
        researchRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> getResearchDocument(Long id) {
        Research research = researchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Riset dengan ID " + id + " tidak ditemukan."));

        String rawUrl = research.getPublicationUrl();
        if (rawUrl == null || rawUrl.isBlank()) {
            throw new IllegalArgumentException("Riset ID " + id + " tidak memiliki tautan publikasi dokumen.");
        }

        String targetUrl = UrlUtils.cleanPublicationUrl(rawUrl);
        log.info("[RESEARCH PROXY] Mengambil dokumen PDF dari URL: {}", targetUrl);

        try {
            HttpClient client = HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.ALWAYS)
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(30))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                    .header("Accept", "application/pdf,application/octet-stream,*/*")
                    .GET()
                    .build();

            HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() >= 400) {
                log.error("[RESEARCH PROXY] Server repositori mengembalikan status error: {}", response.statusCode());
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(("{\"status\":\"ERROR\",\"message\":\"Gagal mengambil dokumen publikasi dari repositori kampus (HTTP " + response.statusCode() + ").\"}").getBytes(StandardCharsets.UTF_8));
            }

            byte[] pdfBytes = response.body();

            // Ekstrak nama file asli jika ada di Content-Disposition upstream
            String filename = "publikasi-riset-" + id + ".pdf";
            Optional<String> upstreamDisposition = response.headers().firstValue("Content-Disposition");
            if (upstreamDisposition.isPresent()) {
                Matcher m = Pattern.compile("filename=\"?([^\";]+)\"?", Pattern.CASE_INSENSITIVE)
                        .matcher(upstreamDisposition.get());
                if (m.find()) {
                    filename = m.group(1).trim();
                }
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"");
            headers.set("X-Frame-Options", "SAMEORIGIN");
            headers.setCacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic().mustRevalidate());
            headers.setContentLength(pdfBytes.length);

            log.info("[RESEARCH PROXY] Sukses mengirimkan dokumen PDF ({}) ukuran: {} bytes", filename, pdfBytes.length);
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            log.error("[RESEARCH PROXY] Terjadi kesalahan saat proxy dokumen PDF dari {}: {}", targetUrl, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(("{\"status\":\"ERROR\",\"message\":\"Gagal memuat dokumen publikasi: " + e.getMessage() + "\"}").getBytes(StandardCharsets.UTF_8));
        }
    }

    public ResearchDto mapToDto(Research entity) {
        if (entity == null) return null;
        return ResearchDto.builder()
                .id(entity.getId())
                .profileId(entity.getProfile() != null ? entity.getProfile().getId() : null)
                .year(entity.getYear())
                .journalName(entity.getJournalName())
                .title(entity.getTitle())
                .summary(entity.getSummary())
                .researchers(entity.getResearchers())
                .doi(entity.getDoi())
                .publicationUrl(entity.getPublicationUrl())
                .displayOrder(entity.getDisplayOrder())
                .build();
    }
}
