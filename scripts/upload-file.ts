// scripts/upload-file.ts

import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

async function uploadFile() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.files.create({
      purpose: 'fine-tune',
      file: fs.createReadStream('training_data.jsonl') as any,
    });

    console.log('File ID:', response.id);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

uploadFile();
