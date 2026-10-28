package com.personal.blog.service;

import com.personal.blog.dto.ProfilePublicDto;
import com.personal.blog.dto.ProfileUpdateRequest;
import com.personal.blog.dto.SkillDto;
import com.personal.blog.dto.TestimonialDto;
import org.springframework.web.multipart.MultipartFile;

public interface ProfileService {
    ProfilePublicDto getPublicProfile();
    ProfilePublicDto updateProfile(ProfileUpdateRequest request);
    String uploadAvatar(MultipartFile file);
    com.personal.blog.dto.AvatarImageDto getAvatarImage();

    // Skill CRUD endpoints
    SkillDto addSkill(SkillDto skillDto);
    SkillDto updateSkill(Long skillId, SkillDto skillDto);
    void deleteSkill(Long skillId);

    // Testimonial CRUD endpoints
    TestimonialDto addTestimonial(TestimonialDto testimonialDto);
    TestimonialDto updateTestimonial(Long testimonialId, TestimonialDto testimonialDto);
    void deleteTestimonial(Long testimonialId);
}
