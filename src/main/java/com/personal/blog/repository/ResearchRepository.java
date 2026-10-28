package com.personal.blog.repository;

import com.personal.blog.model.Research;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResearchRepository extends JpaRepository<Research, Long> {
    List<Research> findByProfileIdOrderByDisplayOrderAscYearDescIdAsc(Long profileId);
    List<Research> findAllByOrderByDisplayOrderAscYearDescIdAsc();
}
