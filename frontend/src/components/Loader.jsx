import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-12 h-12 animate-spin">
        <div className="absolute top-0 left-0 w-5 h-5 bg-gray-800 rounded-full"></div>
        <div className="absolute top-0 right-0 w-5 h-5 bg-gray-800 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-5 h-5 bg-gray-800 rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-5 h-5 bg-gray-800 rounded-full"></div>
      </div>
    </div>
  );
};

export default Loader;
