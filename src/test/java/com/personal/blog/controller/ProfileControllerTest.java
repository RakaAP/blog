package com.personal.blog.controller;

import com.personal.blog.security.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class ProfileControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    @DisplayName("GET /api/profile harus dapat diakses secara publik tanpa autentikasi")
    void testGetPublicProfileWithoutAuthentication() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").exists())
                .andExpect(jsonPath("$.fullName").exists())
                .andExpect(jsonPath("$.internalNotes").doesNotExist()); // Pastikan field sensitif tidak ada
    }

    @Test
    @DisplayName("PUT /api/profile tanpa token harus ditolak dengan status 401 Unauthorized")
    void testUpdateProfileWithoutTokenShouldFail() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        mockMvc.perform(put("/api/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"headline\":\"Updated Headline\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /api/profile dengan token ROLE_ADMIN yang valid harus sukses 200 OK")
    void testUpdateProfileWithAdminTokenShouldSucceed() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        String adminToken = jwtUtil.generateToken("admin", "ROLE_ADMIN");

        mockMvc.perform(put("/api/profile")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Rakadnp\",\"fullName\":\"Raka Dwi P.\",\"headline\":\"Sistem Andal & Skalabel Berkinerja Tinggi\",\"bio\":\"Bio engineer\",\"role\":\"Staff Software Engineer\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value("Sistem Andal & Skalabel Berkinerja Tinggi"));
    }

    @Test
    @DisplayName("POST /api/profile/avatar tanpa token harus ditolak dengan status 401 Unauthorized")
    void testUploadAvatarWithoutTokenShouldFail() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                "dummy image content".getBytes()
        );

        mockMvc.perform(multipart("/api/profile/avatar").file(file))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/profile/avatar dengan tipe MIME ilegal (text/plain) harus ditolak 400 Bad Request")
    void testUploadAvatarWithIllegalMimeShouldFail() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        String adminToken = jwtUtil.generateToken("admin", "ROLE_ADMIN");

        MockMultipartFile badFile = new MockMultipartFile(
                "file",
                "malicious.sh",
                "text/plain",
                "echo 'hacked'".getBytes()
        );

        mockMvc.perform(multipart("/api/profile/avatar")
                        .file(badFile)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("ERROR"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("POST /api/profile/avatar dengan gambar valid (image/jpeg) dan token ADMIN harus sukses 201 Created")
    void testUploadAvatarWithValidImageShouldSucceed() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        String adminToken = jwtUtil.generateToken("admin", "ROLE_ADMIN");

        MockMultipartFile validImage = new MockMultipartFile(
                "file",
                "photo.jpg",
                "image/jpeg",
                new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}
        );

        mockMvc.perform(multipart("/api/profile/avatar")
                        .file(validImage)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.avatarUrl").exists());
    }

    @Test
    @DisplayName("GET /api/profile harus mengembalikan nested skills dan testimonials")
    void testGetProfileIncludesNestedSkillsAndTestimonials() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills").isArray())
                .andExpect(jsonPath("$.testimonials").isArray());
    }

    @Test
    @DisplayName("POST /api/profile/skills tanpa token harus ditolak 401 Unauthorized")
    void testAddSkillWithoutTokenShouldFail() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        mockMvc.perform(post("/api/profile/skills")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Docker\",\"proficiency\":85,\"icon\":\"docker\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/profile/skills dengan token ADMIN harus berhasil 201 Created")
    void testAddSkillWithAdminTokenShouldSucceed() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        String adminToken = jwtUtil.generateToken("admin", "ROLE_ADMIN");

        mockMvc.perform(post("/api/profile/skills")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Kubernetes\",\"proficiency\":90,\"icon\":\"k8s\",\"category\":\"devops\",\"displayOrder\":12}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Kubernetes"))
                .andExpect(jsonPath("$.proficiency").value(90));
    }

    @Test
    @DisplayName("POST /api/profile/testimonials dengan token ADMIN harus berhasil 201 Created")
    void testAddTestimonialWithAdminTokenShouldSucceed() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        String adminToken = jwtUtil.generateToken("admin", "ROLE_ADMIN");

        mockMvc.perform(post("/api/profile/testimonials")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quote\":\"Kerja sama yang luar biasa!\",\"author\":\"Jane Doe\",\"role\":\"VP of Eng\",\"avatarUrl\":\"/avatar.jpg\",\"displayOrder\":2}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.author").value("Jane Doe"))
                .andExpect(jsonPath("$.quote").value("Kerja sama yang luar biasa!"));
    }

    @Test
    @DisplayName("GET /api/profile/avatar/image harus dapat diakses secara publik (200 OK atau 404 Not Found)")
    void testGetAvatarImageEndpoint() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        mockMvc.perform(get("/api/profile/avatar/image"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(status == 200 || status == 404);
                });
    }
}

