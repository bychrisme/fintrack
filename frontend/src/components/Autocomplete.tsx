import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface AutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  required = false,
  className,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on value
  useEffect(() => {
    if (!value) {
      setFiltered(suggestions);
    } else {
      const query = value.toLowerCase();
      const matched = suggestions.filter(s => s.toLowerCase().includes(query));
      setFiltered(matched);
    }
    setHighlightedIndex(-1);
  }, [value, suggestions]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        e.preventDefault();
        onChange(filtered[highlightedIndex]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div 
      ref={wrapperRef} 
      style={{ position: 'relative', width: '100%', ...style }} 
      className={className}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          ref={inputRef}
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          required={required}
          style={{ width: '100%', paddingRight: '2.5rem' }}
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              inputRef.current?.focus();
            }
          }}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'hsl(var(--muted))',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronDown 
            size={16} 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} 
          />
        </button>
      </div>

      {isOpen && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--card-border))',
            borderRadius: 'var(--radius-md)',
            marginTop: '0.25rem',
            boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {filtered.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelectOption(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                padding: '0.6rem 0.85rem',
                cursor: 'pointer',
                backgroundColor: index === highlightedIndex ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                color: index === highlightedIndex ? 'white' : 'hsl(var(--foreground))',
                fontSize: '0.875rem',
                transition: 'background-color 0.1s ease',
                borderBottom: index < filtered.length - 1 ? '1px solid hsl(var(--card-border) / 0.3)' : 'none',
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
