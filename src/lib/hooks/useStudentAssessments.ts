'use client'

import { useState, useEffect } from 'react'
import { apiLLM } from '@/utils/axios.config'

export interface StudentAssessment {
  id: number
  bootcampId: number
  title: string
  description: string | null
  difficulty: string | null
  topics: Record<string, number>
  audience: string | null
  totalNumberOfQuestions: number
  createdAt: string
  updatedAt: string
}

interface UseStudentAssessmentsReturn {
  assessments: StudentAssessment[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useStudentAssessments(): UseStudentAssessmentsReturn {
  const [assessments, setAssessments] = useState<StudentAssessment[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssessments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiLLM.get<StudentAssessment[]>('/ai-assessment/by/studentId')

      setAssessments(response.data)
    } catch (err: any) {
      console.error('Error fetching student assessments:', err)
      setError(err?.response?.data?.message || 'Failed to fetch student assessments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssessments()
  }, [])

  return {
    assessments,
    loading,
    error,
    refetch: fetchAssessments,
  }
}
