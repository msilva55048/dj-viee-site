package com.djviee.site.service;

import com.djviee.site.model.Music;
import com.djviee.site.repository.MusicRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class MusicService {

    private final MusicRepository musicRepository;

    private static final Pattern YOUTUBE_PATTERN = Pattern.compile(
            "(?:youtube\\.com/(?:watch\\?v=|embed/|shorts/)|youtu\\.be/)([A-Za-z0-9_-]{11})"
    );


    public MusicService(
            MusicRepository musicRepository
    ) {
        this.musicRepository = musicRepository;
    }


    // ========================================
    // TODAS AS MÚSICAS
    // USADO NO PAINEL ADMIN
    // ========================================

    public List<Music> findAll() {

        return musicRepository
                .findAllByOrderByPositionAsc();
    }


    // ========================================
    // SOMENTE AS 6 PRIMEIRAS
    // USADO NO SITE PÚBLICO
    // ========================================

    public List<Music> findFeaturedMusics() {

        return musicRepository
                .findTop6ByOrderByPositionAsc();
    }


    // ========================================
    // ADICIONAR NOVA MÚSICA
    // ========================================

    public Music saveMusic(
            String title,
            String artists,
            String youtubeUrl
    ) {

        String videoId =
                extractYoutubeVideoId(
                        youtubeUrl
                );

        if (videoId == null) {

            throw new IllegalArgumentException(
                    "Link do YouTube inválido."
            );
        }


        /*
         * Toda música já cadastrada
         * avança uma posição.
         *
         * 1 vira 2
         * 2 vira 3
         * 3 vira 4
         * etc.
         */

        List<Music> existingMusics =
                musicRepository
                        .findAllByOrderByPositionAsc();


        for (Music existingMusic : existingMusics) {

            existingMusic.setPosition(
                    existingMusic.getPosition() + 1
            );
        }


        musicRepository.saveAll(
                existingMusics
        );


        /*
         * A nova música sempre entra
         * na posição número 1.
         */

        Music music = new Music();

        music.setTitle(
                title.trim()
        );

        music.setArtists(
                artists.trim()
        );

        music.setYoutubeUrl(
                youtubeUrl.trim()
        );

        music.setYoutubeVideoId(
                videoId
        );

        music.setPosition(
                1
        );

        music.setCreatedAt(
                LocalDateTime.now()
        );


        return musicRepository.save(
                music
        );
    }


    // ========================================
    // EXCLUIR MÚSICA
    // ========================================

    public void deleteMusic(
            Long id
    ) {

        if (!musicRepository.existsById(id)) {

            throw new IllegalArgumentException(
                    "Música não encontrada."
            );
        }


        musicRepository.deleteById(
                id
        );


        reorganizePositions();
    }


    // ========================================
    // BUSCAR POR ID
    // ========================================

    public Music findById(
            Long id
    ) {

        return musicRepository
                .findById(id)
                .orElseThrow(
                        () ->
                                new IllegalArgumentException(
                                        "Música não encontrada."
                                )
                );
    }


    // ========================================
    // REORGANIZAR POSIÇÕES
    // APÓS UMA EXCLUSÃO
    // ========================================

    private void reorganizePositions() {

        List<Music> musics =
                musicRepository
                        .findAllByOrderByPositionAsc();


        int position = 1;


        for (Music music : musics) {

            music.setPosition(
                    position
            );

            position++;
        }


        musicRepository.saveAll(
                musics
        );
    }


    // ========================================
    // EXTRAIR ID DO YOUTUBE
    // ========================================

    public String extractYoutubeVideoId(
            String youtubeUrl
    ) {

        if (
                youtubeUrl == null
                        ||
                        youtubeUrl.isBlank()
        ) {

            return null;
        }


        Matcher matcher =
                YOUTUBE_PATTERN.matcher(
                        youtubeUrl.trim()
                );


        if (matcher.find()) {

            return matcher.group(
                    1
            );
        }


        return null;
    }

}
