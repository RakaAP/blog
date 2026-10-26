package com.personal.blog.repository;

import com.personal.blog.model.SiteSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SiteSettingRepository extends JpaRepository<SiteSetting, Long> {

    Optional<SiteSetting> findByConfigKey(String configKey);

    List<SiteSetting> findAllByOrderByConfigKeyAsc();
}
