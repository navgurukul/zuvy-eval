import { useCallback, useState } from 'react';
import { api } from '@/utils/axios.config';
import { toast } from '@/components/ui/use-toast';

export const useDraftAssessment = () => {
  const [isLoading, setIsLoading] = useState(false);

  const draftAssessment = useCallback(async (assessmentId: number): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.post(`${process.env.NEXT_PUBLIC_EVAL_URL}/ai-assessment/${assessmentId}/draft`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to save assessment as draft';
      toast.error({
        title: 'Draft Save Failed',
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { draftAssessment, isLoading };
};
