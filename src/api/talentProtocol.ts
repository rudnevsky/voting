interface BuilderScoreResponse {
  score: {
    points: number;
    last_calculated_at: string;
  };
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
      const response = await fetch(
        `${TALENT_API_BASE_URL}/score?id=${fid}&account_source=farcaster`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new TalentProtocolError(
          `Failed to fetch builder score: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as BuilderScoreResponse;
      console.log(`Successfully fetched builder score: ${data.score.points} for FID: ${fid}`);
      return data.score.points;
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