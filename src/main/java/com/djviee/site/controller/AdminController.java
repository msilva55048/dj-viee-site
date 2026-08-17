package com.djviee.site.controller;

import com.djviee.site.model.About;
import com.djviee.site.service.AboutService;
import com.djviee.site.service.AdminUserService;
import com.djviee.site.service.EventService;
import com.djviee.site.service.MusicService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.security.Principal;
import java.time.LocalDate;

@Controller
public class AdminController {

    private final AboutService aboutService;
    private final MusicService musicService;
    private final EventService eventService;
    private final AdminUserService adminUserService;


    public AdminController(
            AboutService aboutService,
            MusicService musicService,
            EventService eventService,
            AdminUserService adminUserService
    ) {
        this.aboutService = aboutService;
        this.musicService = musicService;
        this.eventService = eventService;
        this.adminUserService = adminUserService;
    }


    // ========================================
    // DASHBOARD
    // ========================================

    @GetMapping("/admin")
    public String admin() {

        return "admin/dashboard";
    }


    // ========================================
    // SOBRE
    // ========================================

    @GetMapping("/admin/sobre")
    public String sobre(
            Model model
    ) {

        About about =
                aboutService.getAbout();

        model.addAttribute(
                "about",
                about
        );

        return "admin/sobre";
    }


    @PostMapping("/admin/sobre")
    public String salvarSobre(

            @RequestParam("paragraph1")
            String paragraph1,

            @RequestParam("paragraph2")
            String paragraph2,

            @RequestParam("paragraph3")
            String paragraph3,

            RedirectAttributes redirectAttributes
    ) {

        aboutService.saveAbout(
                paragraph1,
                paragraph2,
                paragraph3
        );

        redirectAttributes.addFlashAttribute(
                "successMessage",
                "Informações atualizadas com sucesso."
        );

        return "redirect:/admin/sobre";
    }


    // ========================================
    // MÚSICAS
    // ========================================

    @GetMapping("/admin/musicas")
    public String musicas(
            Model model
    ) {

        model.addAttribute(
                "musics",
                musicService.findAll()
        );

        return "admin/musicas";
    }


    @PostMapping("/admin/musicas")
    public String adicionarMusica(

            @RequestParam("title")
            String title,

            @RequestParam("artists")
            String artists,

            @RequestParam("youtubeUrl")
            String youtubeUrl,

            RedirectAttributes redirectAttributes
    ) {

        try {

            musicService.saveMusic(
                    title,
                    artists,
                    youtubeUrl
            );

            redirectAttributes.addFlashAttribute(
                    "successMessage",
                    "Música adicionada com sucesso."
            );

        } catch (IllegalArgumentException exception) {

            redirectAttributes.addFlashAttribute(
                    "errorMessage",
                    exception.getMessage()
            );
        }

        return "redirect:/admin/musicas";
    }


    @PostMapping("/admin/musicas/excluir")
    public String excluirMusica(

            @RequestParam("id")
            Long id,

            RedirectAttributes redirectAttributes
    ) {

        try {

            musicService.deleteMusic(id);

            redirectAttributes.addFlashAttribute(
                    "successMessage",
                    "Música excluída com sucesso."
            );

        } catch (IllegalArgumentException exception) {

            redirectAttributes.addFlashAttribute(
                    "errorMessage",
                    exception.getMessage()
            );
        }

        return "redirect:/admin/musicas";
    }


    // ========================================
    // EVENTOS
    // ========================================

    @GetMapping("/admin/eventos")
    public String eventos(
            Model model
    ) {

        model.addAttribute(
                "events",
                eventService.findAll()
        );

        return "admin/eventos";
    }


    @PostMapping("/admin/eventos")
    public String adicionarEvento(

            @RequestParam("title")
            String title,

            @RequestParam("eventDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate eventDate,

            @RequestParam("city")
            String city,

            @RequestParam("location")
            String location,

            @RequestParam(
                    value = "description",
                    required = false
            )
            String description,

            RedirectAttributes redirectAttributes
    ) {

        try {

            eventService.createEvent(
                    title,
                    eventDate,
                    city,
                    location,
                    description
            );

            redirectAttributes.addFlashAttribute(
                    "successMessage",
                    "Evento adicionado com sucesso."
            );

        } catch (Exception exception) {

            redirectAttributes.addFlashAttribute(
                    "errorMessage",
                    "Não foi possível adicionar o evento."
            );
        }

        return "redirect:/admin/eventos";
    }


    @PostMapping("/admin/eventos/editar")
    public String editarEvento(

            @RequestParam("id")
            Long id,

            @RequestParam("title")
            String title,

            @RequestParam("eventDate")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate eventDate,

            @RequestParam("city")
            String city,

            @RequestParam("location")
            String location,

            @RequestParam(
                    value = "description",
                    required = false
            )
            String description,

            RedirectAttributes redirectAttributes
    ) {

        try {

            eventService.updateEvent(
                    id,
                    title,
                    eventDate,
                    city,
                    location,
                    description
            );

            redirectAttributes.addFlashAttribute(
                    "successMessage",
                    "Evento atualizado com sucesso."
            );

        } catch (IllegalArgumentException exception) {

            redirectAttributes.addFlashAttribute(
                    "errorMessage",
                    exception.getMessage()
            );
        }

        return "redirect:/admin/eventos";
    }


    @PostMapping("/admin/eventos/excluir")
    public String excluirEvento(

            @RequestParam("id")
            Long id,

            RedirectAttributes redirectAttributes
    ) {

        try {

            eventService.deleteEvent(id);

            redirectAttributes.addFlashAttribute(
                    "successMessage",
                    "Evento excluído com sucesso."
            );

        } catch (IllegalArgumentException exception) {

            redirectAttributes.addFlashAttribute(
                    "errorMessage",
                    exception.getMessage()
            );
        }

        return "redirect:/admin/eventos";
    }


    // ========================================
    // CONTA
    // ========================================

    @GetMapping("/admin/conta")
    public String conta(
            Principal principal,
            Model model
    ) {

        model.addAttribute(
                "username",
                principal.getName()
        );

        return "admin/conta";
    }


    // ========================================
    // TROCAR SENHA
    // ========================================

    @PostMapping("/admin/conta/senha")
    public String alterarSenha(

            Principal principal,

            @RequestParam("currentPassword")
            String currentPassword,

            @RequestParam("newPassword")
            String newPassword,

            @RequestParam("confirmPassword")
            String confirmPassword,

            RedirectAttributes redirectAttributes
    ) {

        try {

            adminUserService.changePassword(
                    principal.getName(),
                    currentPassword,
                    newPassword,
                    confirmPassword
            );

            redirectAttributes.addFlashAttribute(
                    "successMessage",
                    "Senha alterada com sucesso."
            );

        } catch (IllegalArgumentException exception) {

            redirectAttributes.addFlashAttribute(
                    "errorMessage",
                    exception.getMessage()
            );
        }

        return "redirect:/admin/conta";
    }

}