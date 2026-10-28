package com.personal.blog.service;

import com.personal.blog.dto.ResearchDto;

import org.springframework.http.ResponseEntity;

import java.util.List;

public interface ResearchService {
    List<ResearchDto> getAllResearches();
    ResearchDto getResearchById(Long id);
    ResearchDto createResearch(ResearchDto dto);
    ResearchDto updateResearch(Long id, ResearchDto dto);
    void deleteResearch(Long id);
    ResponseEntity<byte[]> getResearchDocument(Long id);
}
