package br.com.gestormc.api.config;

import br.com.gestormc.api.auth.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/api/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/members/**", "/api/motorcycles/**").hasAnyRole("MEMBRO", "DIRETORIA")
                        .requestMatchers(HttpMethod.GET, "/api/monthly-fees/**").hasAnyRole("MEMBRO", "DIRETORIA")
                        .requestMatchers(HttpMethod.GET, "/api/events/**").hasAnyRole("MEMBRO", "DIRETORIA")
                        .requestMatchers(HttpMethod.POST, "/api/members/**", "/api/motorcycles/**").hasRole("DIRETORIA")
                        .requestMatchers(HttpMethod.POST, "/api/monthly-fees/**").hasRole("DIRETORIA")
                        .requestMatchers(HttpMethod.POST, "/api/events/**").hasRole("DIRETORIA")
                        .requestMatchers(HttpMethod.PATCH, "/api/monthly-fees/**").hasRole("DIRETORIA")
                        .requestMatchers(HttpMethod.PUT, "/api/members/**", "/api/motorcycles/**").hasRole("DIRETORIA")
                        .requestMatchers(HttpMethod.PUT, "/api/events/**").hasRole("DIRETORIA")
                        .requestMatchers(HttpMethod.DELETE, "/api/members/**", "/api/motorcycles/**").hasRole("DIRETORIA")
                        .requestMatchers(HttpMethod.DELETE, "/api/events/**").hasRole("DIRETORIA")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
