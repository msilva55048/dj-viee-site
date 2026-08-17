package com.djviee.site.service;

import com.djviee.site.model.About;
import com.djviee.site.repository.AboutRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AboutService {

    private final AboutRepository aboutRepository;


    public AboutService(AboutRepository aboutRepository) {
        this.aboutRepository = aboutRepository;
    }


    public About getAbout() {

        List<About> aboutList = aboutRepository.findAll();

        if (!aboutList.isEmpty()) {
            return aboutList.getFirst();
        }

        About about = new About();

        about.setParagraph1(
                "Há dez anos, o DJ e produtor VIEE transforma sua paixão pela música em energia e conexão com o público. " +
                        "Especialista em funk e mega funk, vem construindo uma identidade própria e conquistando cada vez mais espaço na cena."
        );

        about.setParagraph2(
                "Com quase 6 milhões de visualizações, suas produções refletem a força de uma trajetória construída com dedicação, evolução e propósito. " +
                        "Mais do que números, cada música lançada e cada apresentação representam a realização de um sonho."
        );

        about.setParagraph3(
                "Hoje, DJ VIEE segue produzindo, evoluindo e levando sua energia para cada vez mais pessoas. " +
                        "O sonho virou realidade — e o próximo capítulo está apenas começando."
        );

        about.setUpdatedAt(
                LocalDateTime.now()
        );

        return aboutRepository.save(about);
    }


    public About saveAbout(
            String paragraph1,
            String paragraph2,
            String paragraph3
    ) {

        About about = getAbout();

        about.setParagraph1(paragraph1);
        about.setParagraph2(paragraph2);
        about.setParagraph3(paragraph3);

        about.updateTimestamp();

        return aboutRepository.save(about);
    }

}