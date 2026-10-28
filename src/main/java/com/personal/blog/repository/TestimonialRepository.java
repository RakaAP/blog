package com.personal.blog.repository;

import com.personal.blog.model.Testimonial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestimonialRepository extends JpaRepository<Testimonial, Long> {
    List<Testimonial> findByProfileIdOrderByDisplayOrderAscIdAsc(Long profileId);
}
