import React, { useState } from 'react';

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataPointName: string;
  userVotes: number;
  availableVotes: number;
  lockedVotes: number;
  onVote: (votes: number) => void;
  onRedeem: (votes: number) => void;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  isOpen,
  onClose,
  dataPointName,
  userVotes,
  availableVotes,
  lockedVotes,
  onVote,
  onRedeem,
}) => {
  const [voteCount, setVoteCount] = useState(userVotes);

  if (!isOpen) return null;

  const maxVotes = availableVotes + userVotes;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVoteCount(Math.max(0, Math.min(maxVotes, Number(e.target.value))));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(maxVotes, Number(e.target.value)));
    setVoteCount(value);
  };

  const handleMax = () => {
    setVoteCount(maxVotes);
  };

  // Determine button states
  const isRedeemActive = voteCount < userVotes;
  const isVoteActive = voteCount > userVotes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md relative">
        <button
          className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">
          Vote for <span className="text-blue-600 underline cursor-pointer">{dataPointName}</span>
        </h2>
        <div className="flex items-center justify-between mb-2">
          <input
            type="number"
            min={0}
            max={maxVotes}
            value={voteCount}
            onChange={handleInputChange}
            className="w-20 text-xl font-bold text-center border rounded-lg p-1"
          />
          <span className="text-lg font-bold text-gray-500">
            <span
              className="cursor-pointer select-none hover:text-purple-600 transition-colors underline"
              onClick={handleMax}
              title="Set to max votes"
            >
              Max
            </span>
            {' / '}{maxVotes}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={maxVotes}
          value={voteCount}
          onChange={handleSliderChange}
          className="w-full mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>0</span>
          <span>100%</span>
        </div>
        <div className="flex justify-between mb-6 text-lg">
          <span>• Available {availableVotes}</span>
          <span>• Locked {lockedVotes}</span>
        </div>
        <div className="flex gap-4">
          <button
            className={`flex-1 py-3 rounded-xl text-2xl font-bold border-2 transition-all ${
              isRedeemActive
                ? 'bg-red-100 text-red-700 border-red-400 hover:bg-red-200'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
            onClick={() => onRedeem(voteCount)}
            disabled={!isRedeemActive}
          >
            Redeem
          </button>
          <button
            className={`flex-1 py-3 rounded-xl text-2xl font-bold border-2 transition-all ${
              isVoteActive
                ? 'bg-purple-100 text-purple-700 border-purple-400 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
            onClick={() => onVote(voteCount)}
            disabled={!isVoteActive}
          >
            Vote
          </button>
        </div>
      </div>
    </div>
  );
}; 