package com.djviee.site.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "music")
public class Music {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            nullable = false,
            length = 180
    )
    private String title;

    @Column(
            nullable = false,
            length = 220
    )
    private String artists;

    @Column(
            name = "youtube_url",
            nullable = false,
            length = 500
    )
    private String youtubeUrl;

    @Column(
            name = "youtube_video_id",
            nullable = false,
            length = 30
    )
    private String youtubeVideoId;

    @Column(
            name = "position",
            nullable = false
    )
    private Integer position;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;


    public Music() {
    }


    public Music(
            String title,
            String artists,
            String youtubeUrl,
            String youtubeVideoId,
            Integer position
    ) {
        this.title = title;
        this.artists = artists;
        this.youtubeUrl = youtubeUrl;
        this.youtubeVideoId = youtubeVideoId;
        this.position = position;
        this.createdAt = LocalDateTime.now();
    }


    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
    }


    public String getTitle() {
        return title;
    }


    public void setTitle(String title) {
        this.title = title;
    }


    public String getArtists() {
        return artists;
    }


    public void setArtists(String artists) {
        this.artists = artists;
    }


    public String getYoutubeUrl() {
        return youtubeUrl;
    }


    public void setYoutubeUrl(String youtubeUrl) {
        this.youtubeUrl = youtubeUrl;
    }


    public String getYoutubeVideoId() {
        return youtubeVideoId;
    }


    public void setYoutubeVideoId(String youtubeVideoId) {
        this.youtubeVideoId = youtubeVideoId;
    }


    public Integer getPosition() {
        return position;
    }


    public void setPosition(Integer position) {
        this.position = position;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }


    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}