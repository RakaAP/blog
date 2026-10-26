package com.personal.blog.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 1. Endpoint Publik: Pembacaan Data & Konfigurasi
                        .requestMatchers(HttpMethod.GET, "/api/profile", "/api/profile/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/settings", "/api/settings/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/projects/**", "/api/career/**", "/api/posts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comments/**").permitAll()

                        // 2. Endpoint Publik: Interaksi Pengunjung (Komentar & Formulir Kontak)
                        .requestMatchers(HttpMethod.POST, "/api/comments/**", "/api/contact").permitAll()

                        // 3. Endpoint Auth Publik
                        .requestMatchers("/api/auth/**").permitAll()

                        // 4. Dokumentasi OpenAPI & Health Actuator
                        .requestMatchers("/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/actuator/**", "/api/health").permitAll()

                        // 5. Endpoint Terproteksi: Mutasi Data (Hanya Dapat Diakses Oleh Peran ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/posts/**", "/api/projects/**", "/api/career/**", "/api/settings/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/posts/**", "/api/projects/**", "/api/career/**", "/api/profile/**", "/api/settings/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/posts/**", "/api/projects/**", "/api/career/**", "/api/profile/**", "/api/settings/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/profile/avatar").hasRole("ADMIN")

                        // 6. Request lainnya
                        .anyRequest().permitAll()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.getWriter().write("{\"status\":\"UNAUTHORIZED\",\"message\":\"Akses ditolak: Autentikasi token JWT diperlukan.\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.getWriter().write("{\"status\":\"FORBIDDEN\",\"message\":\"Akses ditolak: Hanya peran ADMIN yang memiliki hak akses.\"}");
                        })
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
