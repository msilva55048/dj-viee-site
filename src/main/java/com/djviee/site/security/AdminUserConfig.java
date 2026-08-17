package com.djviee.site.security;

import com.djviee.site.model.AdminUser;
import com.djviee.site.repository.AdminUserRepository;
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

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    @Bean
    public UserDetailsService userDetailsService(
            AdminUserRepository adminUserRepository
    ) {

        return username -> {

            AdminUser admin = adminUserRepository
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


    @Bean
    public CommandLineRunner createInitialAdmin(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder
    ) {

        return args -> {

            if (!adminUserRepository.existsByUsername("admin")) {

                AdminUser admin = new AdminUser();

                admin.setUsername("admin");

                admin.setPassword(
                        passwordEncoder.encode(
                                "TrocarDepois123!"
                        )
                );

                admin.setCreatedAt(
                        LocalDateTime.now()
                );

                admin.setUpdatedAt(
                        LocalDateTime.now()
                );

                adminUserRepository.save(admin);

                System.out.println(
                        "Administrador inicial criado no banco."
                );
            }
        };
    }
}