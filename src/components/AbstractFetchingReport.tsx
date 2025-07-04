
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { Button } from './ui/button';

export interface AbstractFetchResult {
  paperId: string;
  title: string;
  status: 'success' | 'failed' | 'not_found';
  error?: string;
  abstract?: string;
}

interface AbstractFetchingReportProps {
  isOpen: boolean;
  onClose: () => void;
  results: AbstractFetchResult[];
  totalProcessed: number;
}

const AbstractFetchingReport: React.FC<AbstractFetchingReportProps> = ({
  isOpen,
  onClose,
  results,
  totalProcessed
}) => {
  const [selectedAbstract, setSelectedAbstract] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');

  const successCount = results.filter(r => r.status === 'success').length;
  const notFoundCount = results.filter(r => r.status === 'not_found').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'not_found':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Abstract found';
      case 'not_found':
        return 'Abstract not found';
      case 'failed':
        return 'Failed to fetch';
      default:
        return status;
    }
  };

  const handleViewAbstract = (abstract: string, title: string) => {
    setSelectedAbstract(abstract);
    setSelectedTitle(title);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Abstract Fetching Report</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalProcessed}</div>
                  <div className="text-gray-600">Total Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <div className="text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{notFoundCount}</div>
                  <div className="text-gray-600">Not Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                  <div className="text-gray-600">Failed</div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="max-h-96 overflow-y-auto">
              <h3 className="font-medium text-gray-900 mb-3">Detailed Results</h3>
              <div className="space-y-2">
                {results.map((result) => (
                  <div 
                    key={result.paperId} 
                    className={`border border-gray-200 rounded-lg p-3 ${
                      result.status === 'success' && result.abstract 
                        ? 'cursor-pointer hover:bg-gray-50 transition-colors' 
                        : ''
                    }`}
                    onClick={() => {
                      if (result.status === 'success' && result.abstract) {
                        handleViewAbstract(result.abstract, result.title);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm line-clamp-2">
                          {result.title || 'Untitled'}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">
                            {getStatusText(result.status)}
                          </span>
                          <div className="flex items-center space-x-2">
                            {result.status === 'success' && result.abstract && (
                              <Eye className="h-4 w-4 text-blue-500" />
                            )}
                            {result.error && (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                {result.error}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Abstract Viewer Modal */}
      <Dialog open={!!selectedAbstract} onOpenChange={() => setSelectedAbstract(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{selectedTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Abstract</h4>
              <div className="text-sm text-gray-700 leading-relaxed max-h-80 overflow-y-auto">
                {selectedAbstract}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={() => setSelectedAbstract(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AbstractFetchingReport;
