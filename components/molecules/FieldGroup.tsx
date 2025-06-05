import React from 'react';

interface FieldGroupProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({ label, htmlFor, children }) => {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}; 