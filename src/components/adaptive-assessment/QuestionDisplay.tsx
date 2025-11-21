'use client';

import { useEffect } from 'react';
import { AdaptiveQuestion, QuestionOption } from '@/types/adaptive-assessment';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface QuestionDisplayProps {
  question: AdaptiveQuestion;
  selectedOptionIds: string[];
  onOptionSelect: (optionId: string) => void;
  questionNumber: number;
  totalQuestions: number;
  disabled?: boolean;
}

export function QuestionDisplay({
  question,
  selectedOptionIds,
  onOptionSelect,
  questionNumber,
  totalQuestions,
  disabled = false,
}: QuestionDisplayProps) {
  const isSingleAnswer = question.questionType === 'single-answer';

  const { speak, pause, resume, cancel, speaking, paused, supported } = useSpeechSynthesis({
    rate: 0.8,
    onError: (error) => {
      if (error.error !== 'interrupted' && error.error !== 'canceled') {
        console.error('Speech error:', error);
      }
    },
  });

  // Stop speech when question changes
  useEffect(() => {
    return () => {
      // Cleanup: stop speech when component unmounts or question changes
      cancel();
    };
  }, [question.id, cancel]);

  const handleOptionChange = (optionId: string) => {
    if (disabled) return;
    onOptionSelect(optionId);
  };

  const handleListenToQuestion = () => {
    if (!supported) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    // If already speaking, toggle pause/resume
    if (speaking) {
      if (paused) {
        resume();
      } else {
        pause();
      }
      return;
    }

    // Create the text to be spoken
    let textToSpeak = `Question ${questionNumber}. ${question.questionText}. `;
    
    // Add options
    if (isSingleAnswer) {
      textToSpeak += 'The options are. ';
    } else {
      textToSpeak += 'Select all that apply. The options are. ';
    }
    
    question.options.forEach((option, index) => {
      const optionLetter = String.fromCharCode(65 + index);
      textToSpeak += `Option ${optionLetter}. ${option.text}. `;
    });

    // Clean up the text
    textToSpeak = textToSpeak
      .replace(/\+\+/g, ' plus plus ')
      .replace(/--/g, ' minus minus ')
      .replace(/==/g, ' equals equals ')
      .replace(/!=/g, ' not equals ')
      .replace(/<=/g, ' less than or equal to ')
      .replace(/>=/g, ' greater than or equal to ')
      .replace(/->/g, ' arrow ')
      .replace(/=>/g, ' fat arrow ')
      .replace(/\+=/g, ' plus equals ')
      .replace(/-=/g, ' minus equals ')
      .replace(/\*=/g, ' times equals ')
      .replace(/\/=/g, ' divided by equals ')
      .replace(/&&/g, ' and ')
      .replace(/\|\|/g, ' or ')
      // Handle array indexing like arr[i] or array[index]
      .replace(/`?([a-zA-Z_][a-zA-Z0-9_]*)\[([a-zA-Z_][a-zA-Z0-9_]*)\]`?/g, (match, arrayName, indexName) => {
        const commonKeywords = ['for', 'if', 'else', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'function', 'class', 'const', 'let', 'var', 'new', 'this', 'super', 'try', 'catch', 'throw', 'async', 'await', 'import', 'export', 'from', 'default', 'true', 'false', 'null', 'undefined'];
        
        const spelledArray = commonKeywords.includes(arrayName.toLowerCase()) 
          ? arrayName 
          : arrayName.split('').join(' ').toUpperCase();
        
        const spelledIndex = commonKeywords.includes(indexName.toLowerCase()) 
          ? indexName 
          : indexName.split('').join(' ').toUpperCase();
        
        return `${spelledArray} of ${spelledIndex}`;
      })
      // Spell out variable names in backticks or code context
      .replace(/`([a-zA-Z_][a-zA-Z0-9_]*)`/g, (match, variable) => {
        // Common keywords and words to NOT spell out
        const commonKeywords = ['for', 'if', 'else', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'function', 'class', 'const', 'let', 'var', 'new', 'this', 'super', 'try', 'catch', 'throw', 'async', 'await', 'import', 'export', 'from', 'default', 'true', 'false', 'null', 'undefined', 'in', 'of'];
        if (commonKeywords.includes(variable.toLowerCase())) {
          return variable;
        }
        return variable.split('').join(' ').toUpperCase();
      })
      .replace(/[*_~`#]/g, '')
      .replace(/[\[\](){}]/g, ' ')
      .replace(/[•◦▪]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .replace(/\.{2,}/g, '.')
      .trim();

    speak(textToSpeak);
  };

  const handleStopSpeech = () => {
    cancel();
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Question Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 sm:h-10 sm:w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm sm:text-base font-bold text-primary">{questionNumber}</span>
          </div>
          <Badge variant="outline" className="text-xs sm:text-sm border-primary/30 bg-primary/5">
            {questionNumber} of {totalQuestions}
          </Badge>
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs sm:text-sm bg-secondary/20 text-secondary-dark border border-secondary/30">
            {question.topic}
          </Badge>
          {question.subtopic && (
            <Badge variant="outline" className="text-xs sm:text-sm border-success/30 bg-success/10 text-success-dark">
              {question.subtopic}
            </Badge>
          )}
        </div>
      </div>

      {/* Question Image (if exists) */}
      {question.imageUrl && (
        <div className="w-full rounded-lg overflow-hidden mb-6">
          <img
            src={question.imageUrl}
            alt="Question"
            className="w-full h-auto object-contain max-h-[400px]"
          />
        </div>
      )}

      {/* Question Text */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <h6 className="flex-1">
          Q. {question.questionText} 
        </h6>
        {supported && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleListenToQuestion}
              className="gap-2 h-8 sm:h-9 text-xs sm:text-sm"
            >
              {speaking ? (
                paused ? (
                  <>
                    <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Resume</span>
                    <span className="sm:hidden">Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Pause</span>
                    <span className="sm:hidden">Pause</span>
                  </>
                )
              ) : (
                <>
                  <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Listen to Question</span>
                  <span className="sm:hidden">Listen</span>
                </>
              )}
            </Button>
            {speaking && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopSpeech}
                className="gap-2 h-8 sm:h-9 text-xs sm:text-sm"
              >
                <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Stop</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3 sm:space-y-4">
        {isSingleAnswer ? (
          // Single Answer (Radio buttons)
          <RadioGroup
            value={selectedOptionIds[0] || ''}
            onValueChange={handleOptionChange}
            disabled={disabled}
          >
            {question.options.map((option, index) => (
              <div
                key={option.id}
                className={`group  relative overflow-hidden rounded-lg bg-gradient-to-br from-card via-card-elevated to-card-light border transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
                  selectedOptionIds.includes(option.id)
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border/40 hover:border-primary/30'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !disabled && handleOptionChange(option.id)}
              >
                {/* Selection Indicator Bar */}
                {selectedOptionIds.includes(option.id) && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
                )}
                
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
                  {/* Option Number Badge */}
                  <div className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    selectedOptionIds.includes(option.id)
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted  group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <span className="text-sm sm:text-base font-bold">{String.fromCharCode(65 + index)}</span>
                  </div>
                  
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    className="mt-2 sm:mt-3 flex-shrink-0"
                    disabled={disabled}
                  />
                  
                  <Label
                    htmlFor={option.id}
                    className={`flex-1 cursor-pointer text-sm sm:text-base mt-1 sm:mt-2 ${
                      disabled ? 'cursor-not-allowed' : ''
                    }`}
                  >
                    {option.imageUrl ? (
                      <div className="space-y-1">
                        <img
                          src={option.imageUrl}
                          alt={option.text}
                          className="w-full h-auto rounded-md max-h-[150px] sm:max-h-[200px] object-contain border border-border/20"
                        />
                        {option.text && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {option.text}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="leading-relaxed">{option.text}</span>
                    )}
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        ) : (
          // Multiple Answer (Checkboxes)
          <div className="space-y-1 sm:space-y-1">
            {question.options.map((option, index) => (
              <div
                key={option.id}
                className={`group relative overflow-hidden rounded-lg bg-gradient-to-br from-card via-card-elevated to-card-light border transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
                  selectedOptionIds.includes(option.id)
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border/40 hover:border-primary/30'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !disabled && handleOptionChange(option.id)}
              >
                {/* Selection Indicator Bar */}
                {selectedOptionIds.includes(option.id) && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-primary" />
                )}
                
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
                  {/* Option Number Badge */}
                  <div className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    selectedOptionIds.includes(option.id)
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <span className="text-sm sm:text-base font-bold">{String.fromCharCode(65 + index)}</span>
                  </div>
                  
                  <Checkbox
                    id={option.id}
                    checked={selectedOptionIds.includes(option.id)}
                    onCheckedChange={() => handleOptionChange(option.id)}
                    className="mt-2 sm:mt-3 flex-shrink-0"
                    disabled={disabled}
                  />
                  
                  <Label
                    htmlFor={option.id}
                    className={`flex-1 cursor-pointer text-sm sm:text-base mt-1 sm:mt-2 ${
                      disabled ? 'cursor-not-allowed' : ''
                    }`}
                  >
                    {option.imageUrl ? (
                      <div className="space-y-2">
                        <img
                          src={option.imageUrl}
                          alt={option.text}
                          className="w-full h-auto rounded-md max-h-[150px] sm:max-h-[200px] object-contain border border-border/20"
                        />
                        {option.text && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {option.text}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="leading-relaxed">{option.text}</span>
                    )}
                  </Label>
                </div>
              </div>
            ))}
            <p className="text-xs sm:text-sm text-muted-foreground italic mt-2 px-2">
              ✓ Select all that apply
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
