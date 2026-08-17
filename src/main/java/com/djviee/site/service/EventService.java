package com.djviee.site.service;

import com.djviee.site.model.Event;
import com.djviee.site.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class EventService {

    private final EventRepository eventRepository;


    public EventService(
            EventRepository eventRepository
    ) {
        this.eventRepository = eventRepository;
    }


    public Event save(
            Event event
    ) {
        return eventRepository.save(event);
    }


    public List<Event> findAll() {
        return eventRepository.findAll();
    }


    public Optional<Event> findById(
            Long id
    ) {
        return eventRepository.findById(id);
    }


    public void deleteById(
            Long id
    ) {
        eventRepository.deleteById(id);
    }


    // ========================================
    // CRIAR EVENTO PELO ADMIN
    // ========================================

    public Event createEvent(
            String title,
            LocalDate eventDate,
            String city,
            String location,
            String description
    ) {

        Event event = new Event();

        event.setTitle(
                title.trim()
        );

        event.setEventDate(
                eventDate
        );

        event.setCity(
                city.trim()
        );

        event.setLocation(
                location.trim()
        );

        event.setDescription(
                description == null
                        ? ""
                        : description.trim()
        );

        return eventRepository.save(
                event
        );
    }


    // ========================================
    // ATUALIZAR EVENTO
    // ========================================

    public Event updateEvent(
            Long id,
            String title,
            LocalDate eventDate,
            String city,
            String location,
            String description
    ) {

        Event event =
                eventRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Evento não encontrado."
                                        )
                        );

        event.setTitle(
                title.trim()
        );

        event.setEventDate(
                eventDate
        );

        event.setCity(
                city.trim()
        );

        event.setLocation(
                location.trim()
        );

        event.setDescription(
                description == null
                        ? ""
                        : description.trim()
        );

        return eventRepository.save(
                event
        );
    }


    // ========================================
    // EXCLUIR EVENTO
    // ========================================

    public void deleteEvent(
            Long id
    ) {

        if (!eventRepository.existsById(id)) {

            throw new IllegalArgumentException(
                    "Evento não encontrado."
            );
        }

        eventRepository.deleteById(id);
    }
}