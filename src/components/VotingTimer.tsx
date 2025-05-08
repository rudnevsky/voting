import React, { useState, useEffect } from 'react';

export const VotingTimer: React.FC = () => {
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const calculateDaysRemaining = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
      const daysUntilEndOfWeek = 7 - dayOfWeek;
      setDaysRemaining(daysUntilEndOfWeek);
    };

    calculateDaysRemaining();
    // Update every day
    const interval = setInterval(calculateDaysRemaining, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-blue-50 p-4 rounded-lg mb-6">
      <div className="flex items-center justify-center space-x-2">
        <svg
          className="w-6 h-6 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-lg font-medium text-blue-800">
          Current voting round ends in {daysRemaining} days
        </span>
      </div>
    </div>
  );
}; 