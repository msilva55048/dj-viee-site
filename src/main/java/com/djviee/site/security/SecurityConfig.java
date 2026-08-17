package com.djviee.site.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .authorizeHttpRequests(authorize -> authorize

                        // SITE PÚBLICO
                        .requestMatchers(
                                "/",
                                "/css/**",
                                "/js/**",
                                "/imagem/**"
                        ).permitAll()

                        // PAINEL ADMINISTRATIVO
                        .requestMatchers("/admin/**").authenticated()

                        // QUALQUER OUTRA ROTA
                        .anyRequest().permitAll()
                )

                // LOGIN PADRÃO TEMPORÁRIO
                .formLogin(form -> form
                        .permitAll()
                )

                // LOGOUT
                .logout(logout -> logout
                        .permitAll()
                );

        return http.build();
    }
}