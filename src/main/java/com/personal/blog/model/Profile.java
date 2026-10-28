package com.personal.blog.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "profiles")
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

    @Column(name = "avatar_data")
    private byte[] avatarData;

    @Column(name = "avatar_content_type", length = 100)
    private String avatarContentType;

    private String location;

    private String experience;

    private String specialization;

    private String status;

    private String availability;

    private String githubUrl;

    private String linkedinUrl;

    private String twitterUrl;

    private String instagramUrl;

    private String email;

    @Column(columnDefinition = "TEXT")
    private String highlightsJson;

    @Column(length = 500)
    private String cvUrl;

    @Column(length = 50)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String skillsJson;

    @Column(columnDefinition = "TEXT")
    private String testimonialJson;

    // Sensitive / internal field that should NEVER be exposed in public DTO
    @Column(columnDefinition = "TEXT")
    private String internalNotes;

    // Relasi One-to-Many ke tabel skills
    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC, id ASC")
    @Builder.Default
    private List<Skill> skills = new ArrayList<>();

    // Relasi One-to-Many ke tabel testimonials
    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC, id ASC")
    @Builder.Default
    private List<Testimonial> testimonials = new ArrayList<>();

    // Relasi One-to-Many ke tabel researches
    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC, year DESC, id ASC")
    @Builder.Default
    private List<Research> researches = new ArrayList<>();

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void addSkill(Skill skill) {
        if (skills == null) skills = new ArrayList<>();
        skills.add(skill);
        skill.setProfile(this);
    }

    public void removeSkill(Skill skill) {
        if (skills != null) {
            skills.remove(skill);
            skill.setProfile(null);
        }
    }

    public void addTestimonial(Testimonial testimonial) {
        if (testimonials == null) testimonials = new ArrayList<>();
        testimonials.add(testimonial);
        testimonial.setProfile(this);
    }

    public void removeTestimonial(Testimonial testimonial) {
        if (testimonials != null) {
            testimonials.remove(testimonial);
            testimonial.setProfile(null);
        }
    }
}
