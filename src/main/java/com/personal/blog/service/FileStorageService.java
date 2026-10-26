package com.personal.blog.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    // Maximum file size: 10 MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final Path uploadDir;

    public FileStorageService(@Value("${app.upload.dir:uploads/avatars}") String uploadPath) {
        this.uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
            log.info("Direktori upload avatar diinisialisasi pada: {}", this.uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Gagal membuat direktori upload avatar", e);
        }
    }

    /**
     * Validasi berkas dan simpan ke direktori upload secara aman.
     * @param file berkas avatar yang diunggah
     * @return URL publik berkas (misal /uploads/avatars/{filename})
     */
    public String storeAvatar(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Berkas avatar tidak boleh kosong.");
        }

        // 1. Validasi Ukuran Berkas
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Ukuran berkas melebihi batas maksimum 10MB.");
        }

        // 2. Validasi MIME Type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Tipe berkas tidak diizinkan. Hanya format JPG, PNG, dan WebP yang didukung.");
        }

        // 3. Ekstraksi ekstensi yang aman
        String extension = switch (contentType.toLowerCase()) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };

        // 4. Generate nama berkas unik untuk mencegah path traversal dan bentrok nama
        String filename = "avatar-" + UUID.randomUUID() + extension;
        Path targetLocation = this.uploadDir.resolve(filename).normalize();

        // Pastikan target berada di dalam uploadDir
        if (!targetLocation.startsWith(this.uploadDir)) {
            throw new SecurityException("Akses direktori di luar batas upload tidak diizinkan.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("Berkas avatar tersimpan: {}", filename);
            return "/uploads/avatars/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Gagal menyimpan berkas avatar", e);
        }
    }
}
