import React from 'react';

interface StatusTabsProps {
  selected: number;
  onChange: (index: number) => void;
}

const tabs = ['Voting', 'To launch', 'Launched'];

export const StatusTabs: React.FC<StatusTabsProps> = ({ selected, onChange }) => (
  <div className="flex space-x-3 mb-6">
    {tabs.map((tab, idx) => (
      <button
        key={tab}
        onClick={() => onChange(idx)}
        className={`px-6 py-2 rounded-xl border-2 font-bold text-lg font-hand transition-all ${
          selected === idx
            ? 'border-black bg-gray-200 text-black'
            : 'border-gray-300 bg-white text-gray-500 hover:border-black hover:text-black'
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
); 