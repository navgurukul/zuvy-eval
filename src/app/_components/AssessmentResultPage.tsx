'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Target,
  Brain,
  BookOpen,
  ArrowLeft,
  Download,
  Volume2,
  VolumeX,
  Pause,
  Play,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { useAssessmentEvaluation } from '@/lib/hooks/useAssessmentEvaluation';
import { getUser } from '@/store/store';

export default function AssessmentResultsPage({assessmentId}: {assessmentId: string}) {
  const router = useRouter();
  const { user } = getUser();

  const { evaluations, loading, error } = useAssessmentEvaluation({ 
    userId: parseInt(user.id),
    assessmentId: +assessmentId
  });

  // Text-to-Speech using custom hook
  const { speak, pause, resume, cancel, speaking, paused, supported, progress } = useSpeechSynthesis({
    rate: 0.8,
    onError: (error) => {
      // Only show error for non-interruption errors
      if (error.error !== 'interrupted' && error.error !== 'canceled') {
        alert('Failed to play speech. Please try again.');
      }
    },
  });

  // Calculate statistics from evaluation data
  const stats = useMemo(() => {
    if (!evaluations || evaluations.length === 0) {
      return {
        totalQuestions: 0,
        correctAnswers: 0,
        score: 0,
        passed: false,
        topicPerformance: [],
      };
    }

    // Determine if answer is correct by comparing selectedAnswerByStudent with correctOptionId
    const correctAnswers = evaluations.filter(item => 
      item.questionEvaluation.selectedAnswerByStudent === item.correctOptionId
    ).length;
    
    const totalQuestions = evaluations.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passingScore = 60;

    // Group by topic
    const topicMap = new Map<string, { correct: number; total: number }>();
    evaluations.forEach(item => {
      const q = item.questionEvaluation;
      const isCorrect = q.selectedAnswerByStudent === item.correctOptionId;
      const existing = topicMap.get(q.topic) || { correct: 0, total: 0 };
      topicMap.set(q.topic, {
        correct: existing.correct + (isCorrect ? 1 : 0),
        total: existing.total + 1,
      });
    });

    const topicPerformance = Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      correct: data.correct,
      total: data.total,
      accuracy: Math.round((data.correct / data.total) * 100),
    }));

    return {
      totalQuestions,
      correctAnswers,
      score,
      passed: score >= passingScore,
      passingScore,
      topicPerformance,
      summary: evaluations[0]?.questionEvaluation.summary || '',
      recommendations: evaluations[0]?.questionEvaluation.recommendations || '',
      language: evaluations[0]?.questionEvaluation.language || 'Programming',
    };
  }, [evaluations]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-green-500',
      intermediate: 'bg-blue-500',
      advanced: 'bg-purple-500',
    };
    return (
      <Badge className={colors[difficulty] || 'bg-gray-500'}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleListenToReport = () => {
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
    let textToSpeak = '';

    // Add performance summary
    if (stats.summary) {
      textToSpeak += 'Performance Summary. ' + stats.summary + '. ';
    }

    // Add recommendations
    if (stats.recommendations) {
      textToSpeak += 'Recommendations. ' + stats.recommendations + '.';
    }

    if (!textToSpeak.trim()) {
      alert('No summary or recommendations available to read.');
      return;
    }

    // Clean up special characters and formatting symbols
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
        const commonKeywords = ['for', 'if', 'else', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'function', 'class', 'const', 'let', 'var', 'new', 'this', 'super', 'try', 'catch', 'throw', 'async', 'await', 'import', 'export', 'from', 'default', 'true', 'false', 'null', 'undefined', 'in', 'of'];
        
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
      .replace(/[*_~`#]/g, '') // Remove markdown symbols
      .replace(/[\[\](){}]/g, ' ') // Remove brackets and parentheses
      .replace(/[•◦▪]/g, '') // Remove bullet points
      .replace(/\n+/g, '. ') // Replace newlines with periods
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .replace(/\.{2,}/g, '.') // Replace multiple periods with single period
      .trim();

    // Start speaking
    speak(textToSpeak);
  };

  const handleStopSpeech = () => {
    cancel();
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Zuvy Color Theme (converted from HSL to RGB) - typed as tuples for jsPDF
    const colors = {
      primary: [46, 89, 52] as [number, number, number], // hsl(122 36% 27%) - Deep forest green
      primaryLight: [231, 241, 232] as [number, number, number], // hsl(130 38% 94%)
      secondary: [8, 243, 136] as [number, number, number], // hsl(146 88% 50%) - Bright green
      success: [99, 184, 91] as [number, number, number], // hsl(88 45% 48%)
      successLight: [238, 247, 237] as [number, number, number], // hsl(88 45% 94%)
      destructive: [207, 48, 62] as [number, number, number], // hsl(0 63% 51%)
      destructiveLight: [255, 245, 245] as [number, number, number], // hsl(0 100% 96%)
      warning: [245, 158, 11] as [number, number, number], // hsl(38 92% 50%)
      muted: [138, 138, 138] as [number, number, number], // hsl(0 0% 54%)
      mutedLight: [237, 235, 229] as [number, number, number], // hsl(48 23% 90%)
      foreground: [43, 43, 43] as [number, number, number], // hsl(0 0% 17%)
      background: [247, 245, 239] as [number, number, number], // hsl(48 30% 95%)
      border: [237, 235, 229] as [number, number, number], // hsl(48 23% 90%)
    };

    // Header with primary color
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Add Zuvy logo
    try {
      const logo = new Image();
      logo.src = '/zuvy-logo-horizontal-dark.png';
      // Add logo on the left side of header, aligned with text
      doc.addImage(logo, 'PNG', 15, 15, 30, 15);
    } catch (error) {
      console.warn('Could not load logo:', error);
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Assessment Evaluation Report', pageWidth / 2 + 10, 25, { align: 'center' });

    yPosition = 50;

    // Student Info
    doc.setTextColor(...colors.foreground);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student: ${user.name}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Email: ${user.email}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Assessment: ${stats.language}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Date: ${formatDate(evaluations[0]?.questionEvaluation.createdAt || new Date().toISOString())}`, 20, yPosition);
    yPosition += 15;

    // Score Summary Box
    const boxX = 20;
    const boxWidth = pageWidth - 40;
    const boxHeight = 50;
    
    // Box background based on pass/fail - using Zuvy theme colors
    if (stats.passed) {
      doc.setFillColor(...colors.successLight);
      doc.setDrawColor(...colors.success);
    } else {
      doc.setFillColor(...colors.destructiveLight);
      doc.setDrawColor(...colors.destructive);
    }
    doc.setLineWidth(2);
    doc.roundedRect(boxX, yPosition, boxWidth, boxHeight, 3, 3, 'FD');

    // Score text
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.foreground);
    doc.text(stats.passed ? 'PASSED' : 'NOT PASSED', boxX + 10, yPosition + 15);
    
    doc.setFontSize(36);
    if (stats.passed) {
      doc.setTextColor(...colors.success);
    } else {
      doc.setTextColor(...colors.destructive);
    }
    doc.text(`${stats.score}%`, pageWidth - 60, yPosition + 35);

    doc.setFontSize(11);
    doc.setTextColor(...colors.foreground);
    doc.text(`${stats.correctAnswers} / ${stats.totalQuestions} correct`, boxX + 10, yPosition + 30);
    doc.text(`Passing Score: ${stats.passingScore}%`, boxX + 10, yPosition + 40);

    yPosition += boxHeight + 15;

    // Summary Section
    if (stats.summary) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.foreground);
      doc.text('Performance Summary', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.muted);
      const summaryLines = doc.splitTextToSize(stats.summary, pageWidth - 40);
      doc.text(summaryLines, 20, yPosition);
      yPosition += summaryLines.length * 5 + 10;
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }

    // Topic Performance Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.foreground);
    doc.text('Topic Performance', 20, yPosition);
    yPosition += 10;

    const topicData = stats.topicPerformance.map(topic => [
      topic.topic,
      `${topic.correct}/${topic.total}`,
      `${topic.accuracy}%`,
      topic.accuracy >= 80 ? 'Excellent' : topic.accuracy >= 60 ? 'Good' : 'Needs Improvement'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Topic', 'Correct/Total', 'Accuracy', 'Status']],
      body: topicData,
      theme: 'grid',
      headStyles: { 
        fillColor: colors.primary, 
        fontSize: 10, 
        fontStyle: 'bold',
        textColor: [255, 255, 255]
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 5,
        textColor: colors.foreground
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 45, halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: colors.background
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Recommendations Section
    if (stats.recommendations) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.foreground);
      doc.text('Recommendations', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.muted);
      const recommendationLines = doc.splitTextToSize(stats.recommendations, pageWidth - 40);
      doc.text(recommendationLines, 20, yPosition);
      yPosition += recommendationLines.length * 5 + 15;
    }

    // Question Review Section
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.foreground);
    doc.text('Detailed Question Review', 20, yPosition);
    yPosition += 10;

    evaluations.forEach((item, index) => {
      const q = item.questionEvaluation;
      const isCorrect = q.selectedAnswerByStudent === item.correctOptionId;
      
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      // Question header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.foreground);
      doc.text(`Question ${index + 1}`, 20, yPosition);
      
      // Status badge with Zuvy colors
      const badgeX = 60;
      const badgeWidth = 20;
      const badgeHeight = 6;
      
      if (isCorrect) {
        doc.setFillColor(...colors.success);
      } else {
        doc.setFillColor(...colors.destructive);
      }
      doc.roundedRect(badgeX, yPosition - 4, badgeWidth, badgeHeight, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(isCorrect ? 'CORRECT' : 'INCORRECT', badgeX + badgeWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 8;

      // Question text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.foreground);
      const questionLines = doc.splitTextToSize(q.question, pageWidth - 40);
      doc.text(questionLines, 20, yPosition);
      yPosition += questionLines.length * 5 + 5;

      // Topic and Difficulty
      doc.setFontSize(9);
      doc.setTextColor(...colors.muted);
      doc.text(`Topic: ${q.topic} | Difficulty: ${q.difficulty}`, 20, yPosition);
      yPosition += 8;

      // Options
      q.options.forEach((option) => {
        const isThisCorrect = option.id === item.correctOptionId;
        const isSelected = option.id === q.selectedAnswerByStudent;
        const isWrongAnswer = isSelected && !isCorrect;
        
        doc.setFontSize(9);
        if (isThisCorrect) {
          doc.setTextColor(...colors.success);
          doc.setFont('helvetica', 'bold');
        } else if (isWrongAnswer) {
          doc.setTextColor(...colors.destructive);
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setTextColor(...colors.foreground);
          doc.setFont('helvetica', 'normal');
        }
        
        const optionText = `${option.optionNumber}. ${option.optionText}${isSelected ? ' (Your Answer)' : ''}${isThisCorrect ? ' ✓' : ''}`;
        const optionLines = doc.splitTextToSize(optionText, pageWidth - 50);
        doc.text(optionLines, 25, yPosition);
        yPosition += optionLines.length * 4 + 2;
      });

      // Explanation for incorrect answers with muted background
      if (q.explanation) {
        yPosition += 3;
        doc.setFillColor(...colors.mutedLight);
        doc.setDrawColor(...colors.border);
        const explanationBox = doc.splitTextToSize(q.explanation, pageWidth - 50);
        const boxHeight = explanationBox.length * 5 + 10;
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPosition, pageWidth - 40, boxHeight, 2, 2, 'FD');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        // doc.setTextColor(...colors.muted);
        doc.setTextColor(0, 0, 0); // Set to black

        doc.text('Explanation:', 25, yPosition + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(explanationBox, 25, yPosition + 11);
        yPosition += boxHeight + 5;
      }

      yPosition += 10; // Space between questions
    });

    // Footer on all pages with muted color
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...colors.muted);
      doc.text(
        `Page ${i} of ${totalPages} | Generated on ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `Assessment_Report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        <Card className="p-8 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-h5 font-semibold mb-2">Error Loading Results</h2>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="w-full px-6 py-8 max-w-7xl mx-auto">
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-h5 font-semibold mb-2">No Results Found</h2>
          <p className="text-muted-foreground">No assessment results available.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/student')}
          className="mb-3 sm:mb-4 gap-2 h-8 sm:h-9"
          size="sm"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">Back to Dashboard</span>
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="font-heading text-lg sm:text-xl md:text-2xl lg:text-h5 text-foreground mb-2">
              Assessment Results
            </h1>
            <p className="text-xs sm:text-sm md:text-body2 text-muted-foreground">
              {stats.language} Assessment
            </p>
            <p className="text-xs sm:text-sm md:text-body2 text-muted-foreground">
              Completed on {formatDate(evaluations[0].questionEvaluation.createdAt)}
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              {supported && (stats.summary || stats.recommendations) && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleListenToReport} 
                    className="gap-2 h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                    disabled={!stats.summary && !stats.recommendations}
                    size="sm"
                  >
                    {speaking ? (
                      paused ? (
                        <>
                          <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Resume</span>
                        </>
                      ) : (
                        <>
                          <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Pause</span>
                        </>
                      )
                    ) : (
                      <>
                        <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className='hidden sm:inline'>Listen To Report</span>
                        <span className='sm:hidden'>Listen</span>
                      </>
                    )}
                  </Button>
                  {speaking && (
                    <Button 
                      variant="outline" 
                      onClick={handleStopSpeech} 
                      className="gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                      size="sm"
                    >
                      Stop
                    </Button>
                  )}
                </div>
              )}
              <Button variant="outline" onClick={handleDownloadReport} className="gap-2 h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none" size="sm">
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className='hidden sm:inline'>Download Report</span>
                <span className='sm:hidden'>Download</span>
              </Button>
            </div>
            {speaking && (
              <div className="w-full">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Volume2 className="h-3 w-3" />
                  <span>Playing audio... {Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score Card */}
      <Card
        className={cn(
          'p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 border-l-4',
          stats.passed ? 'border-l-success bg-success/5' : 'border-l-destructive bg-destructive/5'
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={cn(
                'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0',
                stats.passed
                  ? 'bg-success text-success-foreground'
                  : 'bg-destructive text-destructive-foreground'
              )}
            >
              {stats.passed ? (
                <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
              ) : (
                <XCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
              )}
            </div>
            <div>
              <h2 className="font-heading text-base sm:text-lg md:text-xl lg:text-h5 font-semibold mb-1">
                {stats.passed ? 'Congratulations! You Passed' : 'Not Passed'}
              </h2>
              <p className="text-xs sm:text-sm md:text-body1 text-muted-foreground">
                {stats.passed
                  ? 'Great job! Keep up the excellent work.'
                  : `You need ${stats.passingScore}% to pass. Review and try again.`}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className={cn('text-4xl sm:text-5xl md:text-6xl font-bold', getScoreColor(stats.score))}>
              {stats.score}%
            </p>
            <p className="text-xs sm:text-sm md:text-body2 text-muted-foreground mt-1">
              {stats.correctAnswers} / {stats.totalQuestions} correct
            </p>
          </div>
        </div>

        <Progress value={stats.score} className="h-2 sm:h-3 mb-4" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Passing Score</p>
              <p className="text-sm sm:text-body2 font-semibold">{stats.passingScore}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Language</p>
              <p className="text-sm sm:text-body2 font-semibold">{stats.language}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Topics Covered</p>
              <p className="text-sm sm:text-body2 font-semibold">{stats.topicPerformance.length}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full ">
        <TabsList className="mb-6 text-black ">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Topic Analysis</TabsTrigger>
          <TabsTrigger value="review">Question Review</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <Card className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-lg bg-success/10 text-success flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm md:text-body2 text-muted-foreground">Correct</p>
                  <p className="text-lg sm:text-xl md:text-h5 font-semibold">{stats.correctAnswers}</p>
                </div>
              </div>
              <Progress
                value={(stats.correctAnswers / stats.totalQuestions) * 100}
                className="h-1.5 sm:h-2"
              />
            </Card>

            <Card className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-lg bg-destructive/10 text-destructive flex-shrink-0">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm md:text-body2 text-muted-foreground">Incorrect</p>
                  <p className="text-lg sm:text-xl md:text-h5 font-semibold">
                    {stats.totalQuestions - stats.correctAnswers}
                  </p>
                </div>
              </div>
              <Progress
                value={
                  ((stats.totalQuestions - stats.correctAnswers) /
                    stats.totalQuestions) *
                  100
                }
                className="h-1.5 sm:h-2"
              />
            </Card>

            <Card className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm md:text-body2 text-muted-foreground">Topics Covered</p>
                  <p className="text-lg sm:text-xl md:text-h5 font-semibold">{stats.topicPerformance.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Summary */}
          {stats.summary && (
            <Card className="p-4 sm:p-5 md:p-6 mt-4 sm:mt-5 md:mt-6">
              <h3 className="font-heading text-sm sm:text-base md:text-body1 font-semibold mb-3 sm:mb-4">
                Performance Summary
              </h3>
              <p className="text-xs sm:text-sm md:text-body2 text-muted-foreground leading-relaxed">
                {stats.summary}
              </p>
            </Card>
          )}

          {/* Recommendations */}
          {stats.recommendations && (
            <Card className="p-4 sm:p-5 md:p-6 mt-4 sm:mt-5 md:mt-6">
              <h3 className="font-heading text-sm sm:text-base md:text-body1 font-semibold mb-3 sm:mb-4">
                Recommendations
              </h3>
              <p className="text-xs sm:text-sm md:text-body2 text-muted-foreground leading-relaxed">
                {stats.recommendations}
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Topic Analysis */}
        <TabsContent value="topics">
          <div className="space-y-3 sm:space-y-4">
            {stats.topicPerformance.map((topic) => (
              <Card key={topic.topic} className="p-4 sm:p-5 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                  <h3 className="font-heading text-sm sm:text-base md:text-body1 font-semibold">{topic.topic}</h3>
                  <Badge
                    className={cn(
                      'w-fit text-xs',
                      topic.accuracy >= 80
                        ? 'bg-success'
                        : topic.accuracy >= 60
                        ? 'bg-warning'
                        : 'bg-destructive'
                    )}
                  >
                    {topic.accuracy}% accuracy
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">
                      {topic.correct} / {topic.total} correct
                    </span>
                    <span className="font-semibold">{topic.accuracy}%</span>
                  </div>
                  <Progress value={topic.accuracy} className="h-1.5 sm:h-2" />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Question Review */}
        <TabsContent value="review">
          <Accordion type="single" collapsible className="w-full">
            {evaluations.map((item, index) => {
              const q = item.questionEvaluation;
              const isCorrect = q.selectedAnswerByStudent === item.correctOptionId;
              
              return(
                <AccordionItem key={q.id} value={`question-${q.id}`}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 text-left">
                      <div
                        className={cn(
                          'flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center',
                          isCorrect
                            ? 'bg-success text-success-foreground'
                            : 'bg-destructive text-destructive-foreground'
                        )}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm md:text-body2">
                          Question {index + 1}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                          {q.question}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">{q.topic}</Badge>
                        {getDifficultyBadge(q.difficulty)}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                      <div>
                        <p className="text-sm sm:text-base md:text-body1 font-medium mb-2 whitespace-pre-wrap">{q.question}</p>
                        <div className="flex sm:hidden items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{q.topic}</Badge>
                          {getDifficultyBadge(q.difficulty)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {q.options.map((option) => {
                          const isSelected = option.id === q.selectedAnswerByStudent;
                          const isThisCorrect = option.id === item.correctOptionId;
                          const isThisWrong = isSelected && !isCorrect;
                          
                          return (
                            <div
                              key={option.id}
                              className={cn(
                                'p-2 sm:p-3 rounded-lg border-2',
                                isThisCorrect
                                  ? 'border-success bg-success/10'
                                  : isThisWrong
                                  ? 'border-destructive bg-destructive/10'
                                  : 'border-border bg-muted/30'
                              )}
                            >
                              <div className="flex items-start gap-2 flex-wrap">
                                <span className="font-medium text-xs sm:text-sm">{option.optionNumber}.</span>
                                <span className="flex-1 text-xs sm:text-sm min-w-0">{option.optionText}</span>
                                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                  {isSelected && (
                                    <Badge variant="secondary" className="text-[10px] sm:text-xs">Your Answer</Badge>
                                  )}
                                  {isThisCorrect && (
                                    <Badge className="bg-success text-[10px] sm:text-xs">Correct</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      { q.explanation && (
                        <div className={`p-3 sm:p-4 rounded-lg ${isCorrect ? 'bg-primary-light' : 'bg-destructive/60'}`}>
                          <p className="text-xs sm:text-sm font-medium mb-2">Explanation:</p>
                          <p className="text-xs sm:text-sm">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
            )})}
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}
