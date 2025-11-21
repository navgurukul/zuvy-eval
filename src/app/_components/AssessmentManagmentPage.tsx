'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Play, Users, X, CheckCircle2, BookOpen, Target, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AssessmentConfigForm } from '@/components/adaptive-assessment/AssessmentConfigForm';
import TypingSkeleton from '@/components/adaptive-assessment/LoadingSkeletion';
import { useAiAssessment } from '@/lib/hooks/useAiAssessment';
import { useBootcamp } from '@/lib/hooks/useBootcamp';
import { useQuestionsByLLM, type QuestionByLLM } from '@/lib/hooks/useQuestionsByLLM';

export default function AssessmentManagementPage() {
  const [selectedBootcampId, setSelectedBootcampId] = useState<number | null>(null);
  
  const { assessment: getAssessments, loading, error , refetch } = useAiAssessment({ 
    bootcampId: selectedBootcampId 
  });
  const { bootcamps, loading: bootcampsLoading } = useBootcamp();

  const [searchQuery, setSearchQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>();
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);

  // Helper function to calculate total questions from topics
  const getTotalQuestions = (assessment: any): number => {
    // For API response with totalNumberOfQuestions field
    if (assessment.totalNumberOfQuestions) {
      return assessment.totalNumberOfQuestions;
    }
    // If topics is an array with objects containing count
    if (Array.isArray(assessment.topics)) {
      return assessment.topics.reduce((sum: number, topic: any) => sum + (topic.count || 0), 0);
    }
    // If topics is an object with counts
    if (assessment.topics && typeof assessment.topics === 'object') {
      return Object.values(assessment.topics).reduce((sum: number, count) => sum + Number(count || 0), 0);
    }
    return 0;
  };

  // Get unique topics from API assessments
  const availableTopics = Array.from(
    new Set(
      (getAssessments || []).flatMap((assessment) => {
        if (Array.isArray(assessment.topics)) {
          return assessment.topics.map((t: any) => t.topic);
        }
        if (assessment.topics && typeof assessment.topics === 'object') {
          return Object.keys(assessment.topics);
        }
        return [];
      })
    )
  );

  // Use API data or empty array
  const assessments = getAssessments || [];

  // Filter assessments by search query
  const filteredAssessments = assessments.filter((assessment) =>
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAssessment = () => {
    setSelectedAssessment(undefined);
    setEditorMode('create');
    setEditorOpen(true);
  };

  const handleSaveAssessment = (assessmentData: any) => {
    // After saving, refetch the assessments
    setEditorOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-h5 text-foreground mb-2">
              Assessment Management 
            </h1>
            <p className="text-sm sm:text-body2 ">
              Create and manage adaptive assessments with AI-powered questions
            </p>
          </div>
          <Button 
            onClick={handleCreateAssessment} 
            className="gap-2 h-9 sm:h-10"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Assessment</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>

        {/* Search */}
        {/* <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4   " />
          <Input
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 sm:h-10"
          />
        </div> */}

        {/* Bootcamp Filter */}
        <div className="max-w-md text-black">
          <Select
            value={selectedBootcampId?.toString() || undefined}
            onValueChange={(value) => setSelectedBootcampId(value === 'all' ? null : parseInt(value))}
          >
            <SelectTrigger className="w-full   h-9 sm:h-10">
              <SelectValue placeholder="All Bootcamps" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bootcamps</SelectItem>
              {bootcamps.map((bootcamp) => (
                <SelectItem key={bootcamp.id} value={bootcamp.id.toString()}>
                  {bootcamp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs sm:text-body2   ">Total</p>
              <p className="text-xl sm:text-h5 font-semibold">{assessments.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-success">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-xs sm:text-body2   ">Active</p>
              <p className="text-xl sm:text-h5 font-semibold">{assessments.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs sm:text-body2   ">Avg Questions</p>
              <p className="text-xl sm:text-h5 font-semibold">
                {assessments.length > 0
                  ? Math.round(
                      assessments.reduce((sum, a) => sum + getTotalQuestions(a), 0) /
                        assessments.length
                    )
                  : 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs sm:text-body2   ">Topics</p>
              <p className="text-xl sm:text-h5 font-semibold">{availableTopics.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Assessment List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-8 sm:p-12 text-center">
            <TypingSkeleton />
          </Card>
        ) : filteredAssessments.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <Search className="h-12 w-12    mx-auto mb-4" />
              <h3 className="font-heading text-lg sm:text-xl font-semibold mb-2">
                {selectedBootcampId 
                  ? "No Assessments Found Related to the Bootcamp"
                  : "No Assessments Found"
                }
              </h3>
              <p className="text-sm sm:text-body2    mb-4 sm:mb-6">
                {selectedBootcampId 
                  ? "Try selecting a different bootcamp or create a new assessment"
                  : "Create a new assessment to get started"
                }
              </p>
              <Button 
                onClick={handleCreateAssessment} 
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Assessment
              </Button>
            </div>
          </Card>
        ) : (
          filteredAssessments.map((assessment) => (
            <Card
              key={assessment.id}
              className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="mb-3">
                    <h6 className="">
                      {assessment.title}  
                    </h6>
                    {assessment.description && (
                      <p className="text-xs sm:text-sm    line-clamp-2">
                        {assessment.description}
                      </p>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 text-xs sm:text-sm    flex-wrap">
                    <div className="flex items-center gap-2">
                      <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{getTotalQuestions(assessment)} questions</span>
                    </div>
                    {assessment.difficulty && (
                      <div className="flex items-center gap-2">
                        <span>📊</span>
                        <span className="capitalize">{assessment.difficulty}</span>
                      </div>
                    )}
                    {assessment.audience && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{assessment.audience}</span>
                      </div>
                    )}
                  </div>

                  {/* Topics */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {Array.isArray(assessment.topics) ? (
                      assessment.topics.map((topicItem: any) => (
                        <Badge key={topicItem.topic} variant="secondary" className="text-xs">
                          {topicItem.topic} ({topicItem.count})
                        </Badge>
                      ))
                    ) : assessment.topics && typeof assessment.topics === 'object' ? (
                      Object.entries(assessment.topics).map(([topic, count]) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic} ({String(count)})
                        </Badge>
                      ))
                    ) : null}
                  </div>

                  {/* Dates */}
                  <div className="mt-3 text-xs   ">
                    Created {formatDate(assessment.createdAt)} • Updated{' '}
                    {formatDate(assessment.updatedAt)}
                  </div>
                </div>

                {/* Actions */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedAssessmentId(assessment.id.toString());
                    setQuestionsDialogOpen(true);
                  }}
                  className="gap-2 h-8 sm:h-9"
                >
                  <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">View Questions</span>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* AI Questions Dialog */}
      <AIQuestionsDialog 
        open={questionsDialogOpen}
        onOpenChange={setQuestionsDialogOpen}
        assessmentId={selectedAssessmentId}
      />

      {/* Assessment Config Form */}
      <AssessmentConfigForm
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSaveAssessment}
        mode={editorMode}
        refetch={refetch}
        bootcamps={bootcamps}
        bootcampsLoading={bootcampsLoading}
      />
    </div>
  );
}

// AI Questions Dialog Component
function AIQuestionsDialog({
  open,
  onOpenChange,
  assessmentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string | null;
}) {
  const [shouldFetch, setShouldFetch] = useState(false);

  // Only fetch when dialog opens and we have an assessmentId
  useEffect(() => {
    if (open && assessmentId) {
      setShouldFetch(true);
    }
  }, [open, assessmentId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl sm:text-2xl font-heading">
            AI Generated Questions
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            View all questions generated for this assessment with correct answers highlighted
          </DialogDescription>
        </DialogHeader>
        {shouldFetch && assessmentId ? (
          <AIQuestionsContent assessmentId={assessmentId} />
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="  ">No assessment selected</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Questions Content Component
function AIQuestionsContent({ assessmentId }: { assessmentId: string }) {
  const { questions, loading, error } = useQuestionsByLLM({ sessionId: assessmentId });

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-1">
        <TypingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <X className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-semibold mb-2 text-lg">Error Loading Questions</p>
          <p className="   text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <Search className="h-12 w-12    mx-auto mb-4" />
          <p className="font-semibold mb-2 text-lg">No Questions Found</p>
          <p className="   text-sm">This assessment has no generated questions yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-1 space-y-4 sm:space-y-6">
      <div className="text-sm    mb-4">
        Total Questions: <span className="font-semibold text-foreground">{questions.length}</span>
      </div>
      {questions.map((question, index) => (
        <Card 
          key={question.id} 
          className="p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-lg transition-all"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Question Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="outline" className="font-mono">
                  Q{index + 1}
                </Badge>
                <Badge variant="secondary">
                  {question.topic}
                </Badge>
                <Badge 
                  variant={question.difficulty === 'easy' ? 'default' : question.difficulty === 'medium' ? 'secondary' : 'destructive'}
                >
                  {question.difficulty}
                </Badge>
              </div>
              <p className="text-sm sm:text-base font-medium leading-relaxed text-foreground">
                {question.question}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2 sm:space-y-3 mt-4">
            {question.options
              .sort((a, b) => a.optionNumber - b.optionNumber)
              .map((option) => {
                const isCorrect = option.id === question.correctOption.id;
                return (
                  <div
                    key={option.id}
                    className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      isCorrect
                        ? 'bg-success/10 border-success'
                        : 'bg-muted/30 border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isCorrect
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted-foreground/20   '
                      }`}
                    >
                      {String.fromCharCode(65 + option.optionNumber - 1)}
                    </div>
                    <p className="flex-1 text-xs sm:text-sm leading-relaxed">{option.optionText}</p>
                    {isCorrect && (
                      <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-success" />
                    )}
                  </div>
                );
              })}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs   ">
            <span>Language: {question.language}</span>
            <span>Created: {new Date(question.createdAt).toLocaleDateString()}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
