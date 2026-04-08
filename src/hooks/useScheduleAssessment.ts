import { useCallback, useState } from 'react';
import { api } from '@/utils/axios.config';
import { toast } from '@/components/ui/use-toast';

interface SchedulePayload {
  startDatetime: string;
  endDatetime: string;
}

export const useScheduleAssessment = () => {
  const [isLoading, setIsLoading] = useState(false);

  const scheduleAssessment = useCallback(
    async (assessmentId: number, payload: SchedulePayload): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await api.post(`${process.env.NEXT_PUBLIC_EVAL_URL}/ai-assessment/${assessmentId}/schedule`, payload);
        return response.data;
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to schedule assessment';
        toast.error({
          title: 'Schedule Failed',
          description: errorMessage,
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { scheduleAssessment, isLoading };
};
