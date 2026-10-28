package com.personal.blog.controller;

import com.personal.blog.dto.ResearchDto;
import com.personal.blog.service.ResearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/researches")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Research API", description = "Endpoint manajemen riset dan publikasi ilmiah")
public class ResearchController {

    private final ResearchService researchService;

    /**
     * 1. Endpoint Publik: Mengambil seluruh daftar riset dari database PostgreSQL.
     */
    @GetMapping
    @Operation(summary = "Ambil seluruh daftar riset", description = "Dapat diakses secara publik tanpa token autentikasi.")
    public ResponseEntity<List<ResearchDto>> getAllResearches() {
        List<ResearchDto> researches = researchService.getAllResearches();
        return ResponseEntity.ok(researches);
    }

    /**
     * 2. Endpoint Publik: Mengambil data riset berdasarkan ID.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Ambil detail riset by ID", description = "Dapat diakses secara publik tanpa token autentikasi.")
    public ResponseEntity<ResearchDto> getResearchById(@PathVariable("id") Long id) {
        ResearchDto research = researchService.getResearchById(id);
        return ResponseEntity.ok(research);
    }

    /**
     * 3. Endpoint Terproteksi: Menambahkan item riset baru (Role ADMIN).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tambah riset baru (Role ADMIN)", description = "Menambahkan publikasi riset baru ke database PostgreSQL.")
    public ResponseEntity<ResearchDto> createResearch(@RequestBody ResearchDto dto) {
        log.info("Menerima permintaan penambahan riset baru oleh admin...");
        ResearchDto created = researchService.createResearch(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * 4. Endpoint Terproteksi: Memperbarui data riset tertentu (Role ADMIN).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Perbarui data riset (Role ADMIN)", description = "Memperbarui data publikasi riset berdasarkan ID.")
    public ResponseEntity<ResearchDto> updateResearch(@PathVariable("id") Long id, @RequestBody ResearchDto dto) {
        log.info("Menerima permintaan pembaruan riset ID: {}", id);
        ResearchDto updated = researchService.updateResearch(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * 5. Endpoint Terproteksi: Menghapus item riset dari database (Role ADMIN).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Hapus riset (Role ADMIN)", description = "Menghapus item riset dari database berdasarkan ID.")
    public ResponseEntity<Map<String, String>> deleteResearch(@PathVariable("id") Long id) {
        log.info("Menerima permintaan penghapusan riset ID: {}", id);
        researchService.deleteResearch(id);
        return ResponseEntity.ok(Map.of("message", "Data riset berhasil dihapus dari database", "status", "SUCCESS"));
    }

    /**
     * 6. Endpoint Publik: Proxy dokumen PDF publikasi dengan Content-Disposition: inline
     */
    @GetMapping("/{id}/document")
    @Operation(summary = "Proxy Dokumen PDF Riset (In-App Viewer)", description = "Mengambil file PDF dari repository dan menyajikannya secara inline agar dapat dirender di dalam browser.")
    public ResponseEntity<byte[]> getResearchDocument(@PathVariable("id") Long id) {
        log.info("Menerima permintaan dokumen publikasi untuk riset ID: {}", id);
        return researchService.getResearchDocument(id);
    }
}
