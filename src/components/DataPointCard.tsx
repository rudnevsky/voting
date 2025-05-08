import React from 'react';

type DataPoint = {
  id: string;
  name: string;
  description: string;
  total_votes: number;
  pts: number;
  issuer_name: string;
  status: string;
  image_url: string;
  user_votes_cast?: number;
};

interface DataPointCardProps {
  dataPoint: DataPoint;
  onVote: (id: string, direction: 'up' | 'down') => void;
  showUserVotes?: boolean;
}

export const DataPointCard: React.FC<DataPointCardProps> = ({ dataPoint, onVote, showUserVotes }) => {
  return (
    <div className="bg-white border-4 border-gray-300 rounded-2xl p-6 mb-6 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center gap-4 mb-2">
        {dataPoint.image_url && (
          <img
            src={dataPoint.image_url}
            alt={dataPoint.name}
            className="w-14 h-14 rounded-lg object-cover border border-gray-200 bg-white"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-gray-900">{dataPoint.name}</span>
            <span className="bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-xs font-bold ml-2">{dataPoint.issuer_name}</span>
            <span className="bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-xs font-bold">{dataPoint.pts} pts</span>
          </div>
          <p className="text-gray-700 text-base font-hand mb-1">{dataPoint.description}</p>
        </div>
      </div>
      <div className="flex items-end justify-between mt-2">
        <div>
          <span className="block text-lg font-bold text-gray-700">Total Votes</span>
          <span className="text-3xl font-extrabold font-mono text-gray-900">{dataPoint.total_votes.toLocaleString()}</span>
          {showUserVotes && (
            <>
              <span className="block text-lg font-bold text-gray-700 mt-4">Your Votes</span>
              <span className="text-3xl font-extrabold font-mono text-purple-500">{dataPoint.user_votes_cast || 0}</span>
            </>
          )}
        </div>
        <button
          onClick={() => onVote(dataPoint.id, 'up')}
          className="ml-4 px-8 py-2 rounded-2xl border-4 border-purple-300 bg-white text-2xl font-bold text-gray-900 hover:bg-purple-50 transition-all shadow-md"
        >
          Vote
        </button>
      </div>
    </div>
  );
}; 