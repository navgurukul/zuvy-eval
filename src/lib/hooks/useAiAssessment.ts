"use client";

import { useCallback, useEffect, useState } from "react";
import { apiLLM } from '@/utils/axios.config';
import { useToast } from "@/components/ui/use-toast";

export interface AiAssessment {
  id: number;
  title: string;
  description: string | null;
  bootcampId: number | null;
  audience: string | null;
  difficulty: string | null;
  topics: Record<string, number>; // Changed to match API response: { "Loops": 1, "Objects": 1 }
  totalNumberOfQuestions: number;
  totalQuestionsWithBuffer: number;
  startDatetime: string;
  endDatetime: string;
  createdAt: string;
  updatedAt: string;
}

interface UseAiAssessmentParams {
  bootcampId?: number | null;
}

interface UseAiAssessmentReturn {
  assessment: AiAssessment[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAiAssessment(params?: UseAiAssessmentParams): UseAiAssessmentReturn {
  const [assessment, setAssessment] = useState<AiAssessment[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const bootcampId = params?.bootcampId;
  const { toast } = useToast();

  const fetchAssessment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Build URL with optional bootcampId query parameter
      const url = bootcampId 
        ? `/ai-assessment?bootcampId=${encodeURIComponent(String(bootcampId))}`
        : '/ai-assessment';
      
      const res = await apiLLM.get(url);
      setAssessment(res.data);
    } catch (err: any) {
      console.error("Error fetching AI assessment:", err);
      const errorMessage = err?.response?.data?.message || "Failed to fetch AI assessment";
      setError(errorMessage);
      setAssessment(null);
      
      // Show toast notification for the error
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [bootcampId, toast]);

  useEffect(() => {
    fetchAssessment();
  }, [bootcampId, fetchAssessment]);

  return {
    assessment,
    loading,
    error,
    refetch: fetchAssessment,
  };
}
