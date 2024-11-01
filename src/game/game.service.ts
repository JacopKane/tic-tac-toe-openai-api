// src/game/game.service.ts

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { callOpenAIWithRetry } from './utils';

interface AIMove {
  row: number;
  col: number;
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private board: string[][] = [
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
  ];
  private currentPlayer: 'X' | 'O' = 'X';

  constructor(
    private configService: ConfigService,
    @Inject('OpenAI') private readonly openai: OpenAI,
  ) {}

  getBoardState(): string[][] {
    return this.board.map((row) => [...row]);
  }

  playerMove(row: number, col: number): void {
    if (!this.isValidMove(row, col)) {
      throw new Error('Invalid move!');
    }
    this.board[row][col] = 'X';
    this.currentPlayer = 'O';
  }

  private isValidMove(row: number, col: number): boolean {
    return (
      row >= 0 && row < 3 && col >= 0 && col < 3 && this.board[row][col] === ''
    );
  }

  async aiMove(): Promise<void> {
    try {
      const messages = [
        {
          role: 'system' as const,
          content:
            'You are a Tic Tac Toe AI player. Analyze the board and make the best move for O.',
        },
        {
          role: 'user' as const,
          content: `Game state: ${JSON.stringify(
            this.board,
          )}. You're 'O'. What's your next move? Respond with JSON {"row": number, "col": number}.`,
        },
      ];

      const aiResponse = await callOpenAIWithRetry(this.openai, messages);

      let aiMove: AIMove;
      try {
        aiMove = JSON.parse(aiResponse);
      } catch (error) {
        this.logger.error('Failed to parse AI response', error);
        throw new Error('Invalid AI response format');
      }

      if (!this.isValidMove(aiMove.row, aiMove.col)) {
        throw new Error('Invalid AI move');
      }

      this.board[aiMove.row][aiMove.col] = 'O';
      this.currentPlayer = 'X';
    } catch (error) {
      this.logger.error('Error during AI move', error);
      throw new Error('Failed to make AI move');
    }
  }

  isGameOver(): boolean {
    const lines = [
      // Rows
      [this.board[0][0], this.board[0][1], this.board[0][2]],
      [this.board[1][0], this.board[1][1], this.board[1][2]],
      [this.board[2][0], this.board[2][1], this.board[2][2]],
      // Columns
      [this.board[0][0], this.board[1][0], this.board[2][0]],
      [this.board[0][1], this.board[1][1], this.board[2][1]],
      [this.board[0][2], this.board[1][2], this.board[2][2]],
      // Diagonals
      [this.board[0][0], this.board[1][1], this.board[2][2]],
      [this.board[0][2], this.board[1][1], this.board[2][0]],
    ];

    for (const line of lines) {
      if (
        line.every((cell) => cell === 'X') ||
        line.every((cell) => cell === 'O')
      ) {
        return true;
      }
    }

    return this.board.every((row) => row.every((cell) => cell !== ''));
  }

  getWinner(): 'X' | 'O' | 'Draw' | null {
    const lines = [
      // Rows
      [this.board[0][0], this.board[0][1], this.board[0][2]],
      [this.board[1][0], this.board[1][1], this.board[1][2]],
      [this.board[2][0], this.board[2][1], this.board[2][2]],
      // Columns
      [this.board[0][0], this.board[1][0], this.board[2][0]],
      [this.board[0][1], this.board[1][1], this.board[2][1]],
      [this.board[0][2], this.board[1][2], this.board[2][2]],
      // Diagonals
      [this.board[0][0], this.board[1][1], this.board[2][2]],
      [this.board[0][2], this.board[1][1], this.board[2][0]],
    ];

    for (const line of lines) {
      if (line.every((cell) => cell === 'X')) return 'X';
      if (line.every((cell) => cell === 'O')) return 'O';
    }

    if (this.board.every((row) => row.every((cell) => cell !== ''))) {
      return 'Draw';
    }

    return null;
  }

  resetGame(): void {
    this.board = [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ];
    this.currentPlayer = 'X';
  }
}
