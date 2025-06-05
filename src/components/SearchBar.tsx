
import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { InputValidator } from '../utils/validation';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!query.trim()) {
      setValidationError('Please enter a search query');
      return;
    }

    const validation = InputValidator.validateSearchQuery(query);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid input');
      return;
    }

    onSearch(validation.sanitized);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Enter paper title to find citations..."
            className={`block w-full pl-10 pr-3 py-3 border rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[#437e84] focus:border-[#437e84] text-gray-900 ${
              validationError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
            maxLength={500}
          />
        </div>
      </form>
      
      {validationError && (
        <div className="mt-2 flex items-start">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-600">{validationError}</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
