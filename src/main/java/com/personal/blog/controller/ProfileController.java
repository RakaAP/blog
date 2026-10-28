package com.personal.blog.controller;

import com.personal.blog.dto.ProfilePublicDto;
import com.personal.blog.dto.ProfileUpdateRequest;
import com.personal.blog.dto.SkillDto;
import com.personal.blog.dto.TestimonialDto;
import com.personal.blog.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Author Profile API", description = "Endpoint manajemen profil penulis publik dan administrasi terproteksi")
public class ProfileController {

    private final ProfileService profileService;

    /**
     * 1. Endpoint Publik: Mengambil data profil publik tanpa otentikasi.
     * Mengembalikan profil lengkap dengan nested skills dan testimonials.
     */
    @GetMapping
    @Operation(summary = "Ambil profil publik penulis", description = "Dapat diakses secara publik tanpa token autentikasi. Data sensitif tidak diekspos.")
    public ResponseEntity<ProfilePublicDto> getPublicProfile() {
        ProfilePublicDto profile = profileService.getPublicProfile();
        return ResponseEntity.ok(profile);
    }

    /**
     * 2. Endpoint Terproteksi: Memperbarui data profil penulis.
     * Dapat memperbarui parameter dasar dan sinkronisasi nested skills/testimonials.
     */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Perbarui profil penulis (Role ADMIN)", description = "Membutuhkan header Authorization: Bearer <JWT_TOKEN> dengan role ROLE_ADMIN.")
    public ResponseEntity<ProfilePublicDto> updateProfile(@RequestBody ProfileUpdateRequest request) {
        log.info("Menerima permintaan pembaruan profil oleh admin...");
        ProfilePublicDto updated = profileService.updateProfile(request);
        return ResponseEntity.ok(updated);
    }

    /**
     * 3. Endpoint Terproteksi: Mengunggah berkas avatar / foto profil baru.
     */
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Unggah foto profil penulis (Role ADMIN)", description = "Menerima berkas gambar (JPG, PNG, WebP max 5MB). Membutuhkan token ADMIN.")
    public ResponseEntity<Map<String, Object>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        log.info("Menerima unggahan berkas foto profil baru: {}", file.getOriginalFilename());
        try {
            String avatarUrl = profileService.uploadAvatar(file);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("avatarUrl", avatarUrl);
            response.put("message", "Foto profil penulis berhasil diunggah dan diperbarui.");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException | SecurityException e) {
            log.warn("Validasi unggah avatar gagal: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("status", "ERROR");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Terjadi kesalahan internal saat unggah avatar: ", e);
            Map<String, Object> error = new HashMap<>();
            error.put("status", "ERROR");
            error.put("message", "Gagal menyimpan berkas di server.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 4. Endpoint Publik: Streaming gambar avatar langsung dari database PostgreSQL.
     */
    @GetMapping(value = "/avatar/image")
    @Operation(summary = "Streaming gambar avatar dari database", description = "Endpoint publik untuk mengambil data biner foto profil dari PostgreSQL.")
    public ResponseEntity<byte[]> getAvatarImage() {
        com.personal.blog.dto.AvatarImageDto imageDto = profileService.getAvatarImage();
        if (imageDto == null || imageDto.getData() == null || imageDto.getData().length == 0) {
            // Fallback redirect ke default /author.jpg jika belum ada avatar biner tersimpan di DB
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(java.net.URI.create("/author.jpg"))
                    .build();
        }

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(imageDto.getContentType());
        } catch (Exception e) {
            mediaType = MediaType.IMAGE_JPEG;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(org.springframework.http.CacheControl.maxAge(1, java.util.concurrent.TimeUnit.DAYS).cachePublic().mustRevalidate())
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(imageDto.getData());
    }

    // =========================================================================
    // SKILLS CRUD ENDPOINTS (Role ADMIN)
    // =========================================================================

    @PostMapping("/skills")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tambah keahlian baru (Role ADMIN)", description = "Menambahkan skill baru ke tabel skills.")
    public ResponseEntity<SkillDto> addSkill(@RequestBody SkillDto skillDto) {
        SkillDto created = profileService.addSkill(skillDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/skills/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Perbarui data keahlian (Role ADMIN)", description = "Memperbarui nama, icon, proficiency, atau display order skill.")
    public ResponseEntity<SkillDto> updateSkill(@PathVariable("id") Long id, @RequestBody SkillDto skillDto) {
        SkillDto updated = profileService.updateSkill(id, skillDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/skills/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Hapus keahlian (Role ADMIN)", description = "Menghapus skill berdasarkan ID.")
    public ResponseEntity<Map<String, String>> deleteSkill(@PathVariable("id") Long id) {
        profileService.deleteSkill(id);
        return ResponseEntity.ok(Map.of("message", "Skill berhasil dihapus", "status", "SUCCESS"));
    }

    // =========================================================================
    // TESTIMONIALS CRUD ENDPOINTS (Role ADMIN)
    // =========================================================================

    @PostMapping("/testimonials")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tambah testimoni baru (Role ADMIN)", description = "Menambahkan testimoni baru ke tabel testimonials.")
    public ResponseEntity<TestimonialDto> addTestimonial(@RequestBody TestimonialDto testimonialDto) {
        TestimonialDto created = profileService.addTestimonial(testimonialDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/testimonials/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Perbarui data testimoni (Role ADMIN)", description = "Memperbarui quote, author, role, atau avatarUrl testimoni.")
    public ResponseEntity<TestimonialDto> updateTestimonial(@PathVariable("id") Long id, @RequestBody TestimonialDto testimonialDto) {
        TestimonialDto updated = profileService.updateTestimonial(id, testimonialDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/testimonials/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Hapus testimoni (Role ADMIN)", description = "Menghapus testimoni berdasarkan ID.")
    public ResponseEntity<Map<String, String>> deleteTestimonial(@PathVariable("id") Long id) {
        profileService.deleteTestimonial(id);
        return ResponseEntity.ok(Map.of("message", "Testimoni berhasil dihapus", "status", "SUCCESS"));
    }
}
