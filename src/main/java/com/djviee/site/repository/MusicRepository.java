package com.djviee.site.repository;

import com.djviee.site.model.Music;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MusicRepository extends JpaRepository<Music, Long> {

    List<Music> findAllByOrderByPositionAsc();

    List<Music> findTop6ByOrderByPositionAsc();
}