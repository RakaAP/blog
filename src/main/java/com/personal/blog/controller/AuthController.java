package com.personal.blog.controller;

import com.personal.blog.model.User;
import com.personal.blog.repository.UserRepository;
import com.personal.blog.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"})
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Endpoint otentikasi login admin berbasis basis data PostgreSQL dan BCrypt hash.
     * Mengeliminasi seluruh kredensial statis/hardcoded dari kode sumber Java.
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "ERROR");
            error.put("message", "Username dan password wajib disertakan.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        Optional<User> userOpt = userRepository.findByUsername(username.trim());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                String role = user.getRole() != null ? user.getRole() : "ROLE_ADMIN";
                String token = jwtUtil.generateToken(user.getUsername(), role);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "SUCCESS");
                response.put("token", token);
                response.put("role", role);
                response.put("username", user.getUsername());
                response.put("displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());
                response.put("message", "Autentikasi admin JWT berhasil diverifikasi dari database PostgreSQL.");

                log.info("Pengguna '{}' berhasil login via verifikasi database.", user.getUsername());
                return ResponseEntity.ok(response);
            }
        }

        log.warn("Upaya login gagal untuk username: {}", username);
        Map<String, Object> error = new HashMap<>();
        error.put("status", "ERROR");
        error.put("message", "Kredensial username atau password tidak valid.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Mengambil informasi sesi aktif dari token JWT dan verifikasi status pengguna di database.
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.extractUsername(token);
                if (username != null) {
                    Optional<User> userOpt = userRepository.findByUsername(username);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        Map<String, Object> response = new HashMap<>();
                        response.put("authenticated", true);
                        response.put("username", user.getUsername());
                        response.put("displayName", user.getDisplayName());
                        response.put("role", user.getRole());
                        return ResponseEntity.ok(response);
                    }
                }
            }
        }
        Map<String, Object> error = new HashMap<>();
        error.put("authenticated", false);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
}
