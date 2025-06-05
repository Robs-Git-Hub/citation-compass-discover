
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AlertTriangle } from 'lucide-react';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySubmit: (apiKey: string) => void;
}

const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  onApiKeySubmit
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    
    setIsSubmitting(true);
    onApiKeySubmit(apiKey.trim());
    setIsSubmitting(false);
    setApiKey('');
    onClose();
  };

  const handleClose = () => {
    setApiKey('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enter Google Gemini API Key</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Security Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-2">Security Notice</p>
                <p>
                  Your API key will be used directly from your browser to communicate with Google's Gemini API. 
                  It will not be stored by this application after your session ends or you refresh the page. 
                  Ensure you are on a trusted network. By proceeding, you acknowledge that the API key will be 
                  present in your browser's network requests to Google.
                </p>
              </div>
            </div>
          </div>

          {/* API Key Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="gemini-api-key" className="block text-sm font-medium text-gray-700 mb-2">
                Google Gemini API Key
              </label>
              <Input
                id="gemini-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Your API key will only be stored in memory for this session.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={!apiKey.trim() || isSubmitting}
              >
                {isSubmitting ? 'Setting up...' : 'Use API Key'}
              </Button>
            </div>
          </form>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Get your free Gemini API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Google AI Studio</a></p>
            <p>• The API key will be used to fetch missing abstracts for papers with DOIs</p>
            <p>• Rate limiting is applied to respect Google's API limits</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeminiApiKeyModal;
