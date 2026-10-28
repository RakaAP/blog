package com.personal.blog.dto;

import lombok.*;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfilePublicDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String fullName;
    private String role;
    private String headline;
    private String bio;
    private String avatarUrl;
    private String photoUrl; // Alias to avatarUrl for frontend compatibility
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
    private String phone;
    private String cvUrl;
    private String highlightsJson;
    private String skillsJson;
    private String testimonialJson;

    @Builder.Default
    private List<SkillDto> skills = new ArrayList<>();

    @Builder.Default
    private List<TestimonialDto> testimonials = new ArrayList<>();

    private TestimonialDto testimonial;

    @Builder.Default
    private List<ResearchDto> researches = new ArrayList<>();
}
