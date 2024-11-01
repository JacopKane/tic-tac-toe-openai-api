// scripts/create-finetune.ts

import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

async function createFineTune() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const fineTune = await openai.fineTuning.jobs.create({
      training_file: process.env.OPENAI_TRAINING_FILE_ID,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18',
    });

    console.log('Fine-tune Job ID:', fineTune.id);
  } catch (error) {
    console.error('Error creating fine-tune job:', error);
  }
}

createFineTune();
