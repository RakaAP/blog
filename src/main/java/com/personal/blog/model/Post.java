package com.personal.blog.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 100)
    private String author;

    @Column(length = 50)
    private String category;

    @Column(length = 50)
    private String readTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.author == null || this.author.isBlank()) {
            this.author = "Admin";
        }
        if (this.category == null || this.category.isBlank()) {
            this.category = "Technology";
        }
        populateDerivedFields();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        populateDerivedFields();
    }

    private void populateDerivedFields() {
        if ((this.slug == null || this.slug.isBlank()) && this.title != null) {
            this.slug = toSlug(this.title);
        }
        if ((this.summary == null || this.summary.isBlank()) && this.content != null) {
            String clean = this.content.replaceAll("[#*`_\\[\\]]", " ").trim();
            this.summary = clean.length() > 160 ? clean.substring(0, 157) + "..." : clean;
        }
        if (this.content != null) {
            int words = this.content.trim().split("\\s+").length;
            int mins = Math.max(1, (int) Math.ceil(words / 150.0));
            this.readTime = mins + " mnt baca";
        }
    }

    public static String toSlug(String input) {
        if (input == null) return "";
        String nonLatin = "[^\\w\\s-]";
        String whitespace = "[\\s+]";
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        String slug = normalized.replaceAll(nonLatin, "")
                .trim()
                .replaceAll(whitespace, "-")
                .replaceAll("-+", "-")
                .toLowerCase();
        return slug.isEmpty() ? "post-" + System.currentTimeMillis() : slug;
    }
}
