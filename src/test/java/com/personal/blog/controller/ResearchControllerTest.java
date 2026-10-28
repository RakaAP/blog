package com.personal.blog.controller;

import com.personal.blog.security.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class ResearchControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    @DisplayName("GET /api/researches harus dapat diakses secara publik dan mengembalikan daftar riset")
    void testGetAllResearchesPublic() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        mockMvc.perform(get("/api/researches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].title").exists())
                .andExpect(jsonPath("$[0].journalName").exists());
    }

    @Test
    @DisplayName("POST /api/researches tanpa token harus ditolak 401 Unauthorized")
    void testCreateResearchWithoutToken() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        mockMvc.perform(post("/api/researches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"AI Research\",\"year\":\"2026\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST, PUT, DELETE /api/researches dengan token ADMIN harus berhasil")
    void testResearchAdminCrudLifecycle() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        String adminToken = jwtUtil.generateToken("admin", "ROLE_ADMIN");

        // 1. CREATE
        String newResearchJson = """
                {
                    "year": "2026",
                    "journalName": "IEEE Access",
                    "title": "Benchmarking Reactive Event-Driven Microservices",
                    "summary": "Analisis performa komparatif pemrosesan event terdistribusi pada beban tinggi.",
                    "researchers": "Raka Dwi P.",
                    "doi": "10.1109/ACCESS.2026.1001",
                    "publicationUrl": "https://ieeexplore.ieee.org",
                    "displayOrder": 10
                }
                """;

        String responseBody = mockMvc.perform(post("/api/researches")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newResearchJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("Benchmarking Reactive Event-Driven Microservices"))
                .andReturn().getResponse().getContentAsString();

        // Extract ID
        com.fasterxml.jackson.databind.JsonNode rootNode = new com.fasterxml.jackson.databind.ObjectMapper().readTree(responseBody);
        long createdId = rootNode.get("id").asLong();

        // 2. GET by ID
        mockMvc.perform(get("/api/researches/" + createdId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.journalName").value("IEEE Access"));

        // 3. UPDATE
        String updateJson = """
                {
                    "title": "Updated Benchmark Title",
                    "year": "2026"
                }
                """;

        mockMvc.perform(put("/api/researches/" + createdId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Benchmark Title"));

        // 4. DELETE
        mockMvc.perform(delete("/api/researches/" + createdId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    void testGetResearchDocument_nonExistent() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        mockMvc.perform(get("/api/researches/99999/document"))
                .andExpect(status().isBadRequest());
    }
}
