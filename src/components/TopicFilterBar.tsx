
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandInput, CommandList, CommandItem } from './ui/command';
import { Checkbox } from './ui/checkbox';
import { Filter, X } from 'lucide-react';

interface TopicFilterBarProps {
  topics: string[];
  selectedTopics: Set<string>;
  onTopicToggle: (topic: string) => void;
  onClearAll: () => void;
}

const TopicFilterBar: React.FC<TopicFilterBarProps> = ({
  topics,
  selectedTopics,
  onTopicToggle,
  onClearAll
}) => {
  const [open, setOpen] = useState(false);

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter by Topic
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search topics..." />
              <CommandList className="max-h-48">
                {topics.map((topic) => (
                  <CommandItem
                    key={topic}
                    onSelect={() => onTopicToggle(topic)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedTopics.has(topic)}
                      onChange={() => {}}
                    />
                    <span className="flex-1">{topic}</span>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedTopics.size > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </div>

      {selectedTopics.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from(selectedTopics).map((topic) => (
            <Badge key={topic} variant="secondary" className="flex items-center gap-1">
              {topic}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => onTopicToggle(topic)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicFilterBar;
