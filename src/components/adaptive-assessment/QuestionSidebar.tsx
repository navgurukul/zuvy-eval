'use client';

import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QuestionSidebarProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  answeredQuestions: Set<number>;
  onQuestionSelect: (index: number) => void;
  className?: string;
}

export function QuestionSidebar({
  totalQuestions,
  currentQuestionIndex,
  answeredQuestions,
  onQuestionSelect,
  className,
}: QuestionSidebarProps) {
  return (
    <div className={cn('bg-card border-r border-border', className)}>
      <div className="p-3 sm:p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
        <h3 className="font-heading text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{answeredQuestions.size}</span>
          </div>
          Questions
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-8">
          {answeredQuestions.size} of {totalQuestions} answered
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)]">
        <div className="p-2 sm:p-4 space-y-1.5 sm:space-y-2">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const questionNumber = index + 1;
            const isAnswered = answeredQuestions.has(index);
            const isCurrent = currentQuestionIndex === index;

            return (
              <button
                key={index}
                onClick={() => onQuestionSelect(index)}
                className={cn(
                  'group relative overflow-hidden w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all duration-300',
                  'hover:shadow-md hover:scale-[1.02]',
                  isCurrent && 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary shadow-md',
                  !isCurrent && !isAnswered && 'bg-gradient-to-br from-muted/30 to-muted/10 border border-border/40 hover:border-primary/30',
                  !isCurrent && isAnswered && 'bg-gradient-to-r from-success/10 via-success/5 to-transparent border border-success/30 hover:border-success/50'
                )}
              >
                {/* Status Indicator Bar */}
                <div className={cn(
                  'absolute top-0 left-0 right-0 h-0.5 transition-all',
                  isCurrent && 'bg-gradient-to-r from-primary via-primary-dark to-primary',
                  !isCurrent && isAnswered && 'bg-gradient-to-r from-success via-success-dark to-success'
                )} />
                
                {/* Gradient Overlay */}
                {!isCurrent && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                
                <div
                  className={cn(
                    'relative flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 transition-all duration-200 shadow-sm',
                    isCurrent && 'bg-primary text-primary-foreground shadow-md scale-110',
                    !isCurrent && isAnswered && 'bg-success text-success-foreground',
                    !isCurrent && !isAnswered && 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                  )}
                >
                  {isAnswered ? (
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <span className={`text-xs sm:text-sm text-black ${isCurrent && 'text-white'} font-semibold`}>{questionNumber}</span>
                  )}
                </div>

                <div className="relative flex-1 text-left min-w-0">
                  <p
                    className={cn(
                      'text-xs sm:text-sm font-medium truncate transition-colors',
                      isCurrent ? 'text-primary font-semibold' : 'text-foreground'
                    )}
                  >
                    Question {questionNumber}
                  </p>
                  <p className={cn(
                    'text-xs text-muted-foreground truncate',
                    isAnswered && 'text-success',
                    isCurrent && 'text-primary/70'
                  )}>
                    {isAnswered ? '✓ Answered' : isCurrent ? '• Current' : 'Not answered'}
                  </p>
                </div>

                {isCurrent && (
                  <div className="relative">
                    <Circle className="h-2 w-2 fill-primary text-primary animate-pulse flex-shrink-0" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
