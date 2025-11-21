"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, FileText, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import "../../app/style.css";

import {
  useQuestionsByLLM,
  QuestionByLLM,
} from "@/lib/hooks/useQuestionsByLLM";
import { AdaptiveQuestion } from "@/types/adaptive-assessment";
import { api, apiLLM } from "@/utils/axios.config";
import { useToast } from "@/components/ui/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionDisplay } from "@/components/adaptive-assessment/QuestionDisplay";
import { QuestionSidebar } from "@/components/adaptive-assessment/QuestionSidebar";
import { ProgressIndicator } from "@/components/adaptive-assessment/ProgressIndicator";
import {
  AssessmentSession,
  QuestionSubmission,
} from "@/types/adaptive-assessment";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { is } from "date-fns/locale";

interface AssessmentSessionPageProps {
  sessionId: string;
}

// API Payload interfaces
interface AssessmentAnswerPayload {
  id: number;
  question: string;
  topic: string;
  difficulty: string;
  options: {
    id: number;
    questionId: number;
    optionText: string;
    optionNumber: number;
  }[];
  correctOption: number;
  selectedAnswerByStudent: {
    id: number;
    questionId: number;
    optionText: string;
    optionNumber: number;
  } | number;
  language: string;
}

interface SubmitAssessmentPayload {
  answers: AssessmentAnswerPayload[];
  aiAssessmentId: number;
}

