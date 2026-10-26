package com.personal.blog.controller;

import com.personal.blog.model.Project;
import com.personal.blog.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"})
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects(@RequestParam(required = false) String type) {
        if (type != null && !type.isBlank()) {
            return ResponseEntity.ok(projectRepository.findByTypeOrderByCreatedAtDesc(type.toLowerCase()));
        }
        return ResponseEntity.ok(projectRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        Project saved = projectRepository.save(project);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody Project updated) {
        return projectRepository.findById(id).map(existing -> {
            existing.setTitle(updated.getTitle());
            existing.setType(updated.getType());
            existing.setCategory(updated.getCategory());
            existing.setDescription(updated.getDescription());
            existing.setDetails(updated.getDetails());
            existing.setTags(updated.getTags());
            existing.setDemoUrl(updated.getDemoUrl());
            existing.setRepoUrl(updated.getRepoUrl());
            existing.setDoi(updated.getDoi());
            existing.setVenue(updated.getVenue());
            return ResponseEntity.ok(projectRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteProject(@PathVariable Long id) {
        return projectRepository.findById(id).map(existing -> {
            projectRepository.delete(existing);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Project with id " + id + " has been deleted successfully.");
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }
}
