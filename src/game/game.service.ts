// src/game/game.service.ts

import { Injectable, Logger, Inject } from '@nestjs/common';
import { OpenAI } from 'openai';
import { callOpenAIWithRetry } from './utils';

interface AIResponse {
  move: { row: number; col: number } | null;
  status: string;
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
  private gameOver: boolean = false;
  private gameStatus: string = '';

  constructor(@Inject('OpenAI') private readonly openai: OpenAI) {}

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
            'You are an expert Tic Tac Toe AI engine. After each move, analyze the game board to determine if the game is over due to a win or a draw. Handle all game logic, including move validation, game status checking, and determining the winner. Respond with JSON containing "move" (or null if no move) and "status".',
        },
        {
          role: 'user' as const,
          content: `Game state: ${JSON.stringify(
            this.board,
          )}, Your move as '${this.currentPlayer}'.`,
        },
      ];

      const aiResponseText = await callOpenAIWithRetry(this.openai, messages);

      let aiResponse: AIResponse;
      try {
        aiResponse = JSON.parse(aiResponseText);
      } catch (error) {
        this.logger.error('Failed to parse AI response', error);
        throw new Error('Invalid AI response format');
      }

      if (!aiResponse.move && !aiResponse.status) {
        this.logger.log(aiResponse, JSON.stringify(aiResponse));
        throw new Error('AI response is missing both move and status');
      }

      // Handle game status
      if (aiResponse.status) {
        this.logger.log(`Game Status: ${aiResponse.status}`);
        this.gameStatus = aiResponse.status;
        if (
          aiResponse.status.startsWith('Game over') ||
          aiResponse.status.includes('wins') ||
          aiResponse.status.includes('Draw')
        ) {
          this.gameOver = true;
        }
      }

      // Proceed only if there is a move to make
      if (aiResponse.move) {
        const { row, col } = aiResponse.move;
        if (!this.isValidMove(row, col)) {
          throw new Error('Invalid AI move');
        }
        this.board[row][col] = this.currentPlayer;
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      } else {
        // No move to make (game over)
        return;
      }
    } catch (error) {
      this.logger.error('Error during AI move', error);
      throw new Error('Failed to make AI move');
    }
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  getGameStatus(): string {
    return this.gameStatus;
  }

  resetGame(): void {
    this.board = [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ];
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.gameStatus = '';
  }
}
