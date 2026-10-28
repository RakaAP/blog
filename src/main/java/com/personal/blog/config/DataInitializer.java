package com.personal.blog.config;

import com.personal.blog.model.Profile;
import com.personal.blog.model.Research;
import com.personal.blog.repository.ProfileRepository;
import com.personal.blog.repository.ResearchRepository;
import com.personal.blog.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Inisialisasi data awal (seeder) yang bersifat idempoten.
 * Hanya dijalankan jika tabel profiles atau researches benar-benar kosong (COUNT == 0).
 * DILARANG menimpa data yang sudah ada atau diubah oleh pengguna/admin.
 */
@Component
@Order(10)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final ProfileRepository profileRepository;
    private final ResearchRepository researchRepository;
    private final ProfileService profileService;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("[DataInitializer] Memeriksa integritas master data profil dan riset...");

        // 1. Periksa ketersediaan Profil Penulis
        if (profileRepository.count() == 0) {
            log.info("[DataInitializer] Tabel profiles kosong. Melakukan seeding profil default...");
            profileService.getPublicProfile();
        } else {
            log.info("[DataInitializer] Tabel profiles sudah memiliki {} baris data. Melewati seeding profil.", profileRepository.count());
        }

        // 2. Periksa ketersediaan Riset & Publikasi
        if (researchRepository.count() == 0) {
            Profile profile = profileRepository.findFirstByOrderByIdAsc().orElse(null);
            if (profile != null) {
                log.info("[DataInitializer] Tabel researches kosong. Melakukan seeding riset awal (termasuk publikasi ETD UGM)...");
                List<Research> initialResearches = List.of(
                        Research.builder()
                                .profile(profile)
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
                                .profile(profile)
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
                                .profile(profile)
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
                log.info("[DataInitializer] Sukses menginisialisasi 3 data riset awal.");
            }
        } else {
            log.info("[DataInitializer] Tabel researches sudah memiliki {} baris data. Melewati seeding riset.", researchRepository.count());
        }
    }
}
