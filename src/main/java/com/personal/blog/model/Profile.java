package com.personal.blog.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "author_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private String headline;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String bio;

    @Column(length = 1000)
    private String avatarUrl;

    private String location;

    private String experience;

    private String specialization;

    private String status;

    private String availability;

    private String githubUrl;

    private String linkedinUrl;

    private String email;

    @Column(columnDefinition = "TEXT")
    private String highlightsJson;

    // Sensitive / internal field that should NEVER be exposed in public DTO
    @Column(columnDefinition = "TEXT")
    private String internalNotes;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
