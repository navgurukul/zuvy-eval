'use client'

import { useState, useEffect } from 'react'
import { apiLLM } from '@/utils/axios.config'

export interface QuestionOption {
  id: number
  optionText: string
  questionId: number
  optionNumber: number
}

export interface EvaluationQuestion {
  id: number
  aiAssessmentId: number
  questionId: number
  question: string
  topic: string
  difficulty: string
  options: QuestionOption[]
  selectedAnswerByStudent: number // Option ID selected by student
  language: string
  status: string | null
  explanation: string
  summary: string
  recommendations: string
  studentId: number
  createdAt: string
  updatedAt: string
}

export interface AssessmentEvaluationItem {
  questionEvaluation: EvaluationQuestion
  correctOptionId: number // The correct answer's option ID
}

export type AssessmentEvaluationApiResponse = AssessmentEvaluationItem[]

interface UseAssessmentEvaluationParams {
  userId: number | null
  enabled?: boolean // Option to control when to fetch
  assessmentId: number
}

interface UseAssessmentEvaluationReturn {
  evaluations: AssessmentEvaluationItem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  totalEvaluations: number
}

export function useAssessmentEvaluation({ 
  userId, 
  assessmentId,
  enabled = true 
}: UseAssessmentEvaluationParams): UseAssessmentEvaluationReturn {
  const [evaluations, setEvaluations] = useState<AssessmentEvaluationItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvaluations = async () => {
    if (!userId) {
      setError('User ID is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiLLM.get<AssessmentEvaluationApiResponse>(
        `/questions-by-llm/evaluation/${userId}/${assessmentId}`
      )

      setEvaluations(response.data)
    } catch (err: any) {
      console.error('Error fetching assessment evaluation:', err)
      setError(err?.response?.data?.message || 'Failed to fetch assessment evaluation')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (enabled && userId) {
      fetchEvaluations()
    }
  }, [userId, enabled])

  return {
    evaluations,
    loading,
    error,
    refetch: fetchEvaluations,
    totalEvaluations: evaluations.length,
  }
}
