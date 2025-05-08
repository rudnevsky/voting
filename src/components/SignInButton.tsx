import { Button } from '@headlessui/react';
import { useConnect } from 'wagmi';
import { useAuth } from '../contexts/AuthContext';

export function SignInButton() {
  const { connect, connectors, isPending } = useConnect();
  const { isAuthenticated, disconnect } = useAuth();

  if (isAuthenticated) {
    return (
      <Button
        onClick={() => disconnect()}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Disconnect
      </Button>
    );
  }

  const farcasterConnector = connectors.find(c => c.id === 'farcaster');

  return (
    <Button
      onClick={() => farcasterConnector && connect({ connector: farcasterConnector })}
      disabled={isPending || !farcasterConnector}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {isPending ? 'Connecting...' : 'Sign in with Farcaster'}
    </Button>
  );
} 