'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Clock, CheckCircle2, AlertCircle, TrendingUp, BarChart3, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudent } from '@/lib/hooks/useStudent';
import Image from 'next/image';

export default function StudentDashboard() {
  const router = useRouter();
  const {
    completedBootcamps,
    inProgressBootcamps,
    totalCompleted,
    totalInProgress,
    loading,
    error,
    refetch
  } = useStudent();

  // Calculate total unique topics across all in-progress bootcamps
  const uniqueTopics = new Set(
    inProgressBootcamps.map((bootcamp) => bootcamp.bootcampTopic).filter(Boolean)
  );

  // Calculate total duration
  const totalDuration = inProgressBootcamps.reduce(
    (sum, bootcamp) => sum + (bootcamp.duration || 0),
    0
  );

  const handleStartBootcamp = (bootcampId: number) => {
    // Navigate to bootcamp details or learning page
    router.push(`/student/bootcamp/${bootcampId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };


  return (
    <div className="w-full px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-h5 text-foreground mb-2">
          My Bootcamps
        </h1>
        <p className="text-sm sm:text-body2 text-muted-foreground">
          Track your progress and continue learning
        </p>
      </div>

      {/* Quick Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-body2 text-muted-foreground">In Progress</p>
              <p className="text-h5 font-semibold">{totalInProgress}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-success">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-body2 text-muted-foreground">Completed</p>
              <p className="text-h5 font-semibold">{totalCompleted}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="text-body2 text-muted-foreground">Total Duration</p>
              <p className="text-h5 font-semibold">{totalDuration} weeks</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-body2 text-muted-foreground">Topics Covered</p>
              <p className="text-h5 font-semibold">{uniqueTopics.size}</p>
            </div>
          </div>
        </Card>
      </div> */}

      {/* Tabs */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="font-heading text-body1 font-semibold mb-2">
              Loading bootcamps...
            </h3>
            <p className="text-body2 text-muted-foreground">
              Please wait a moment.
            </p>
          </Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="font-heading text-body1 font-semibold mb-2">
              Error Loading Bootcamps
            </h3>
            <p className="text-body2 text-muted-foreground mb-4">
              {error}
            </p>
            <Button onClick={refetch}>Try Again</Button>
          </Card>
        ) : inProgressBootcamps.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-body1 font-semibold mb-2">
              No bootcamps in progress
            </h3>
            <p className="text-body2 text-muted-foreground">
              You haven't started any bootcamps yet.
            </p>
          </Card>
        ) : (
          inProgressBootcamps.map((bootcamp) => (
            <div
              key={bootcamp.id}
              className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-card via-card-elevated to-card-light border border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]"
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Status Indicator Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-dark to-success" />

              <div className="relative p-3 sm:p-4">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start gap-3 mb-3">
                  {/* Cover Image */}
                  <div className="w-full sm:w-20 h-32 sm:h-20 rounded-md overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-success/10 border border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                    {bootcamp.coverImage ? (
                      <img
                        src={bootcamp.coverImage}
                        alt={bootcamp.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <Image
                          src="/zuvy-logo-horizontal.png"
                          alt="Zuvy"
                          width={60}
                          height={60}
                          className="h-auto w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                          priority
                        />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 w-full space-y-2">
                    {/* Title and Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-heading text-base sm:text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
                          {bootcamp.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {bootcamp.description}
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <div className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-primary/20 text-primary border border-primary/30 w-fit">
                          In Progress
                        </div>
                      </div>
                    </div>

                    {/* Topic Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      <div className="px-2 py-0.5 rounded-full bg-primary-light border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all duration-200 cursor-default">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3 text-primary" />
                          <span className="text-xs font-medium text-primary-dark">
                            {bootcamp.language}
                          </span>
                        </div>
                      </div>
                      
                      {bootcamp.bootcampTopic && (
                        <div className="px-2 py-0.5 rounded-full bg-success-light border border-success/20 hover:bg-success/20 hover:border-success/40 transition-all duration-200 cursor-default">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3 text-success" />
                            <span className="text-xs font-medium text-success-dark">
                              {bootcamp.bootcampTopic}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* {bootcamp.duration && (
                        <div className="px-2 py-0.5 rounded-full bg-info-light border border-info/20 hover:bg-info/20 hover:border-info/40 transition-all duration-200 cursor-default">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-info" />
                            <span className="text-xs font-medium text-info-dark">
                              {bootcamp.duration} weeks
                            </span>
                          </div>
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-md bg-primary-light/30 backdrop-blur-sm border border-primary/10 mb-3">
                  {/* Progress */}
                  {/* <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Progress</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-primary-dark">
                      {bootcamp.progress}%
                    </p>
                    <Progress value={bootcamp.progress} className="h-1 bg-primary/20" />
                  </div> */}

                  {/* Batch */}
                  {/* <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-info" />
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Batch</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {bootcamp.batchName}
                    </p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div> */}

                  {/* Instructor */}
                  {/* <div className="space-y-0.5 col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-success" />
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Instructor</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {bootcamp.instructorDetails.profilePicture ? (
                          <img
                            src={bootcamp.instructorDetails.profilePicture}
                            alt={bootcamp.instructorDetails.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="h-2.5 w-2.5 text-success" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {bootcamp.instructorDetails.name}
                      </p>
                    </div>
                  </div> */}
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleStartBootcamp(bootcamp.id)}
                  size="sm"
                  className="w-full sm:w-auto h-9 text-sm font-semibold bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 group/btn"
                >
                  <span>Continue Learning</span>
                  <Play className="h-3.5 w-3.5 ml-2 group-hover/btn:scale-110 transition-transform" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
