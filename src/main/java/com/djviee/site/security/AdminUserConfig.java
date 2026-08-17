package com.djviee.site.security;

import com.djviee.site.model.AdminUser;
import com.djviee.site.repository.AdminUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class AdminUserConfig {

    // ========================================
    // CRIPTOGRAFIA DA SENHA
    // ========================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    // ========================================
    // LOGIN PELO POSTGRESQL
    // ========================================

    @Bean
    public UserDetailsService userDetailsService(
            AdminUserRepository adminUserRepository
    ) {

        return username -> {

            AdminUser admin =
                    adminUserRepository
                            .findByUsername(username)
                            .orElseThrow(
                                    () -> new UsernameNotFoundException(
                                            "Administrador não encontrado."
                                    )
                            );

            return User
                    .withUsername(admin.getUsername())
                    .password(admin.getPassword())
                    .roles("ADMIN")
                    .build();
        };
    }


    // ========================================
    // ADMIN INICIAL
    //
    // Só será criado em um banco vazio se
    // ADMIN_INITIAL_USERNAME e
    // ADMIN_INITIAL_PASSWORD existirem
    // como variáveis de ambiente.
    //
    // Nenhuma senha fica escrita no código.
    // ========================================

    @Bean
    public CommandLineRunner createInitialAdmin(

            AdminUserRepository adminUserRepository,

            PasswordEncoder passwordEncoder,

            @Value("${ADMIN_INITIAL_USERNAME:}")
            String initialUsername,

            @Value("${ADMIN_INITIAL_PASSWORD:}")
            String initialPassword
    ) {

        return args -> {

            if (
                    initialUsername == null
                            || initialUsername.isBlank()
                            || initialPassword == null
                            || initialPassword.isBlank()
            ) {

                return;
            }


            String username =
                    initialUsername.trim();


            if (
                    !adminUserRepository
                            .existsByUsername(username)
            ) {

                AdminUser admin =
                        new AdminUser();

                admin.setUsername(
                        username
                );

                admin.setPassword(
                        passwordEncoder.encode(
                                initialPassword
                        )
                );

                admin.setCreatedAt(
                        LocalDateTime.now()
                );

                admin.setUpdatedAt(
                        LocalDateTime.now()
                );


                adminUserRepository.save(
                        admin
                );


                System.out.println(
                        "Administrador inicial criado no banco."
                );
            }
        };
    }
}