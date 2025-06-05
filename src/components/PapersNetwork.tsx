import React, { useState, useMemo } from 'react';
import { ResponsiveNetwork } from '@nivo/network';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Paper, Citation } from '../types/semantic-scholar';
import { useCitationStore } from '../store/citationStore';
import PaperDetailsModal from './PaperDetailsModal';
import { RotateCcw, Target, ArrowLeft } from 'lucide-react';

// Brand color constant for JavaScript usage
const EGO_NODE_COLOR = '#437e84';

interface NetworkNode {
  id: string;
  title: string;
  authors?: string;
  year?: number;
  venue?: string;
  citationCount?: number;
  url?: string;
  abstract?: string;
  degreeType: 'ego' | 'firstDegree' | 'secondDegree';
  radius: number;
  color: string;
}

interface NetworkEdge {
  source: string;
  target: string;
}

interface PapersNetworkProps {
  selectedPaper: Paper;
  firstDegreeCitations: Citation[];
  onBackToTable: () => void;
}

const PapersNetwork: React.FC<PapersNetworkProps> = ({
  selectedPaper,
  firstDegreeCitations,
  onBackToTable
}) => {
  const { secondDegreeCitations } = useCitationStore();
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [networkKey, setNetworkKey] = useState(0);

  const { nodes, edges } = useMemo(() => {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];

    // Add ego node (selected paper) - using the constant for color
    nodes.push({
      id: selectedPaper.paperId,
      title: selectedPaper.title,
      authors: selectedPaper.authors?.slice(0, 2).map(a => a.name).join(', ') + 
               (selectedPaper.authors && selectedPaper.authors.length > 2 ? ' et al.' : ''),
      year: selectedPaper.year,
      venue: selectedPaper.venue,
      citationCount: selectedPaper.citationCount,
      url: selectedPaper.url,
      abstract: selectedPaper.abstract,
      degreeType: 'ego',
      radius: 20,
      color: EGO_NODE_COLOR
    });

    // Add first degree nodes and edges
    firstDegreeCitations.forEach(citation => {
      nodes.push({
        id: citation.paperId,
        title: citation.title || 'Untitled',
        authors: citation.authors?.slice(0, 2).map(a => a.name).join(', ') + 
                 (citation.authors && citation.authors.length > 2 ? ' et al.' : ''),
        year: citation.year,
        venue: citation.venue,
        citationCount: citation.citationCount,
        url: citation.url,
        abstract: citation.abstract,
        degreeType: 'firstDegree',
        radius: 12,
        color: '#6b7280'
      });

      // Edge from first degree citation to ego (citing paper -> cited paper)
      edges.push({
        source: citation.paperId,
        target: selectedPaper.paperId
      });
    });

    // Add second degree nodes and edges
    firstDegreeCitations.forEach(firstDegreeNode => {
      const secondDegreeList = secondDegreeCitations.get(firstDegreeNode.paperId);
      if (secondDegreeList) {
        secondDegreeList.forEach(secondDegree => {
          // Check if node already exists
          if (!nodes.find(n => n.id === secondDegree.paperId)) {
            nodes.push({
              id: secondDegree.paperId,
              title: secondDegree.title || 'Untitled',
              authors: secondDegree.authors?.slice(0, 2).map(a => a.name).join(', ') + 
                       (secondDegree.authors && secondDegree.authors.length > 2 ? ' et al.' : ''),
              year: secondDegree.year,
              venue: secondDegree.venue,
              citationCount: secondDegree.citationCount,
              url: secondDegree.url,
              abstract: secondDegree.abstract,
              degreeType: 'secondDegree',
              radius: 8,
              color: '#9ca3af'
            });
          }

          // Edge from second degree to first degree
          edges.push({
            source: secondDegree.paperId,
            target: firstDegreeNode.paperId
          });
        });
      }
    });

    return { nodes, edges };
  }, [selectedPaper, firstDegreeCitations, secondDegreeCitations]);

  const handleNodeClick = (node: any) => {
    setSelectedNode(node.data);
    setIsModalOpen(true);
  };

  const handleResetView = () => {
    setNetworkKey(prev => prev + 1);
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header with selected paper title */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{selectedPaper.title}</h2>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button onClick={handleResetView} variant="outline" size="sm" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset View
          </Button>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Nodes: {nodes.length}</span>
            <span>Connections: {edges.length}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Legend</h3>
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#437e84]"></div>
              <span>Selected Paper</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>1st Degree Citations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span>2nd Degree Citations</span>
            </div>
            <div className="text-gray-600">
              → Arrows show citation direction (citing → cited)
            </div>
          </div>
        </div>
      </div>

      {/* Network Graph */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div style={{ height: '600px', width: '100%' }}>
          <ResponsiveNetwork
            key={networkKey}
            data={{ nodes, links: edges }}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            linkDistance={80}
            centeringStrength={0.3}
            repulsivity={30}
            nodeSize={(n) => n.radius}
            activeNodeSize={(n) => n.radius * 1.5}
            nodeColor={(n) => n.color}
            nodeBorderWidth={1}
            nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
            linkThickness={2}
            linkColor="#999999"
            onClick={handleNodeClick}
            nodeTooltip={({ node }) => (
              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
                <div className="font-medium text-gray-900 mb-1">
                  {truncateTitle(node.data.title, 60)}
                </div>
                {node.data.authors && (
                  <div className="text-sm text-gray-600 mb-1">{node.data.authors}</div>
                )}
                <div className="text-xs text-gray-500 space-y-1">
                  {node.data.year && <div>Year: {node.data.year}</div>}
                  {node.data.venue && <div>Venue: {node.data.venue}</div>}
                  {node.data.citationCount !== undefined && (
                    <div>Citations: {node.data.citationCount}</div>
                  )}
                </div>
              </div>
            )}
            motionConfig="wobbly"
          />
        </div>
      </div>

      {/* Paper Details Modal */}
      {selectedNode && (
        <PaperDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          paper={selectedNode}
        />
      )}
    </div>
  );
};

export default PapersNetwork;
