"use client";

import { useStudentAssessmentsByBootcamp } from '@/lib/hooks/useStudentAssessmentsByBootcamp';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getUser } from '@/store/store';
import { ArrowLeft } from "lucide-react";


type Props = {}

const Page = (props: Props) => {
  const router = useRouter();
  const { bootcampId } = useParams();
  const { user } = getUser();

  if (!bootcampId) {
    return (
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="font-heading text-body1 font-semibold mb-2">
            Missing Bootcamp ID
          </h3>
          <p className="text-body2 text-muted-foreground">
            Unable to load assessments without a valid bootcamp ID.
          </p>
        </Card>
      </div>
    );
  }

  const { assessments, loading, error } = useStudentAssessmentsByBootcamp({ 
    studentId: parseInt(user.id),
    bootcampId: Number(bootcampId) 
  });

  const handleStartAssessment = (assessmentId: number) => {
    router.push(`/student/studentAssessment/${assessmentId}?bootcampId=${bootcampId}`);
  };

  const handleViewResults = (assessmentId: number) => {
    router.push(`/student/studentAssessment/studentResults?assessmentId=${assessmentId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAssessmentAvailable = (startDate: string, endDate: string, status: number) => {
    // If already submitted (status = 1), not available to take again
    if (status === 1) return false;
    
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  const getAssessmentStatus = (startDate: string, endDate: string, status: number) => {
    // Check if submitted first
    if (status === 1) {
      return { label: 'Submitted', variant: 'default' as const, color: 'text-success' };
    }
    
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return { label: 'Upcoming', variant: 'outline' as const, color: 'text-muted-foreground' };
    if (now > end) return { label: 'Ended', variant: 'outline' as const, color: 'text-destructive' };
    return { label: 'Active', variant: 'default' as const, color: 'text-success' };
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff < 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Less than 1 hour remaining';
  };

  // Calculate stats
  const totalAssessments = assessments?.length || 0;
  const activeAssessments = assessments?.filter(a => 
    isAssessmentAvailable(a.startDatetime, a.endDatetime, a.status)
  ).length || 0;
  const submittedAssessments = assessments?.filter(a => a.status === 1).length || 0;
  const totalQuestions = assessments?.reduce((sum, a) => sum + a.totalNumberOfQuestions, 0) || 0;
  const uniqueTopics = new Set(
    assessments?.flatMap(a => Object.keys(a.topics || {})) || []
  );

  const handleExit = () => {
    router.push(`/student`);
  };

  return (
    <div className="w-full px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExit}
          // className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">Exit</span>
        </Button>
      <div className="mb-8">
        <h1 className="font-heading text-h5 text-foreground mb-2">
          My Assessments
        </h1>
        <p className="text-body2">
          Complete your assessments and track your progress
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-body2 ">Total Assessments</p>
              <p className="text-h5 font-semibold">{totalAssessments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="text-body2">Active</p>
              <p className="text-h5 font-semibold">{activeAssessments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-success">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-body2 ">Submitted</p>
              <p className="text-h5 font-semibold">{submittedAssessments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-body2 ">Topics Covered</p>
              <p className="text-h5 font-semibold">{uniqueTopics.size}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Assessments List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-8 text-center">
            <Clock className="h-10 w-10  mx-auto mb-3 animate-spin" />
            <h3 className="font-heading text-body1 font-semibold mb-1">
              Loading assessments...
            </h3>
            <p className="text-body2">
              Please wait a moment.
            </p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h3 className="font-heading text-body1 font-semibold mb-1">
              Error Loading Assessments
            </h3>
            <p className="text-body2  mb-3">
              {error}
            </p>
          </Card>
        ) : !assessments || assessments.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-10 w-10  mx-auto mb-3" />
            <h3 className="font-heading text-body1 font-semibold mb-1">
              No assessments available
            </h3>
            <p className="text-body2 ">
              There are no assessments for this bootcamp yet.
            </p>
          </Card>
        ) : (
          assessments.map((item) => {
            const status = getAssessmentStatus(item.startDatetime, item.endDatetime, item.status);
            const isAvailable = isAssessmentAvailable(item.startDatetime, item.endDatetime, item.status);
            const isSubmitted = item.status === 1;
            
            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-card via-card-elevated to-card-light border border-border/40 hover:border-secondary/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-info/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  isSubmitted
                    ? 'bg-gradient-to-r from-success via-success-dark to-success'
                    : isAvailable 
                    ? 'bg-gradient-to-r from-secondary via-secondary-dark to-success' 
                    : new Date() < new Date(item.startDatetime)
                    ? 'bg-gradient-to-r from-info via-info-dark to-info'
                    : 'bg-gradient-to-r from-muted via-muted-dark to-muted'
                }`} />

                <div className="relative p-5">
                  {/* Header Section */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 space-y-2">
                      {/* Title */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-heading text-lg font-bold text-foreground mb-1 group-hover:text-secondary transition-colors duration-300">
                            {item.title}
                          </h3>
                          <p className="text-sm line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Topics Pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(item.topics).map(([topic, count]) => (
                          <div
                            key={topic}
                            className="px-2.5 py-1 rounded-full bg-secondary-light border border-secondary/20 hover:bg-secondary/20 hover:border-secondary/40 transition-all duration-200 cursor-default"
                          >
                            <span className="text-xs font-medium text-secondary-dark">
                              {topic}
                            </span>
                            <span className="ml-1 text-xs font-bold text-secondary/70">
                              ×{count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Button Section */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      {/* Status Badge */}
                      <div className={`
                        px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                        ${isSubmitted
                          ? 'bg-success/20 text-success border border-success/30'
                          : isAvailable 
                          ? 'bg-secondary/20 text-secondary border border-secondary/30' 
                          : new Date() < new Date(item.startDatetime)
                          ? 'bg-info/20 text-info border border-info/30'
                          : 'bg-muted border border-muted'
                        }
                      `}>
                        {status.label}
                      </div>

                      {/* Action Button */}
                      {isSubmitted ? (
                        <Button
                          onClick={() => handleViewResults(item.id)}
                          size="default"
                          className="w-[140px] h-10 text-sm font-semibold bg-gradient-to-r from-success to-success-dark hover:from-success-dark hover:to-success shadow-md shadow-success/20 hover:shadow-lg hover:shadow-success/30 transition-all duration-300 group/btn"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                          <span>View Results</span>
                        </Button>
                      ) : isAvailable ? (
                        <Button
                          onClick={() => handleStartAssessment(item.id)}
                          size="default"
                          className="w-[140px] h-10 text-sm font-semibold bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary shadow-md shadow-secondary/20 hover:shadow-lg hover:shadow-secondary/30 transition-all duration-300 group/btn"
                        >
                          <Play className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                          <span>Start Now</span>
                        </Button>
                      ) : new Date() < new Date(item.startDatetime) ? (
                        <Button
                          disabled
                          size="default"
                          variant="outline"
                          className="w-[140px] h-10 text-sm font-semibold border-info/30 text-info bg-info/5 cursor-not-allowed"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Coming Soon</span>
                        </Button>
                      ) : (
                        <Button
                          disabled
                          size="default"
                          variant="outline"
                          className="w-[140px] h-10 text-sm font-semibold border-muted text-muted-foreground bg-muted/30 cursor-not-allowed"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span>Ended</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid - Compact */}
                  <div className="grid grid-cols-4 gap-3 p-4 rounded-md bg-primary-light/30 backdrop-blur-sm border border-primary/10">
                    {/* Questions */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">Questions</span>
                      </div>
                      <p className="text-xl font-bold text-primary-dark">
                        {item.totalNumberOfQuestions}
                      </p>
                      <p className="text-xs">
                        +{item.totalQuestionsWithBuffer - item.totalNumberOfQuestions} buffer
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">Duration</span>
                      </div>
                      <p className="text-xl font-bold text-info-dark">
                        {Math.ceil((new Date(item.endDatetime).getTime() - new Date(item.startDatetime).getTime()) / (1000 * 60 * 60 * 24))}
                      </p>
                      <p className="text-xs">days</p>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">Starts</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(item.startDatetime).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs">
                        {new Date(item.startDatetime).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>

                    {/* End Date */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">Ends</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(item.endDatetime).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs">
                        {new Date(item.endDatetime).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Time Remaining Bar - Only for Active */}
                  {isAvailable && !isSubmitted && (
                    <div className="mt-3 p-3 rounded-md bg-accent-light/50 border border-accent/20">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                          <span className="text-xs font-medium text-accent-dark">
                            {getTimeRemaining(item.endDatetime)}
                          </span>
                        </div>
                        <span className="text-xs">
                          Closes {new Date(item.endDatetime).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {/* Progress bar showing time elapsed */}
                      <Progress 
                        value={
                          ((new Date().getTime() - new Date(item.startDatetime).getTime()) / 
                          (new Date(item.endDatetime).getTime() - new Date(item.startDatetime).getTime())) * 100
                        } 
                        className="h-1 bg-accent/20"
                      />
                    </div>
                  )}

                  {/* Submitted Indicator */}
                  {isSubmitted && (
                    <div className="mt-3 p-3 rounded-md bg-success-light border border-success/10">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Assessment Completed
                          </p>
                          <p className="text-xs">
                            Submitted on {formatDate(item.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upcoming Indicator */}
                  {!isAvailable && !isSubmitted && new Date() < new Date(item.startDatetime) && (
                    <div className="mt-3 p-3 rounded-md bg-info-light border border-info/10">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-info/20 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-info" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Opens in {Math.ceil((new Date(item.startDatetime).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                          </p>
                          <p className="text-xs">
                            {formatDate(item.startDatetime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Page;