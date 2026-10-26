package com.personal.blog.controller;

import com.personal.blog.model.SiteSetting;
import com.personal.blog.service.SiteSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Site Settings API", description = "Endpoint pembacaan konfigurasi dinamis publik dan modifikasi terproteksi")
public class SiteSettingController {

    private final SiteSettingService siteSettingService;

    /**
     * 1. Endpoint Publik: Mengambil seluruh konfigurasi situs (Key-Value map).
     * Dapat diakses bebas oleh frontend untuk rendering nama brand, deskripsi SEO, teks banner, dsb.
     */
    @GetMapping
    @Operation(summary = "Ambil konfigurasi website publik", description = "Mengembalikan pasangan key-value konfigurasi dinamis dari database.")
    public ResponseEntity<Map<String, String>> getAllSettings() {
        return ResponseEntity.ok(siteSettingService.getAllSettingsMap());
    }

    /**
     * Mengambil daftar entitas lengkap konfigurasi beserta deskripsi (untuk halaman CMS).
     */
    @GetMapping("/entities")
    @Operation(summary = "Ambil seluruh daftar entitas konfigurasi", description = "Menampilkan data lengkap entitas konfigurasi.")
    public ResponseEntity<List<SiteSetting>> getAllSettingEntities() {
        return ResponseEntity.ok(siteSettingService.getAllSettings());
    }

    /**
     * Mengambil nilai konfigurasi tunggal berdasarkan key.
     */
    @GetMapping("/{key}")
    @Operation(summary = "Ambil satu nilai konfigurasi", description = "Mencari konfigurasi berdasarkan key unik.")
    public ResponseEntity<Map<String, String>> getSettingByKey(@PathVariable String key) {
        return siteSettingService.getSettingValue(key)
                .map(val -> ResponseEntity.ok(Map.of("key", key, "value", val)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 2. Endpoint Terproteksi: Memperbarui batch konfigurasi situs oleh Admin.
     * Wajib otentikasi dengan peran ADMIN.
     */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Perbarui batch konfigurasi (Role ADMIN)", description = "Menyimpan perubahan parameter konfigurasi dan mengevikasi cache.")
    public ResponseEntity<Map<String, String>> updateSettings(@RequestBody Map<String, String> settings) {
        log.info("Menerima permintaan pembaruan konfigurasi situs oleh admin: {}", settings.keySet());
        Map<String, String> updated = siteSettingService.updateSettings(settings);
        return ResponseEntity.ok(updated);
    }

    /**
     * Memperbarui satu konfigurasi spesifik oleh Admin.
     */
    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Perbarui satu konfigurasi spesifik (Role ADMIN)", description = "Memperbarui nilai dan deskripsi satu parameter konfigurasi.")
    public ResponseEntity<SiteSetting> updateSingleSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> payload
    ) {
        String value = payload.getOrDefault("value", "");
        String description = payload.get("description");
        SiteSetting updated = siteSettingService.updateSingleSetting(key, value, description);
        return ResponseEntity.ok(updated);
    }
}
