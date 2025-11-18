"use client";
import React, { useState } from 'react';
import { Sparkles, FileText, Clock } from 'lucide-react';

const Dialog = ({ open, onOpenChange, children }: any) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
};

const DialogContent = ({ children, className }: any) => (
  <div className={`relative z-50 ${className}`}>
    {children}
  </div>
);

export default function ProfessionalLoadingDialog() {
  const [isSubmitting, setIsSubmitting] = useState(true);

  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <Dialog open={isSubmitting} onOpenChange={setIsSubmitting}>
        <DialogContent className="max-w-md w-full">
          <div className="bg-card rounded-2xl shadow-24dp border border-border overflow-hidden">
            {/* Header with gradient using design system colors */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
            
            <div className="p-8">
              {/* Animated Icon Section */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* Pulsing background circle */}
                  <div className="absolute inset-0 bg-primary-light rounded-full animate-ping opacity-75" />
                  
                  {/* Main icon container */}
                  <div className="relative bg-gradient-to-br from-primary to-secondary rounded-full p-5 shadow-16dp">
                    <Sparkles className="w-8 h-8 text-primary-foreground animate-pulse" />
                  </div>
                  
                  {/* Orbiting sparkles */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-bounce" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-secondary rounded-full animate-bounce delay-150" />
                </div>
              </div>

              {/* Main heading */}
              <h2 className="text-2xl font-heading font-semibold text-foreground text-center mb-3">
                Analyzing Your Assessment
              </h2>

              {/* Subheading with animated dots */}
              <p className="text-muted-foreground text-center mb-6">
                AI is carefully reviewing your responses
                <span className="inline-flex ml-1">
                  <span className="animate-bounce delay-0">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </span>
              </p>

              {/* Progress bar */}
              <div className="relative h-2 bg-muted-light rounded-full overflow-hidden mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent animate-shimmer" 
                     style={{
                       backgroundSize: '200% 100%',
                       animation: 'shimmer 2s infinite linear'
                     }}
                />
              </div>

              {/* Status indicators */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-success-light flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-success" />
                  </div>
                  <span className="text-muted-foreground">Processing answers</span>
                  <div className="ml-auto text-success font-medium">Complete</div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-muted-foreground">Evaluating responses</span>
                  <div className="ml-auto">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100" />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-muted-light flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-muted" />
                  </div>
                  <span className="text-muted">Generating feedback</span>
                  <Clock className="ml-auto w-4 h-4 text-muted" />
                </div>
              </div>

              {/* Info box */}
              <div className="bg-gradient-to-br from-info-light to-primary-light border border-info/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-foreground font-semibold mb-1">What happens next?</p>
                    <p className="text-muted-foreground">
                      After AI evaluation, you will be automatically taken to the student evaluation page where you can review detailed feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
        
        .delay-0 {
          animation-delay: 0ms;
        }
        
        .delay-100 {
          animation-delay: 100ms;
        }
        
        .delay-150 {
          animation-delay: 150ms;
        }
        
        .delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
}