'use client'

import { useState, useEffect } from 'react'
import { apiLLM } from '@/utils/axios.config'

export interface QuestionOption {
  id: number
  questionId: number
  optionText: string
  optionNumber: number
}

export interface CorrectOption {
  id: number
  questionId: number
  optionText: string
  optionNumber: number
}

export interface QuestionByLLM {
  id: number
  topic: string
  difficulty: string
  aiAssessmentId: number
  question: string
  language: string
  createdAt: string
  updatedAt: string
  options: QuestionOption[]
  correctOption: CorrectOption
}

export interface QuestionsByLLMApiResponse {
  questions: QuestionByLLM[]
  isCompleted: boolean
}
interface UseQuestionsByLLMReturn {
  questions: QuestionByLLM[]
  isCompleted: boolean
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  totalQuestions: number
}

export function useQuestionsByLLM({sessionId}: {sessionId: string}): UseQuestionsByLLMReturn {
  const [questions, setQuestions] = useState<QuestionByLLM[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiLLM.get<QuestionsByLLMApiResponse>(`/questions-by-llm?aiAssessmentId=${sessionId}`)

      setQuestions(response.data?.questions)
      setIsCompleted(response.data?.isCompleted)
    } catch (err: any) {
      console.error('Error fetching questions by LLM:', err)
      setError(err?.response?.data?.message || 'Failed to fetch questions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  return {
    questions,
    isCompleted,
    loading,
    error,
    refetch: fetchQuestions,
    totalQuestions: questions.length,
  }
}
