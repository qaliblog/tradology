
import React from 'react';
import RobotIcon from './icons/RobotIcon';

// FIX: Removed SettingsIcon import as it's no longer used.

// FIX: Removed onSettingsClick prop as API key is now handled by environment variables.
const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <div className="flex items-center">
           <RobotIcon className="h-8 w-8 text-blue-400 mr-3" />
           <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
             AI Trading Bot Analyst
           </h1>
        </div>
        {/* FIX: Removed settings button as per API key guidelines. */}
      </div>
    </header>
  );
};

export default Header;
