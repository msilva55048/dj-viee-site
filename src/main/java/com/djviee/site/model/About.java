package com.djviee.site.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "about")
public class About {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "paragraph_1",
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String paragraph1;

    @Column(
            name = "paragraph_2",
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String paragraph2;

    @Column(
            name = "paragraph_3",
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String paragraph3;

    @Column(
            name = "updated_at",
            nullable = false
    )
    private LocalDateTime updatedAt;


    public About() {
    }


    public About(
            String paragraph1,
            String paragraph2,
            String paragraph3
    ) {
        this.paragraph1 = paragraph1;
        this.paragraph2 = paragraph2;
        this.paragraph3 = paragraph3;
        this.updatedAt = LocalDateTime.now();
    }


    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
    }


    public String getParagraph1() {
        return paragraph1;
    }


    public void setParagraph1(String paragraph1) {
        this.paragraph1 = paragraph1;
    }


    public String getParagraph2() {
        return paragraph2;
    }


    public void setParagraph2(String paragraph2) {
        this.paragraph2 = paragraph2;
    }


    public String getParagraph3() {
        return paragraph3;
    }


    public void setParagraph3(String paragraph3) {
        this.paragraph3 = paragraph3;
    }


    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }


    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }


    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }

}