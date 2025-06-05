
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ExternalLink, FileText, Calendar, Building2, Users } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface PaperDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: {
    id: string;
    title: string;
    authors?: string;
    year?: number;
    venue?: string;
    citationCount?: number;
    url?: string;
    abstract?: string;
    degreeType: 'ego' | 'firstDegree' | 'secondDegree';
  };
}

const PaperDetailsModal: React.FC<PaperDetailsModalProps> = ({
  isOpen,
  onClose,
  paper
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const getDegreeTypeLabel = (type: string) => {
    switch (type) {
      case 'ego':
        return { label: 'Selected Paper', color: 'bg-brand-primary text-white' };
      case 'firstDegree':
        return { label: '1st Degree Citation', color: 'bg-gray-500 text-white' };
      case 'secondDegree':
        return { label: '2nd Degree Citation', color: 'bg-gray-400 text-white' };
      default:
        return { label: 'Unknown', color: 'bg-gray-300 text-gray-700' };
    }
  };

  const degreeInfo = getDegreeTypeLabel(paper.degreeType);

  const content = (
    <div className="space-y-6">
      {/* Header with badge */}
      <div className="space-y-3">
        <Badge className={degreeInfo.color}>
          {degreeInfo.label}
        </Badge>
        
        <h3 className="text-xl font-semibold text-gray-900 leading-tight">
          {paper.title}
        </h3>
      </div>

      {/* Metadata */}
      <div className="space-y-4">
        {paper.authors && (
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 text-sm">Authors</div>
              <div className="text-gray-600">{paper.authors}</div>
            </div>
          </div>
        )}

        {paper.year && (
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 text-sm">Publication Year</div>
              <div className="text-gray-600">{paper.year}</div>
            </div>
          </div>
        )}

        {paper.venue && (
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 text-sm">Published In</div>
              <div className="text-gray-600">{paper.venue}</div>
            </div>
          </div>
        )}

        {paper.citationCount !== undefined && (
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 text-sm">Total Citations</div>
              <div className="text-gray-600">{paper.citationCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* Abstract */}
      {paper.abstract && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Abstract</h4>
          <div className="text-sm text-gray-700 leading-relaxed max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
            {paper.abstract}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {paper.url && (
          <Button asChild className="flex-1">
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2"
            >
              View on Semantic Scholar
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        <Button variant="outline" onClick={onClose} className="flex-1">
          Close
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Paper Details</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Paper Details</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default PaperDetailsModal;
