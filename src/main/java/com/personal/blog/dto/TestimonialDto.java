package com.personal.blog.dto;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestimonialDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String quote;
    private String author;
    private String role;
    private String avatarUrl;
    private Integer displayOrder;
}
