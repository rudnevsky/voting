import React from 'react';

interface VotingPowerBreakdownProps {
  builderScore: number;
  talentHoldings: number;
  totalVotingPower: number;
  availableVotes: number;
  lockedVotes: number;
}

export const VotingPowerBreakdown: React.FC<VotingPowerBreakdownProps> = ({
  builderScore,
  talentHoldings,
  totalVotingPower,
  availableVotes,
  lockedVotes,
}) => {
  return (
    <div className="bg-white border-4 border-gray-300 rounded-2xl p-6 mb-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center mb-2">
        <span className="font-bold text-xl font-hand">Your Builder Score</span>
        <span className="text-2xl font-extrabold text-right font-hand">{builderScore}</span>
        <span className="font-bold text-xl font-hand">Your $TALENT Holdings</span>
        <span className="text-2xl font-extrabold text-right font-hand">{talentHoldings.toLocaleString()}</span>
        <span className="font-bold text-xl font-hand">Your Total Voting Power</span>
        <span className="text-2xl font-extrabold text-purple-500 text-right font-hand">{totalVotingPower}</span>
      </div>
      <div className="flex gap-6 mb-2 ml-2">
        <span className="text-lg font-hand">• Available {availableVotes}</span>
        <span className="text-lg font-hand">• Locked {lockedVotes}</span>
      </div>
      <div className="bg-gray-100 border-2 border-gray-300 rounded-xl px-4 py-2 mt-2">
        <span className="font-hand text-lg">Total Voting Power = Builder Score x sqrt($TALENT Holdings)</span>
      </div>
    </div>
  );
}; 