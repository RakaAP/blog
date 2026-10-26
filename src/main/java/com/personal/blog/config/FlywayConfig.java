package com.personal.blog.config;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
@Slf4j
public class FlywayConfig {

    /**
     * Konfigurasi inisialisasi basis data menggunakan Flyway.
     * Menjalankan method migrate() secara otomatis saat container Spring Boot dimulai.
     * Mengelola skema (V1__init_schema.sql) dan seeding master data awal (V2__seed_initial_master_data.sql).
     */
    @Bean(initMethod = "migrate")
    public Flyway flyway(DataSource dataSource) {
        log.info("[FlywayConfig] Menginisialisasi dan menjalankan migrasi Flyway...");
        return Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .validateOnMigrate(false)
                .load();
    }
}
