package com.personal.blog.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UrlUtilsTest {

    @Test
    void testCleanPublicationUrl_directUrl() {
        String direct = "http://etd.repository.ugm.ac.id/penelitian/unduh/573357";
        assertEquals(direct, UrlUtils.cleanPublicationUrl(direct));
    }

    @Test
    void testCleanPublicationUrl_googleRedirectWithUrlParam() {
        String googleUrl = "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=http%3A%2F%2Fetd.repository.ugm.ac.id%2Fpenelitian%2Funduh%2F573357&ved=2ahUKEwj";
        assertEquals("http://etd.repository.ugm.ac.id/penelitian/unduh/573357", UrlUtils.cleanPublicationUrl(googleUrl));
    }

    @Test
    void testCleanPublicationUrl_googleRedirectWithQParam() {
        String googleUrl = "https://google.com/url?q=https%3A%2F%2Fieeexplore.ieee.org%2Fdocument%2F12345&sa=U&ved=0ahUKEw";
        assertEquals("https://ieeexplore.ieee.org/document/12345", UrlUtils.cleanPublicationUrl(googleUrl));
    }

    @Test
    void testCleanPublicationUrl_rawUrlWithGoogleTrackingArtifacts() {
        String dirtyUrl = "http://etd.repository.ugm.ac.id/penelitian/unduh/573142&ved=2ahUKEwjY3Obo8tuXAxXdmuEIHZnBJ1EQFnoECBoQAQ&usg=AOvVaw1X8jv8xEgNvFnZC3jsLfZL";
        assertEquals("http://etd.repository.ugm.ac.id/penelitian/unduh/573142", UrlUtils.cleanPublicationUrl(dirtyUrl));
    }

    @Test
    void testCleanPublicationUrl_nullOrBlank() {
        assertNull(UrlUtils.cleanPublicationUrl(null));
        assertEquals("", UrlUtils.cleanPublicationUrl(""));
        assertEquals("   ", UrlUtils.cleanPublicationUrl("   "));
    }
}
