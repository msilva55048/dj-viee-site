package com.djviee.site.service;

import com.djviee.site.model.AdminUser;
import com.djviee.site.repository.AdminUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AdminUserService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;


    public AdminUserService(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
    }


    public AdminUser findByUsername(
            String username
    ) {

        return adminUserRepository
                .findByUsername(username)
                .orElseThrow(
                        () -> new IllegalArgumentException(
                                "Administrador não encontrado."
                        )
                );
    }


    public boolean passwordMatches(
            String rawPassword,
            String encodedPassword
    ) {

        return passwordEncoder.matches(
                rawPassword,
                encodedPassword
        );
    }


    public void changePassword(
            String username,
            String currentPassword,
            String newPassword,
            String confirmPassword
    ) {

        AdminUser admin =
                findByUsername(username);


        if (!passwordMatches(
                currentPassword,
                admin.getPassword()
        )) {

            throw new IllegalArgumentException(
                    "A senha atual está incorreta."
            );
        }


        if (
                newPassword == null
                        ||
                        newPassword.length() < 8
        ) {

            throw new IllegalArgumentException(
                    "A nova senha deve ter pelo menos 8 caracteres."
            );
        }


        if (!newPassword.equals(confirmPassword)) {

            throw new IllegalArgumentException(
                    "A confirmação da nova senha não confere."
            );
        }


        if (passwordMatches(
                newPassword,
                admin.getPassword()
        )) {

            throw new IllegalArgumentException(
                    "A nova senha deve ser diferente da senha atual."
            );
        }


        admin.setPassword(
                passwordEncoder.encode(
                        newPassword
                )
        );

        admin.setUpdatedAt(
                LocalDateTime.now()
        );

        adminUserRepository.save(
                admin
        );
    }
}