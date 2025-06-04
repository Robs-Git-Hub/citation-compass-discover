
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
