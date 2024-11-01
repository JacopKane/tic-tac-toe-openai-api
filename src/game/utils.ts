// src/game/utils.ts

import { OpenAI } from 'openai';
import { Logger } from '@nestjs/common';

const logger = new Logger('OpenAI');

export async function callOpenAIWithRetry(
  openai: OpenAI,
  messages: Array<OpenAI.Chat.ChatCompletionMessageParam>,
  retries = 3,
  timeoutMs = 10000,
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await withTimeout(
        openai.chat.completions.create({
          model: process.env.FINE_TUNED_MODEL || 'gpt-4o-mini-2024-07-18',
          messages,
          temperature: 0.7,
          max_tokens: 50,
        }),
        timeoutMs,
      );

      return response.choices[0].message.content || '';
    } catch (error) {
      if (attempt === retries) {
        logger.error('Max retries reached', error);
        throw error;
      }
      logger.warn(`Attempt ${attempt} failed. Retrying...`, error);
      await delay(1000 * attempt);
    }
  }
  throw new Error('Failed to get response from OpenAI');
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms),
    ),
  ]);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
