package com.example.snake.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/game")
public class GameController {

    @GetMapping("/info")
    public Map<String, Object> info() {
        return Map.of(
                "name", "Snake Game",
                "status", "ready",
                "serverTime", Instant.now().toString()
        );
    }
}
