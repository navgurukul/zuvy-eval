'use client'

import { useState, useEffect } from 'react'
import { apiLLM } from '@/utils/axios.config'

export interface StudentAssessment {
  id: number
  bootcampId: number
  title: string
  description: string
  topics: Record<string, number>
  audience: string | null
  totalNumberOfQuestions: number
  totalQuestionsWithBuffer: number
  startDatetime: string
  endDatetime: string
  createdAt: string
  updatedAt: string
  status: number // 0 = not started, 1 = in progress, 2 = completed
}

export type StudentAssessmentApiResponse = StudentAssessment[]

interface UseStudentAssessmentsByBootcampParams {
  studentId: number | null
  bootcampId: number | null
  enabled?: boolean
}

interface UseStudentAssessmentsByBootcampReturn {
  assessments: StudentAssessment[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  totalAssessments: number
}

export function useStudentAssessmentsByBootcamp({ 
  studentId,
  bootcampId,
  enabled = true 
}: UseStudentAssessmentsByBootcampParams): UseStudentAssessmentsByBootcampReturn {
  const [assessments, setAssessments] = useState<StudentAssessment[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssessments = async () => {
    if (!studentId || !bootcampId) {
      setError('Student ID and Bootcamp ID are required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiLLM.get<StudentAssessmentApiResponse>(
        `/ai-assessment/by/studentId?bootcampId=${bootcampId}`
      )

      setAssessments(response.data)
    } catch (err: any) {
      console.error('Error fetching student assessments:', err)
      setError(err?.response?.data?.message || 'Failed to fetch assessments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (enabled && studentId && bootcampId) {
      fetchAssessments()
    }
  }, [studentId, bootcampId, enabled])

  return {
    assessments,
    loading,
    error,
    refetch: fetchAssessments,
    totalAssessments: assessments.length,
  }
}
