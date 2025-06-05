import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ className = '', fullWidth, ...props }) => {
  return (
    <button
      className={`px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 flex items-center gap-2 font-medium transition-colors ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    />
  );
}; 