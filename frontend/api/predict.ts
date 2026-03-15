// api/predict.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { input } = req.body;

    
    const runpodResponse = await axios.post(
      `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/runsync`,
      { input },
      {
        headers: {
          'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(200).json(runpodResponse.data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}