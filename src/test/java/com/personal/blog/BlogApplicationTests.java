package com.personal.blog;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootTest
class BlogApplicationTests {

	@Test
	void contextLoads() {
		String hash = new BCryptPasswordEncoder().encode("Admin*123");
		System.out.println("GENERATED_BCRYPT_HASH=" + hash);
	}

}