export default function AssessmentSessionPage({
  sessionId,
}: AssessmentSessionPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams()
  const params = useParams()
  const bootcampId = searchParams.get('bootcampId')

  // Session state
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    questions: apiQuestions,
    isCompleted,
    loading: questionLoading,
    error,
    refetch,
  } = useQuestionsByLLM({ sessionId });
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<
    AdaptiveQuestion[]
  >([]);
  // Store mapping between question index and original API question
  const [questionMapping, setQuestionMapping] = useState<Map<number, QuestionByLLM>>(new Map());

  // Helper function to transform API questions to AdaptiveQuestion format
  const transformToAdaptiveQuestion = (
    llmQuestion: QuestionByLLM
  ): AdaptiveQuestion => {
    // Convert options array to QuestionOption format
    const optionsArray = llmQuestion.options.map((opt) => ({
      id: `option-${llmQuestion.id}-${opt.optionNumber}`,
      text: opt.optionText,
      isCorrect: opt.optionNumber === llmQuestion.correctOption.optionNumber,
      distractorRationale:
        opt.optionNumber !== llmQuestion.correctOption.optionNumber
          ? "This answer is incorrect. Please review the concept."
          : undefined,
    }));

    const correctOption = optionsArray.find((opt) => opt.isCorrect);

    // Map difficulty to numeric scale (1-10)
    const difficultyMap: {
      [key: string]: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    } = {
      "very easy": 2,
      easy: 3,
      basic: 4,
      medium: 5,
      intermediate: 5,
      advanced: 7,
      hard: 8,
      expert: 10,
    };

    return {
      id: `q-${llmQuestion.id}`,
      title: llmQuestion.topic,
      questionText: llmQuestion.question,
      questionType: "single-answer",
      options: optionsArray,
      correctAnswerIds: correctOption ? [correctOption.id] : [],
      difficulty: difficultyMap[llmQuestion.difficulty.toLowerCase()] || 5,
      topic: llmQuestion.topic,
      subtopic: llmQuestion.language,
      tags: [llmQuestion.language, llmQuestion.difficulty, llmQuestion.topic],
      explanation: `The correct answer is "${llmQuestion.correctOption.optionText}". This tests your understanding of ${llmQuestion.topic} in ${llmQuestion.language}.`,
      conceptTested: llmQuestion.topic,
      estimatedTime: 120, // 2 minutes default
      relatedResources: [],
      createdAt: llmQuestion.createdAt,
      updatedAt: llmQuestion.updatedAt,
      createdBy: "system",
      status: "active",
    };
  };

  // Transform API questions when they load
  useEffect(() => {
    if (apiQuestions && apiQuestions.length > 0) {
      const transformed = apiQuestions.map(transformToAdaptiveQuestion);
      setAdaptiveQuestions(transformed);

      // Create mapping for original questions
      const mapping = new Map();
      apiQuestions.forEach((q, index) => {
        mapping.set(index, q);
      });
      setQuestionMapping(mapping);
    }
  }, [apiQuestions]);

  // UI state
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string[]>>(
    new Map()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Track which questions have been answered
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(
    new Set()
  );

  // Initialize session
  useEffect(() => {
    if (adaptiveQuestions.length > 0) {
      // Create session with transformed questions
      const newSession: AssessmentSession = {
        id: sessionId,
        studentId: "student1",
        assessmentConfigId: "config1",
        status: "in-progress",
        currentQuestionIndex: 0,
        questions: adaptiveQuestions,
        submissions: [],
        currentDifficulty: 5,
        proficiencyEstimate: undefined,
        score: 0,
        totalQuestions: adaptiveQuestions.length,
        timeRemaining: 0, // Timer removed
        startTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSession(newSession);
      setLoading(false);
    }
  }, [sessionId, adaptiveQuestions]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const currentQuestion = session?.questions[session.currentQuestionIndex];
  const isLastQuestion =
    session && session.currentQuestionIndex === session.totalQuestions - 1;
  const currentQuestionAnswers =
    selectedAnswers.get(session?.currentQuestionIndex ?? -1) || [];

  useEffect(() => {
    if (isCompleted) {
      // setShowSubmitDialog(true);
      router.push(`/student/bootcamp/${bootcampId}`)
    }
  }, [isCompleted]);

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    if (!currentQuestion || !session) return;

    const currentIndex = session.currentQuestionIndex;

    if (currentQuestion.questionType === "single-answer") {
      setSelectedAnswers((prev) => new Map(prev).set(currentIndex, [optionId]));
    } else {
      // Multiple answer - toggle selection
      const current = selectedAnswers.get(currentIndex) || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setSelectedAnswers((prev) => new Map(prev).set(currentIndex, updated));
    }

    // Mark question as answered
    setAnsweredQuestions((prev) => new Set([...prev, currentIndex]));
  };

  // Handle submission of all answers
  const handleSubmitAssessment = async () => {
    if (!session) return;

    // Validate that at least one question has been answered
    if (selectedAnswers.size === 0) {
      toast({
        title: "No Answers",
        description: "Please answer at least one question before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload for API - only include answered questions

      const answers: AssessmentAnswerPayload[] = Array.from(
        selectedAnswers.entries()
      )
        .filter(([_, selectedOptionIds]) => selectedOptionIds.length > 0) // Only answered questions
        .map(([questionIndex, selectedOptionIds]) => {

          const originalQuestion = questionMapping.get(questionIndex);

          if (!originalQuestion) {
            console.warn(
              `No original question found for index ${questionIndex}`
            );
            return null;
          }

          // Extract the option number from the selected option ID (e.g., "option-67-2" -> 2)
          const selectedOptionNumber = parseInt(
            selectedOptionIds[0].split("-")[2]
          );

          // Find the full option object for the selected option number
          const selectedOptionObj = originalQuestion.options.find(
            (opt) => opt.optionNumber === selectedOptionNumber
          );

          if (!selectedOptionObj) {
            console.warn(
              `Selected option object not found for question ${originalQuestion.id} option number ${selectedOptionNumber}`
            );
            return null;
          }

          const answer: AssessmentAnswerPayload = {
            id: originalQuestion.id,
            question: originalQuestion.question,
            topic: originalQuestion.topic,
            difficulty: originalQuestion.difficulty,
            options: originalQuestion.options,
            correctOption: originalQuestion.correctOption.optionNumber,
            selectedAnswerByStudent: selectedOptionObj || -1,
            language: originalQuestion.language,
          };
          return answer;
        })
        .filter((answer): answer is AssessmentAnswerPayload => answer !== null);

      // Include unanswered questions with selectedAnswerByStudent as -1
      const otherAnswers = Array.from(questionMapping.values()).filter((unansweredQuestion: QuestionByLLM) =>
        !answers.some(answeredQuestion => answeredQuestion.id === unansweredQuestion.id)
      ).map((unansweredQuestion: QuestionByLLM) => {
        return {
          id: unansweredQuestion.id,
          question: unansweredQuestion.question,
          topic: unansweredQuestion.topic,
          difficulty: unansweredQuestion.difficulty,
          options: unansweredQuestion.options,
          correctOption: unansweredQuestion.correctOption.optionNumber,
          selectedAnswerByStudent: -1, // Indicate no answer selected
          language: unansweredQuestion.language,
        };
      });

      const allQuestions = [...answers, ...otherAnswers]

      const payload: SubmitAssessmentPayload = {
        answers: allQuestions,
        aiAssessmentId: +sessionId,
      };

      // Call the API
      const response = await apiLLM.post("/ai-assessment/submit", payload);

      // Update session with submissions
      const submissions: QuestionSubmission[] = [];
      let totalScore = 0;

      selectedAnswers.forEach((selectedOptionIds, questionIndex) => {
        const question = session.questions[questionIndex];
        if (!question) return;

        const correctAnswerIds = new Set(question.correctAnswerIds);
        const selectedAnswerIds = new Set(selectedOptionIds);

        const isCorrect =
          correctAnswerIds.size === selectedAnswerIds.size &&
          [...correctAnswerIds].every((id) => selectedAnswerIds.has(id));

        if (isCorrect) totalScore++;

        const submission: QuestionSubmission = {
          id: `sub-${Date.now()}-${questionIndex}`,
          sessionId: session.id,
          questionId: question.id,
          studentId: session.studentId,
          selectedOptionIds: selectedOptionIds,
          isCorrect,
          score: isCorrect ? 1 : 0,
          timeSpent: 60,
          submittedAt: new Date().toISOString(),
          clientTimestamp: new Date().toISOString(),
          syncStatus: "synced",
        };

        submissions.push(submission);
      });

      // Update session with all submissions
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          submissions: submissions,
          score: totalScore,
          status: "completed",
          completedAt: new Date().toISOString(),
        };
      });

      // Show success message
      toast({
        title: "Assessment Submitted",
        description: `You answered ${answeredQuestions.size} out of ${session.totalQuestions} questions.`,
        variant: "default",
      });

      setIsSubmitting(false);
      setShowSubmitDialog(false);

      // Navigate to results
      setTimeout(() => {
        router.push(
          `/student/studentAssessment/studentResults?assessmentId=${sessionId}`
        );
      }, 1000);
    } catch (error: any) {
      console.error("Error submitting assessment:", error);

      setIsSubmitting(false);

      // Show error message
      toast({
        title: "Submission Failed",
        description:
          error?.response?.data?.message ||
          "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle next question
  const handleNext = () => {
    if (!session) return;

    if (isLastQuestion) {
      // Move to next question or stay on last
      return;
    } else {
      // Move to next question
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
        };
      });
    }
  };

  // Handle previous question
  const handlePrevious = () => {
    if (!session || session.currentQuestionIndex === 0) return;

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      };
    });
  };

  // Handle question navigation from sidebar
  const handleQuestionSelect = (index: number) => {
    if (!session) return;

    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentQuestionIndex: index,
      };
    });
  };

  // Handle exit
  const handleExit = () => {
    router.push(`/student/bootcamp/${bootcampId}`);
  };

  if (loading || questionLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-body1 text-muted-foreground">
            {questionLoading ? "Loading questions..." : "Loading assessment..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-body1 text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={handleExit} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-body1 text-destructive">Assessment not found</p>
          <Button variant="outline" onClick={handleExit} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Exit</span>
            </Button>
            <div className="flex-1 sm:flex-initial">
              <h1 className="font-heading text-sm sm:text-base font-semibold text-foreground">
                Assessment Session
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Question {session.currentQuestionIndex + 1} of{" "}
                {session.totalQuestions}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 w-full sm:w-auto justify-between sm:justify-end">
            {/* <OfflineIndicator
              isOnline={isOnline}
              pendingSyncCount={pendingSyncCount}
            /> */}
            <ProgressIndicator
              current={answeredQuestions.size}
              total={session.totalQuestions}
            />
           <Button
  size="sm"
  onClick={() => setShowSubmitDialog(true)}
  disabled={answeredQuestions.size === 0 || isSubmitting}
  className="gap-1 sm:gap-2 h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
>
  {isSubmitting ? (
    <>
      <Dialog
        open={isSubmitting}
        onOpenChange={(val) => setIsSubmitting(val)}
      >
        <DialogContent
          className="max-w-md [&>button]:hidden"
          onInteractOutside={e => e.preventDefault()}
        >
          
          {/* Visually hidden title for accessibility */}
          <VisuallyHidden>
            <DialogTitle>Reviewing Assessment</DialogTitle>
          </VisuallyHidden>

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
                              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-secondary rounded-full animate-bounce"
                                style={{ animationDelay: '150ms' }} />
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
                              <span className="animate-bounce">.</span>
                              <span className="animate-bounce" style={{ animationDelay: '100ms' }}>.</span>
                              <span className="animate-bounce" style={{ animationDelay: '200ms' }}>.</span>
                            </span>
                          </p>

                          {/* Progress bar */}
                          <div className="relative h-2 bg-muted-light rounded-full overflow-hidden mb-6">
                            <div
                              className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent"
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
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                                    style={{ animationDelay: '100ms' }} />
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                                    style={{ animationDelay: '200ms' }} />
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
                                <p className="">
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
      `}</style>
                </>
              ) : (
                <>
                  Submit Assessment
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <QuestionSidebar
          totalQuestions={session.totalQuestions}
          currentQuestionIndex={session.currentQuestionIndex}
          answeredQuestions={answeredQuestions}
          onQuestionSelect={handleQuestionSelect}
          className="hidden lg:block w-64 flex-shrink-0"
        />

        {/* Question Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto p-3 sm:p-4 lg:p-6">
            <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-card via-card-elevated to-card-light border border-border/40 transition-all duration-300 shadow-md hover:shadow-xl">
              {/* Top Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-secondary" />
              
              {/* Content with controlled overflow */}
              <div className="relative p-3 sm:p-4 lg:p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                <QuestionDisplay
                  question={currentQuestion}
                  selectedOptionIds={currentQuestionAnswers}
                  onOptionSelect={handleOptionSelect}
                  questionNumber={session.currentQuestionIndex + 1}
                  totalQuestions={session.totalQuestions}
                  disabled={false}
                />

                {/* Navigation Buttons */}
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 sticky bottom-0 bg-gradient-to-t from-card via-card to-transparent pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={session.currentQuestionIndex === 0}
                    className="gap-2 w-full sm:w-auto order-2 sm:order-1 hover:bg-primary/10 hover:border-primary transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={isLastQuestion ?? false}
                    className="gap-2 w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-md hover:shadow-lg transition-all"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Assessment Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assessment?</DialogTitle>
            <DialogDescription>
              You have answered {answeredQuestions.size} out of{" "}
              {session.totalQuestions} questions. Are you sure you want to
              submit your assessment?
              {answeredQuestions.size < session.totalQuestions && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Warning: You have not answered all questions!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
            >
              Review Answers
            </Button>
            <Button onClick={handleSubmitAssessment} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
