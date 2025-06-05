
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, X, Edit2, Loader2 } from 'lucide-react';

interface TopicEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: string[];
  onTopicsFinalized: (topics: string[]) => void;
}

const TopicEditorModal: React.FC<TopicEditorModalProps> = ({
  isOpen,
  onClose,
  topics,
  onTopicsFinalized
}) => {
  const [editableTopics, setEditableTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setEditableTopics([...topics]);
  }, [topics]);

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setEditableTopics([...editableTopics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const handleDeleteTopic = (index: number) => {
    setEditableTopics(editableTopics.filter((_, i) => i !== index));
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(editableTopics[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingValue.trim()) {
      const updated = [...editableTopics];
      updated[editingIndex] = editingValue.trim();
      setEditableTopics(updated);
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        handleAddTopic();
      } else {
        handleSaveEdit();
      }
    }
  };

  const handleFinalize = async () => {
    setIsProcessing(true);
    try {
      await onTopicsFinalized(editableTopics);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit AI Suggested Topics</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Review and edit the AI-suggested topics. You can add, edit, or remove topics as needed.
          </p>
          
          {/* Add new topic */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a new topic..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'add')}
            />
            <Button
              onClick={handleAddTopic}
              disabled={!newTopic.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Topics list */}
          <div className="flex-1 overflow-y-auto space-y-2 border rounded-md p-3 bg-gray-50">
            {editableTopics.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No topics added yet
              </p>
            ) : (
              editableTopics.map((topic, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                  {editingIndex === index ? (
                    <>
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, 'edit')}
                        className="flex-1"
                        autoFocus
                      />
                      <Button onClick={handleSaveEdit} size="sm" variant="outline">
                        Save
                      </Button>
                      <Button onClick={handleCancelEdit} size="sm" variant="outline">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{topic}</span>
                      <Button
                        onClick={() => handleStartEdit(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteTopic(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={editableTopics.length === 0 || isProcessing}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Use these topics
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopicEditorModal;
