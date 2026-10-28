package com.personal.blog.service;

import com.personal.blog.dto.ProfilePublicDto;
import com.personal.blog.dto.ProfileUpdateRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;

import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class ProfileServiceCachingTest {

    @Autowired
    private ProfileService profileService;

    @Autowired
    private CacheManager cacheManager;

    @Test
    @DisplayName("Strategi caching: @Cacheable menyimpan profil publik dan @CacheEvict membersihkannya saat update")
    void testProfileCachingAndEviction() {
        var cache = cacheManager.getCache(ProfileServiceImpl.CACHE_NAME);
        assertNotNull(cache, "Cache authorProfile harus terdaftar di CacheManager");

        // 1. Bersihkan cache sebelum pengujian
        cache.clear();
        assertNull(cache.get("public"), "Cache harus kosong sebelum pemanggilan pertama");

        // 2. Pemanggilan pertama -> Cache Miss, data disimpan ke cache
        ProfilePublicDto firstCall = profileService.getPublicProfile();
        assertNotNull(firstCall);
        assertNotNull(cache.get("public"), "Setelah getPublicProfile(), entri cache 'public' harus terisi");

        // 3. Pemanggilan kedua -> Cache Hit (diambil langsung dari cache)
        ProfilePublicDto secondCall = profileService.getPublicProfile();
        assertEquals(firstCall.getHeadline(), secondCall.getHeadline());

        // 4. Update profil -> Memicu @CacheEvict
        ProfileUpdateRequest updateReq = ProfileUpdateRequest.builder()
                .name("Rakadnp")
                .fullName("Raka Andinan Pratama")
                .role("Software Engineer")
                .headline("Software Engineer")
                .bio(firstCall.getBio())
                .build();

        profileService.updateProfile(updateReq);

        // 5. Verifikasi bahwa cache telah dibersihkan oleh @CacheEvict
        assertNull(cache.get("public"),
                "Setelah updateProfile, cache 'public' harus telah dibersihkan oleh @CacheEvict");

        // 6. Pemanggilan berikutnya akan mengisi cache kembali dengan data terbaru
        ProfilePublicDto thirdCall = profileService.getPublicProfile();
        assertEquals("Software Engineer", thirdCall.getHeadline());
        assertNotNull(cache.get("public"), "Cache kembali terisi dengan data terbaru");
    }
}
