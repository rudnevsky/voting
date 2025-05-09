import React from 'react';

type UserProfileProps = {
  username: string;
  displayName: string;
  avatar: string;
};

export const UserProfile: React.FC<UserProfileProps> = ({ username, displayName, avatar }) => {
  return (
    <div className="flex items-center space-x-2">
      <img
        src={avatar}
        alt={`${displayName}'s profile`}
        className="w-8 h-8 rounded-full"
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{displayName}</span>
        <span className="text-xs text-gray-500">@{username}</span>
      </div>
    </div>
  );
}; 