package com.example.snake.api;

import com.example.snake.game.SnakeGameService;
import com.example.snake.game.SnakeGameService.GameSnapshot;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/game")
public class GameController {

    private final SnakeGameService gameService;

    public GameController(SnakeGameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/info")
    public Map<String, Object> info() {
        return Map.of(
                "name", "Snake Game",
                "status", "ready",
                "serverTime", Instant.now().toString()
        );
    }

    @GetMapping("/state")
    public GameSnapshot state() {
        return gameService.state();
    }

    @PostMapping("/start")
    public GameSnapshot start() {
        return gameService.start();
    }

    @PostMapping("/pause")
    public GameSnapshot pause() {
        return gameService.pause();
    }

    @PostMapping("/restart")
    public GameSnapshot restart() {
        return gameService.restart();
    }

    @PostMapping("/tick")
    public GameSnapshot tick() {
        return gameService.tick();
    }

    @PostMapping("/move")
    public GameSnapshot move(@RequestBody MoveRequest request) {
        return gameService.move(request.direction());
    }

    public record MoveRequest(String direction) {
    }
}
