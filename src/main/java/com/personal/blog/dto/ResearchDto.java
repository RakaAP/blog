package com.personal.blog.dto;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResearchDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long profileId;
    private String year;
    private String journalName;
    private String title;
    private String summary;
    private String researchers;
    private String doi;
    private String publicationUrl;
    private Integer displayOrder;
}
