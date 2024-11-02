import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as blessed from 'blessed';
import { GameService } from './game/game.service';

async function bootstrap() {
  // Determine if the environment is production
  const isProduction = process.env.NODE_ENV === 'production';

  // Create the application context with specific logger levels
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: isProduction
      ? ['error', 'warn'] // Only show errors and warnings in production
      : ['log', 'error', 'warn', 'debug', 'verbose'], // Show all logs in development
  });

  const gameService = app.get(GameService);

  const screen = blessed.screen({
    smartCSR: true,
  });

  screen.title = 'Tic-Tac-Toe';

  const box = blessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    content: '',
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: 'blue',
      },
    },
  });

  const statusBox = blessed.box({
    bottom: 0,
    left: 'center',
    width: '100%',
    height: 3,
    content: 'Your turn (X) - Use numbers 1-9 to make a move',
    style: {
      fg: 'green',
    },
  });

  screen.append(box);
  screen.append(statusBox);

  const renderBoard = () => {
    const board = gameService.getBoardState();
    let content = '\n';
    for (let i = 0; i < 3; i++) {
      content +=
        '  ' + board[i].map((cell) => (cell === '' ? ' ' : cell)).join(' | ');
      if (i < 2) content += '\n  ---------\n';
    }
    box.setContent(content);
    screen.render();
  };

  // Handle user input
  screen.key(['1', '2', '3', '4', '5', '6', '7', '8', '9'], async (ch) => {
    const moveMap = {
      '1': [0, 0],
      '2': [0, 1],
      '3': [0, 2],
      '4': [1, 0],
      '5': [1, 1],
      '6': [1, 2],
      '7': [2, 0],
      '8': [2, 1],
      '9': [2, 2],
    };
    const [row, col] = moveMap[ch];

    try {
      gameService.playerMove(row, col);
      renderBoard();

      // Check if the game is over after player's move
      if (gameService.isGameOver()) {
        const status = gameService.getGameStatus();
        statusBox.setContent(status);
        screen.render();
        return;
      }

      statusBox.setContent('AI is thinking...');
      screen.render();

      await gameService.aiMove();
      renderBoard();

      // Check if the game is over after AI's move
      if (gameService.isGameOver()) {
        const status = gameService.getGameStatus();
        statusBox.setContent(status);
        screen.render();
        return;
      }

      statusBox.setContent('Your turn (X) - Use numbers 1-9 to make a move');
      screen.render();
    } catch (error) {
      statusBox.setContent(`Error: ${error.message}`);
      screen.render();
    }
  });

  // Handle screen resize
  screen.on('resize', () => {
    box.width = '50%';
    box.height = '50%';
    renderBoard();
  });

  // Add reset game functionality
  screen.key(['r'], () => {
    gameService.resetGame();
    renderBoard();
    statusBox.setContent(
      'Game Reset - Your turn (X) - Use numbers 1-9 to make a move',
    );
    screen.render();
  });

  // Exit the application
  screen.key(['escape', 'q', 'C-c'], () => {
    process.exit(0);
  });

  // Initial render
  renderBoard();

  // Focus the screen
  screen.key(['tab'], (ch, key) => {
    screen.focusNext();
  });

  screen.key(['S-tab'], (ch, key) => {
    screen.focusPrevious();
  });
}

bootstrap();
