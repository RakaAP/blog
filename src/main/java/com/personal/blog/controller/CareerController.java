package com.personal.blog.controller;

import com.personal.blog.model.Career;
import com.personal.blog.repository.CareerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/career")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"})
@RequiredArgsConstructor
public class CareerController {

    private final CareerRepository careerRepository;

    @GetMapping
    public ResponseEntity<List<Career>> getAllCareers(@RequestParam(required = false) String type) {
        if (type != null && !type.isBlank()) {
            return ResponseEntity.ok(careerRepository.findByTypeOrderByCreatedAtDesc(type.toLowerCase()));
        }
        return ResponseEntity.ok(careerRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Career> getCareerById(@PathVariable Long id) {
        return careerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Career> createCareer(@RequestBody Career career) {
        Career saved = careerRepository.save(career);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Career> updateCareer(@PathVariable Long id, @RequestBody Career updated) {
        return careerRepository.findById(id).map(existing -> {
            existing.setRole(updated.getRole());
            existing.setCompany(updated.getCompany());
            existing.setPeriod(updated.getPeriod());
            existing.setType(updated.getType());
            existing.setSummary(updated.getSummary());
            existing.setAchievements(updated.getAchievements());
            existing.setSkills(updated.getSkills());
            return ResponseEntity.ok(careerRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteCareer(@PathVariable Long id) {
        return careerRepository.findById(id).map(existing -> {
            careerRepository.delete(existing);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Career entry with id " + id + " has been deleted successfully.");
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }
}
