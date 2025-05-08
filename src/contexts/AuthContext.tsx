import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { getFarcasterUser } from '../utils/farcaster';
import type { Address } from 'viem';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfp: string;
  profile: {
    bio: string;
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  address: Address | undefined;
  disconnect: () => void;
  farcasterUser: FarcasterUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchFarcasterUser() {
      if (!address || !isConnected) {
        setFarcasterUser(null);
        return;
      }

      setIsLoading(true);
      try {
        const user = await getFarcasterUser(address);
        setFarcasterUser(user);
      } catch (error) {
        console.error('Error fetching Farcaster user:', error);
        setFarcasterUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFarcasterUser();
  }, [address, isConnected]);

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated: isConnected, 
        address, 
        disconnect,
        farcasterUser,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 