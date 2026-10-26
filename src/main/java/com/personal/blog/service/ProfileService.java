package com.personal.blog.service;

import com.personal.blog.dto.ProfilePublicDto;
import com.personal.blog.dto.ProfileUpdateRequest;
import org.springframework.web.multipart.MultipartFile;

public interface ProfileService {
    ProfilePublicDto getPublicProfile();
    ProfilePublicDto updateProfile(ProfileUpdateRequest request);
    String uploadAvatar(MultipartFile file);
}
