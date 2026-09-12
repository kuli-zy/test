package com.example.snake.game;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SnakeGameServiceTests {

    @Test
    void snakeMovesOneCellOnTick() {
        SnakeGameService game = new SnakeGameService();
        game.start();

        var state = game.tick();

        assertThat(state.snake()).hasSize(3);
        assertThat(state.snake().get(0)).isEqualTo(new SnakeGameService.Position(13, 12));
    }

    @Test
    void oppositeDirectionIsIgnored() {
        SnakeGameService game = new SnakeGameService();
        game.start();
        game.move("left");

        var state = game.tick();

        assertThat(state.snake().get(0)).isEqualTo(new SnakeGameService.Position(13, 12));
        assertThat(state.direction()).isEqualTo("right");
    }

    @Test
    void pauseStopsTicks() {
        SnakeGameService game = new SnakeGameService();
        game.start();
        game.pause();
        var before = game.state();

        var after = game.tick();

        assertThat(after.snake()).isEqualTo(before.snake());
        assertThat(after.running()).isFalse();
    }
}
