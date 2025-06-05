import React from 'react';
import { FormInput } from '../atoms/FormInput';
import { ErrorMessage } from '../atoms/ErrorMessage';

interface FormField {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string | null;
}

interface FormProps {
  fields: FormField[];
  onSubmit: (e: React.FormEvent) => void;
  error?: string | null;
  submitButtonText: string;
  isLoading?: boolean;
  hideSubmitButton?: boolean;
}

export const Form: React.FC<FormProps> = ({
  fields,
  onSubmit,
  error,
  submitButtonText,
  isLoading = false,
  hideSubmitButton = false,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map((field) => (
        <FormInput
          key={field.id}
          id={field.id}
          label={field.label}
          type={field.type}
          value={field.value}
          onChange={field.onChange}
          required={field.required}
          error={field.error}
        />
      ))}
      {error && <ErrorMessage message={error} />}
      {!hideSubmitButton && (
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : submitButtonText}
        </button>
      )}
    </form>
  );
}; 