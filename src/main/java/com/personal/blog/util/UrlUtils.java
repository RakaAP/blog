package com.personal.blog.util;

import lombok.extern.slf4j.Slf4j;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility untuk pengolahan URL, termasuk pembersihan link redirect Google.
 */
@Slf4j
public final class UrlUtils {

    private static final Pattern GOOGLE_REDIRECT_PATTERN = Pattern.compile(
            "^(?:https?:)?//(?:[a-zA-Z0-9-]+\\.)?google\\.[a-zA-Z.]+/url\\?.*(?:url|q)=([^&]+).*",
            Pattern.CASE_INSENSITIVE
    );

    private UrlUtils() {
        // Private constructor for utility class
    }

    /**
     * Membersihkan URL publikasi dari link redirect (contoh: redirect Google)
     * dan mengekstrak target URL aslinya.
     *
     * @param rawUrl URL mentah yang dimasukkan admin/seeder
     * @return URL target yang bersih atau rawUrl jika bukan redirect
     */
    public static String cleanPublicationUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return rawUrl;
        }
        String trimmed = rawUrl.trim();

        try {
            if (trimmed.contains("google.") && trimmed.contains("/url?")) {
                Matcher matcher = GOOGLE_REDIRECT_PATTERN.matcher(trimmed);
                if (matcher.matches()) {
                    String encodedTarget = matcher.group(1);
                    String decoded = URLDecoder.decode(encodedTarget, StandardCharsets.UTF_8);
                    if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
                        log.info("[URL CLEANER] Berhasil mengekstrak URL publikasi asli dari redirect Google: {} -> {}", trimmed, decoded);
                        trimmed = decoded;
                    }
                }

                // Fallback parsing parameter q= atau url= manual dari query string
                int queryIdx = trimmed.indexOf('?');
                if (queryIdx != -1) {
                    String query = trimmed.substring(queryIdx + 1);
                    for (String param : query.split("&")) {
                        String[] pair = param.split("=", 2);
                        if (pair.length == 2) {
                            String key = pair[0];
                            if ("url".equalsIgnoreCase(key) || "q".equalsIgnoreCase(key)) {
                                String decoded = URLDecoder.decode(pair[1], StandardCharsets.UTF_8);
                                if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
                                    log.info("[URL CLEANER] Berhasil mengekstrak URL publikasi via query fallback: {} -> {}", trimmed, decoded);
                                    trimmed = decoded;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // Bersihkan sisa parameter tracking Google (&ved=..., &usg=..., dll)
            String[] trackingKeys = new String[]{"&ved=", "&usg=", "&opi=", "&rct=", "&sa=", "&source=", "?ved=", "?usg="};
            for (String key : trackingKeys) {
                int idx = trimmed.indexOf(key);
                if (idx != -1) {
                    log.info("[URL CLEANER] Memangkas parameter tracking Google ({}): {} -> {}", key, trimmed, trimmed.substring(0, idx));
                    trimmed = trimmed.substring(0, idx);
                }
            }
        } catch (Exception e) {
            log.warn("[URL CLEANER] Gagal membersihkan URL '{}': {}", trimmed, e.getMessage());
        }

        return trimmed;
    }
}
