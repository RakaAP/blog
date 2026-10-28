package com.personal.blog.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateRequest {

    private String name;
    private String fullName;
    private String role;
    private String headline;
    private String bio;
    private String avatarUrl;
    private String photoUrl;
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
    private String highlightsJson;
    private String cvUrl;
    private String phone;
    private String skillsJson;
    private String testimonialJson;

    private List<SkillDto> skills;
    private List<TestimonialDto> testimonials;
    private TestimonialDto testimonial;
    private List<ResearchDto> researches;
}
