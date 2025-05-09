interface BuilderScoreResponse {
  scores: Array<{
    points: number;
    last_calculated_at: string;
    farcaster_id: string;
  }>;
}

const TALENT_API_KEY = 'e499a3ab952b36696584231314f95348a92d1b8a2fea1efd69f56e0aeb2b';
const TALENT_API_BASE_URL = 'https://api.talentprotocol.com';

const headers = {
  'X-API-KEY': TALENT_API_KEY,
  'Content-Type': 'application/json',
};

export class TalentProtocolError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'TalentProtocolError';
  }
}

export const talentProtocolApi = {
  async getBuilderScore(fid: number): Promise<number> {
    try {
      console.log(`Fetching builder score for FID: ${fid}`);
      const url = `${TALENT_API_BASE_URL}/farcaster/scores?fids=${fid}`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new TalentProtocolError(
          `Failed to fetch builder score: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as BuilderScoreResponse;
      console.log('Raw API response:', data);
      
      if (!data.scores || !Array.isArray(data.scores) || data.scores.length === 0) {
        console.error('Invalid response format or no scores found:', data);
        return 0;
      }

      const score = data.scores[0];
      console.log(`Successfully fetched builder score: ${score.points} for FID: ${fid}`);
      return score.points;
    } catch (error) {
      if (error instanceof TalentProtocolError) {
        console.error(`Talent Protocol API error: ${error.message}`, {
          statusCode: error.statusCode,
          fid,
        });
      } else {
        console.error('Unexpected error fetching builder score:', error);
      }
      return 0;
    }
  },
}; 