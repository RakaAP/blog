package com.personal.blog.controller;

import com.personal.blog.dto.ProfilePublicDto;
import com.personal.blog.dto.ProfileUpdateRequest;
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
     * Menggunakan strategi caching @Cacheable pada service layer untuk performa tinggi.
     */
    @GetMapping
    @Operation(summary = "Ambil profil publik penulis", description = "Dapat diakses secara publik tanpa token autentikasi. Data sensitif tidak diekspos.")
    public ResponseEntity<ProfilePublicDto> getPublicProfile() {
        ProfilePublicDto profile = profileService.getPublicProfile();
        return ResponseEntity.ok(profile);
    }

    /**
     * 2. Endpoint Terproteksi: Memperbarui data profil penulis.
     * Hanya dapat diakses oleh pengguna dengan role ADMIN (@PreAuthorize).
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
     * Wajib diproteksi role ADMIN, dilengkapi validasi tipe MIME dan batas ukuran berkas.
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
}
