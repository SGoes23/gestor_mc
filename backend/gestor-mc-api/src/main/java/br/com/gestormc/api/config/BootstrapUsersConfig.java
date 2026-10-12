package br.com.gestormc.api.config;

import br.com.gestormc.api.auth.AccessProfile;
import br.com.gestormc.api.auth.AppUser;
import br.com.gestormc.api.auth.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BootstrapUsersConfig {

    @Bean
    public CommandLineRunner bootstrapUsers(AppUserRepository userRepository,
                                            PasswordEncoder passwordEncoder,
                                            @Value("${ADMIN_EMAIL:diretoria@gestormc.local}") String adminEmail,
                                            @Value("${ADMIN_PASSWORD:admin123}") String adminPassword,
                                            @Value("${MEMBER_EMAIL:membro@gestormc.local}") String memberEmail,
                                            @Value("${MEMBER_PASSWORD:membro123}") String memberPassword) {
        return args -> {
            if (!userRepository.existsByEmail(adminEmail)) {
                AppUser admin = new AppUser(adminEmail, passwordEncoder.encode(adminPassword), AccessProfile.DIRETORIA);
                userRepository.save(admin);
            }
            if (!userRepository.existsByEmail(memberEmail)) {
                AppUser member = new AppUser(memberEmail, passwordEncoder.encode(memberPassword), AccessProfile.MEMBRO);
                userRepository.save(member);
            }
        };
    }
}
