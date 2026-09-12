package com.example.snake.game;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Random;

@Service
public class SnakeGameService {

    public static final int GRID_SIZE = 24;
    private static final int BASE_SPEED_MS = 150;
    private static final int MIN_SPEED_MS = 65;

    private final Random random = new Random();
    private final List<Position> snake = new ArrayList<>();

    private Direction direction;
    private Direction pendingDirection;
    private Position food;
    private int score;
    private int bestScore;
    private int level;
    private boolean running;
    private boolean gameOver;

    public SnakeGameService() {
        resetInternal();
    }

    public synchronized GameSnapshot start() {
        if (gameOver) {
            resetInternal();
        }
        running = true;
        return snapshot();
    }

    public synchronized GameSnapshot pause() {
        running = false;
        return snapshot();
    }

    public synchronized GameSnapshot restart() {
        resetInternal();
        running = true;
        return snapshot();
    }

    public synchronized GameSnapshot move(String requestedDirection) {
        Direction next = Direction.from(requestedDirection);
        if (next != null && !next.isOpposite(direction)) {
            pendingDirection = next;
        }
        return snapshot();
    }

    public synchronized GameSnapshot tick() {
        if (!running || gameOver) {
            return snapshot();
        }

        direction = pendingDirection;
        Position head = snake.get(0);
        Position nextHead = new Position(head.x + direction.dx, head.y + direction.dy);

        boolean hitsWall = nextHead.x < 0 || nextHead.y < 0
                || nextHead.x >= GRID_SIZE || nextHead.y >= GRID_SIZE;
        boolean eats = nextHead.equals(food);

        int collisionLength = eats ? snake.size() : snake.size() - 1;
        boolean hitsSelf = snake.subList(0, Math.max(collisionLength, 0)).contains(nextHead);

        if (hitsWall || hitsSelf) {
            gameOver = true;
            running = false;
            return snapshot();
        }

        snake.add(0, nextHead);

        if (eats) {
            score += 10;
            bestScore = Math.max(bestScore, score);
            level = score / 50 + 1;
            placeFood();
        } else {
            snake.remove(snake.size() - 1);
        }

        return snapshot();
    }

    public synchronized GameSnapshot state() {
        return snapshot();
    }

    private void resetInternal() {
        snake.clear();
        snake.add(new Position(12, 12));
        snake.add(new Position(11, 12));
        snake.add(new Position(10, 12));
        direction = Direction.RIGHT;
        pendingDirection = Direction.RIGHT;
        score = 0;
        level = 1;
        running = false;
        gameOver = false;
        placeFood();
    }

    private void placeFood() {
        Position next;
        do {
            next = new Position(random.nextInt(GRID_SIZE), random.nextInt(GRID_SIZE));
        } while (snake.contains(next));
        food = next;
    }

    private int speedMs() {
        return Math.max(MIN_SPEED_MS, BASE_SPEED_MS - (level - 1) * 12);
    }

    private GameSnapshot snapshot() {
        return new GameSnapshot(
                GRID_SIZE,
                List.copyOf(snake),
                food,
                score,
                bestScore,
                level,
                speedMs(),
                running,
                gameOver,
                direction.name().toLowerCase(Locale.ROOT)
        );
    }

    public record Position(int x, int y) {
    }

    public record GameSnapshot(
            int gridSize,
            List<Position> snake,
            Position food,
            int score,
            int bestScore,
            int level,
            int speedMs,
            boolean running,
            boolean gameOver,
            String direction
    ) {
    }

    private enum Direction {
        UP(0, -1),
        DOWN(0, 1),
        LEFT(-1, 0),
        RIGHT(1, 0);

        private final int dx;
        private final int dy;

        Direction(int dx, int dy) {
            this.dx = dx;
            this.dy = dy;
        }

        static Direction from(String value) {
            if (value == null) return null;
            try {
                return valueOf(value.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }

        boolean isOpposite(Direction other) {
            return other != null && dx == -other.dx && dy == -other.dy;
        }
    }
}
