import React from 'react';
import { Tab } from '@headlessui/react';

interface FilterBarProps {
  selectedMainTab: number;
  selectedStatusTab: number;
  onMainTabChange: (index: number) => void;
  onStatusTabChange: (index: number) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedMainTab,
  selectedStatusTab,
  onMainTabChange,
  onStatusTabChange,
}) => {
  const mainTabs = ['Vote', 'My Votes'];
  const statusTabs = ['Voting', 'Launched', 'To launch'];

  const tabStyles = (selected: boolean) =>
    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${
      selected
        ? 'bg-white text-gray-900 shadow'
        : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
    }`;

  return (
    <div className="space-y-4">
      {/* Main Tabs */}
      <Tab.Group selectedIndex={selectedMainTab} onChange={onMainTabChange}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          {mainTabs.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) => tabStyles(selected)}
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>

      {/* Status Tabs - Show for both Vote and My Votes tabs */}
      <Tab.Group selectedIndex={selectedStatusTab} onChange={onStatusTabChange}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          {statusTabs.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) => tabStyles(selected)}
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>
    </div>
  );
}; 