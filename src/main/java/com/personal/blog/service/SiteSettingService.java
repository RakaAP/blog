package com.personal.blog.service;

import com.personal.blog.model.SiteSetting;
import com.personal.blog.repository.SiteSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SiteSettingService {

    private final SiteSettingRepository siteSettingRepository;

    /**
     * Mengambil seluruh konfigurasi situs dalam format Key-Value Map.
     * Menggunakan @Cacheable agar pemanggilan berulang dari pengunjung dilayani dari cache in-memory.
     */
    @Cacheable(value = "siteSettings", key = "'allMap'")
    @Transactional(readOnly = true)
    public Map<String, String> getAllSettingsMap() {
        log.info("[SiteSettingService] Mengambil konfigurasi situs langsung dari database PostgreSQL...");
        List<SiteSetting> list = siteSettingRepository.findAllByOrderByConfigKeyAsc();
        Map<String, String> result = new HashMap<>();
        for (SiteSetting setting : list) {
            result.put(setting.getConfigKey(), setting.getConfigValue() != null ? setting.getConfigValue() : "");
        }
        return result;
    }

    /**
     * Mengambil seluruh objek entitas konfigurasi untuk administrasi backend.
     */
    @Cacheable(value = "siteSettings", key = "'allEntities'")
    @Transactional(readOnly = true)
    public List<SiteSetting> getAllSettings() {
        return siteSettingRepository.findAllByOrderByConfigKeyAsc();
    }

    /**
     * Mengambil nilai satu konfigurasi berdasarkan key.
     */
    @Transactional(readOnly = true)
    public Optional<String> getSettingValue(String key) {
        return siteSettingRepository.findByConfigKey(key).map(SiteSetting::getConfigValue);
    }

    /**
     * Memperbarui batch konfigurasi situs oleh Admin.
     * Menghapus cache dengan @CacheEvict agar seluruh pengunjung langsung menerima nilai konfigurasi teranyar.
     */
    @CacheEvict(value = "siteSettings", allEntries = true)
    @Transactional
    public Map<String, String> updateSettings(Map<String, String> updates) {
        log.info("[SiteSettingService] Memperbarui {} parameter konfigurasi situs oleh Admin...", updates.size());
        for (Map.Entry<String, String> entry : updates.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            SiteSetting setting = siteSettingRepository.findByConfigKey(key)
                    .orElseGet(() -> SiteSetting.builder()
                            .configKey(key)
                            .description("Parameter konfigurasi website")
                            .build());

            setting.setConfigValue(value);
            siteSettingRepository.save(setting);
        }
        return getAllSettingsMap();
    }

    /**
     * Memperbarui atau membuat satu entri konfigurasi.
     */
    @CacheEvict(value = "siteSettings", allEntries = true)
    @Transactional
    public SiteSetting updateSingleSetting(String key, String value, String description) {
        SiteSetting setting = siteSettingRepository.findByConfigKey(key)
                .orElseGet(() -> SiteSetting.builder()
                        .configKey(key)
                        .description(description != null ? description : "Pengaturan konfigurasi")
                        .build());

        setting.setConfigValue(value);
        if (description != null && !description.isBlank()) {
            setting.setDescription(description);
        }
        return siteSettingRepository.save(setting);
    }
}
