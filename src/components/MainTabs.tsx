import React from 'react';

interface MainTabsProps {
  selected: number;
  onChange: (index: number) => void;
}

const tabs = ['Vote', 'My Votes'];

export const MainTabs: React.FC<MainTabsProps> = ({ selected, onChange }) => (
  <div className="flex space-x-4 mb-4">
    {tabs.map((tab, idx) => (
      <button
        key={tab}
        onClick={() => onChange(idx)}
        className={`text-2xl font-bold px-4 pb-1 border-b-4 transition-all font-hand ${
          selected === idx
            ? 'border-black text-black'
            : 'border-transparent text-gray-400 hover:text-black'
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
); 