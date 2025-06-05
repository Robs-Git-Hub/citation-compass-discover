
import React, { useState, useMemo } from 'react';
import { Citation } from '../types/semantic-scholar';
import { ArrowUp, ArrowDown, FileText, ExternalLink } from 'lucide-react';
import { useCitationStore } from '../store/citationStore';
import CitationDetailsModal from './CitationDetailsModal';
import AbstractModal from './AbstractModal';

interface CitationsTableProps {
  citations: Citation[];
  isLoading: boolean;
}

type SortField = 'title' | 'year' | 'citationCount' | 'authors' | 'venue' | 'abstract' | 'doi';
type SortDirection = 'asc' | 'desc';

// Constants for magic values
const DEFAULT_EMPTY_STRING = '';
const DEFAULT_NUMBER_VALUE = 0;
const NOT_AVAILABLE_TEXT = 'N/A';

// Common class constants
const COMMON_TH_CLASSES = "px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider";

const CitationsTable: React.FC<CitationsTableProps> = ({ citations, isLoading }) => {
  const [sortField, setSortField] = useState<SortField>('year');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedPaper, setSelectedPaper] = useState<Citation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [abstractPaper, setAbstractPaper] = useState<Citation | null>(null);
  const [isAbstractModalOpen, setIsAbstractModalOpen] = useState(false);

  const { secondDegreeCitations } = useCitationStore();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCitationCountClick = (citation: Citation) => {
    const secondDegree = secondDegreeCitations.get(citation.paperId);
    if (secondDegree && secondDegree.length > 0) {
      setSelectedPaper(citation);
      setIsModalOpen(true);
    }
  };

  const handleAbstractClick = (citation: Citation) => {
    setAbstractPaper(citation);
    setIsAbstractModalOpen(true);
  };

  const sortedCitations = useMemo(() => {
    return [...citations].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'title':
          aValue = a.title?.toLowerCase() || DEFAULT_EMPTY_STRING;
          bValue = b.title?.toLowerCase() || DEFAULT_EMPTY_STRING;
          break;
        case 'year':
          aValue = a.year || DEFAULT_NUMBER_VALUE;
          bValue = b.year || DEFAULT_NUMBER_VALUE;
          break;
        case 'citationCount':
          aValue = a.citationCount || DEFAULT_NUMBER_VALUE;
          bValue = b.citationCount || DEFAULT_NUMBER_VALUE;
          break;
        case 'authors':
          aValue = a.authors?.[0]?.name?.toLowerCase() || DEFAULT_EMPTY_STRING;
          bValue = b.authors?.[0]?.name?.toLowerCase() || DEFAULT_EMPTY_STRING;
          break;
        case 'venue':
          aValue = a.venue?.toLowerCase() || DEFAULT_EMPTY_STRING;
          bValue = b.venue?.toLowerCase() || DEFAULT_EMPTY_STRING;
          break;
        case 'abstract':
          // Sort by whether abstract exists (papers with abstracts first when desc)
          aValue = a.abstract ? 1 : 0;
          bValue = b.abstract ? 1 : 0;
          break;
        case 'doi':
          // Sort by whether DOI exists (papers with DOI first when desc)
          aValue = a.externalIds?.DOI ? 1 : 0;
          bValue = b.externalIds?.DOI ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [citations, sortField, sortDirection]);

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 font-medium text-gray-700 hover:text-brand-primary focus:outline-none focus:text-brand-primary"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (citations.length === 0) return null;

  return (
    <>
      <div className="w-full max-w-6xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Citations ({citations.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className={COMMON_TH_CLASSES}>
                    <SortButton field="title">Title</SortButton>
                  </th>
                  <th className={COMMON_TH_CLASSES}>
                    <SortButton field="authors">Authors</SortButton>
                  </th>
                  <th className={COMMON_TH_CLASSES}>
                    <SortButton field="year">Year</SortButton>
                  </th>
                  <th className={COMMON_TH_CLASSES}>
                    <SortButton field="venue">Published In</SortButton>
                  </th>
                  <th className={COMMON_TH_CLASSES}>
                    <SortButton field="citationCount">Citations</SortButton>
                  </th>
                  <th className={COMMON_TH_CLASSES}>
                    <SortButton field="abstract">Abstract</SortButton>
                  </th>
                  <th className={COMMON_TH_CLASSES}>
                    <SortButton field="doi">DOI</SortButton>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCitations.map((citation) => {
                  const hasSecondDegree = secondDegreeCitations.has(citation.paperId);
                  const secondDegreeCount = secondDegreeCitations.get(citation.paperId)?.length || 0;
                  const totalCitations = citation.citationCount || DEFAULT_NUMBER_VALUE;
                  const doi = citation.externalIds?.DOI;
                  
                  return (
                    <tr key={citation.paperId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {citation.url ? (
                            <a
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-900 hover:text-brand-primary transition-colors"
                            >
                              {citation.title || 'Untitled'}
                            </a>
                          ) : (
                            citation.title || 'Untitled'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {citation.authors?.slice(0, 3).map(author => author.name).join(', ')}
                          {citation.authors && citation.authors.length > 3 && ' et al.'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {citation.year || NOT_AVAILABLE_TEXT}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {citation.venue || NOT_AVAILABLE_TEXT}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {hasSecondDegree && secondDegreeCount > 0 ? (
                          <button
                            onClick={() => handleCitationCountClick(citation)}
                            className="text-brand-primary hover:text-brand-primary-hover hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 rounded px-1"
                          >
                            {secondDegreeCount}/{totalCitations}
                          </button>
                        ) : (
                          <span>{totalCitations}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {citation.abstract && (
                          <button
                            aria-label="View Abstract"
                            onClick={() => handleAbstractClick(citation)}
                            className="text-brand-primary hover:text-brand-primary-hover inline-flex items-center"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {doi && (
                          <a
                            href={`https://doi.org/${doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="View DOI"
                            className="text-brand-primary hover:text-brand-primary-hover inline-flex items-center"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedPaper && (
        <CitationDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          citations={secondDegreeCitations.get(selectedPaper.paperId) || []}
          paperTitle={selectedPaper.title || 'Untitled'}
        />
      )}

      {abstractPaper && (
        <AbstractModal
          isOpen={isAbstractModalOpen}
          onClose={() => setIsAbstractModalOpen(false)}
          paper={abstractPaper}
        />
      )}
    </>
  );
};

export default CitationsTable;
