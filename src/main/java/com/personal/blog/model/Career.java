package com.personal.blog.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "careers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Career {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String role;

    @Column(nullable = false, length = 150)
    private String company;

    @Column(nullable = false, length = 80)
    private String period;

    @Column(length = 50)
    private String type; // 'work' or 'education'

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String achievements; // Semicolon-separated or newline-separated bullet points

    @Column(length = 250)
    private String skills; // Comma-separated: "Java, Spring Boot, React"

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.type == null || this.type.isBlank()) {
            this.type = "work";
        }
    }
}
