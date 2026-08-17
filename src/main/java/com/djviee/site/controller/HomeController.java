package com.djviee.site.controller;

import com.djviee.site.service.AboutService;
import com.djviee.site.service.EventService;
import com.djviee.site.service.MusicService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    private final EventService eventService;
    private final AboutService aboutService;
    private final MusicService musicService;


    public HomeController(
            EventService eventService,
            AboutService aboutService,
            MusicService musicService
    ) {
        this.eventService = eventService;
        this.aboutService = aboutService;
        this.musicService = musicService;
    }


    @GetMapping("/")
    public String home(Model model) {

        model.addAttribute(
                "events",
                eventService.findAll()
        );

        model.addAttribute(
                "about",
                aboutService.getAbout()
        );

        model.addAttribute(
                "musics",
                musicService.findFeaturedMusics()
        );

        return "index";
    }
}