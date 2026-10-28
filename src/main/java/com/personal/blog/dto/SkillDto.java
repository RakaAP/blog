package com.personal.blog.dto;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String icon;
    private Integer proficiency;
    private Integer percent;
    private String color;
    private String category;
    private Integer displayOrder;
}
