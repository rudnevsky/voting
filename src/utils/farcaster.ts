import { Address } from 'viem';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfp: string;
  profile: {
    bio: string;
  };
}

export async function getFarcasterUser(address: Address): Promise<FarcasterUser | null> {
  try {
    // First, get the custody address for the user
    const response = await fetch(`https://api.farcaster.xyz/v2/user-by-verification?address=${address}`);
    const data = await response.json();
    
    if (!data.result?.user) {
      return null;
    }

    // Then get the full user data
    const userResponse = await fetch(`https://api.farcaster.xyz/v2/user?fid=${data.result.user.fid}`);
    const userData = await userResponse.json();

    if (!userData.result?.user) {
      return null;
    }

    return {
      fid: userData.result.user.fid,
      username: userData.result.user.username,
      displayName: userData.result.user.displayName,
      pfp: userData.result.user.pfp.url,
      profile: {
        bio: userData.result.user.profile.bio.text,
      },
    };
  } catch (error) {
    console.error('Error fetching Farcaster user:', error);
    return null;
  }
} 