// scripts/check-finetune.ts

import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkFineTune(jobId?: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    if (jobId) {
      // Check specific job
      const job = await openai.fineTuning.jobs.retrieve(jobId);
      console.log('\nFine-tuning job details:');
      console.log('Status:', job.status);
      console.log('Model:', job.fine_tuned_model);
      console.log('Started at:', new Date(job.created_at * 1000).toLocaleString());
      if (job.finished_at) {
        console.log('Finished at:', new Date(job.finished_at * 1000).toLocaleString());
      }
      if (job.error) {
        console.error('Error:', job.error);
      }
      return;
    }

    // List all jobs
    const jobs = await openai.fineTuning.jobs.list();
    
    console.log('\nAll fine-tuning jobs:');
    jobs.data.forEach(job => {
      console.log('\nJob ID:', job.id);
      console.log('Status:', job.status);
      console.log('Model:', job.fine_tuned_model || 'Not yet available');
      console.log('Created:', new Date(job.created_at * 1000).toLocaleString());
      if (job.finished_at) {
        console.log('Finished:', new Date(job.finished_at * 1000).toLocaleString());
      }
      if (job.error) {
        console.error('Error:', job.error);
      }
    });

  } catch (error) {
    console.error('Error checking fine-tune job:', error);
  }
}

// Get job ID from command line argument
const jobId = process.argv[2];
checkFineTune(jobId);