import React from 'react';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mt-3 bg-red-50 border-l-4 border-red-500 p-3 rounded-md">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}; 