package com.personal.blog.service;

import com.personal.blog.model.Post;
import com.personal.blog.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;

    @Transactional(readOnly = true)
    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Page<Post> getPostsPaged(String search, String category, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        if (search != null && !search.isBlank()) {
            return postRepository.searchPosts(search.trim(), pageable);
        }
        if (category != null && !category.isBlank() && !"All".equalsIgnoreCase(category)) {
            return postRepository.findByCategoryIgnoreCaseOrderByCreatedAtDesc(category.trim(), pageable);
        }
        return postRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional(readOnly = true)
    public Optional<Post> getPostById(Long id) {
        return postRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Post> getPostBySlug(String slug) {
        return postRepository.findBySlug(slug);
    }

    @Transactional(readOnly = true)
    public Optional<Post> getPostByIdOrSlug(String identifier) {
        if (identifier == null || identifier.isBlank()) return Optional.empty();
        try {
            Long id = Long.parseLong(identifier);
            return postRepository.findById(id);
        } catch (NumberFormatException e) {
            return postRepository.findBySlug(identifier);
        }
    }

    @Transactional
    public Post createPost(Post post) {
        return postRepository.save(post);
    }

    @Transactional
    public Optional<Post> updatePost(Long id, Post postDetails) {
        return postRepository.findById(id).map(existing -> {
            existing.setTitle(postDetails.getTitle());
            existing.setContent(postDetails.getContent());
            if (postDetails.getSlug() != null && !postDetails.getSlug().isBlank()) {
                existing.setSlug(postDetails.getSlug());
            }
            if (postDetails.getAuthor() != null && !postDetails.getAuthor().isBlank()) {
                existing.setAuthor(postDetails.getAuthor());
            }
            if (postDetails.getCategory() != null && !postDetails.getCategory().isBlank()) {
                existing.setCategory(postDetails.getCategory());
            }
            return postRepository.save(existing);
        });
    }

    @Transactional
    public boolean deletePost(Long id) {
        return postRepository.findById(id).map(post -> {
            postRepository.delete(post);
            return true;
        }).orElse(false);
    }
}
