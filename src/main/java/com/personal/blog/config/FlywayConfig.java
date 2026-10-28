package com.personal.blog.config;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
@ConditionalOnProperty(name = "spring.flyway.enabled", havingValue = "true")
@Slf4j
public class FlywayConfig {

    /**
     * Konfigurasi migrasi struktur skema DDL basis data menggunakan Flyway (One-Time / Opt-In).
     * Nonaktif secara default (spring.flyway.enabled=false) agar aplikasi tidak menjalankan
     * perubahan otomatis pada database PostgreSQL setiap kali server dinyalakan.
     */
    @Bean(initMethod = "migrate")
    public Flyway flyway(DataSource dataSource) {
        log.info("[FlywayConfig] Menjalankan migrasi struktur skema DDL Flyway...");
        return Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .validateOnMigrate(false)
                .load();
    }
}
