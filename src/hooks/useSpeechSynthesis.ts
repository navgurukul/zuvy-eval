import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent) => void;
}

export const useSpeechSynthesis = (options: UseSpeechSynthesisOptions = {}) => {
  const {
    lang = 'en-IN',
    rate = 0.9,
    pitch = 1,
    volume = 1,
    onEnd,
    onError,
  } = options;

  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
      
      // Load voices (some browsers need this)
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported) {
        console.warn('Speech synthesis not supported');
        return;
      }

      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Try to find and use an Indian English voice
      const voices = synth.getVoices();
      
      // Priority order: en-IN voices first
      const indianVoice = voices.find((voice) => voice.lang === 'en-IN') ||
        voices.find((voice) => voice.lang.startsWith('hi-IN')) ||
        voices.find((voice) => voice.name.toLowerCase().includes('india')) ||
        voices.find((voice) => voice.name.toLowerCase().includes('indian')) ||
        voices.find((voice) => voice.name.toLowerCase().includes('ravi')) ||
        voices.find((voice) => voice.name.toLowerCase().includes('heera')) ||
        voices.find((voice) => voice.name.toLowerCase().includes('nandini')) ||
        voices.find((voice) => voice.name.toLowerCase().includes('swara'));

      if (indianVoice) {
        utterance.voice = indianVoice;
        utterance.lang = 'en-IN';
        console.log('Using Indian voice:', indianVoice.name, indianVoice.lang);
      } else {
        // If no Indian voice found, still set the language to en-IN
        utterance.lang = 'en-IN';
        console.warn('No Indian English voice found, using default with en-IN language code');
      }

      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
        setProgress(0);
        
        // Start progress tracking
        const startTime = Date.now();
        // Estimate speech duration (rough estimate: 150 words per minute)
        const wordCount = text.split(/\s+/).length;
        const estimatedDuration = (wordCount / 150) * 60 * 1000; // in milliseconds
        
        progressIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progressPercent = Math.min((elapsed / estimatedDuration) * 100, 100);
          setProgress(progressPercent);
        }, 100);
      };

      utterance.onend = () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        setSpeaking(false);
        setPaused(false);
        setProgress(100);
        setTimeout(() => setProgress(0), 500);
        onEnd?.();
      };

      utterance.onerror = (event) => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        // Silently handle common errors (like interruption)
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          console.warn('Speech synthesis error:', event.error);
          onError?.(event);
        }
        setSpeaking(false);
        setPaused(false);
        setProgress(0);
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);
    },
    [supported, lang, rate, pitch, volume, onEnd, onError]
  );

  const pause = useCallback(() => {
    if (window.speechSynthesis && speaking && !paused) {
      window.speechSynthesis.pause();
      setPaused(true);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, [speaking, paused]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && speaking && paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      // Continue progress from current position
      const currentProgress = progress;
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const additionalProgress = (elapsed / 1000) * 2; // Rough estimate
        setProgress(Math.min(currentProgress + additionalProgress, 100));
      }, 100);
    }
  }, [speaking, paused, progress]);

  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setPaused(false);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, []);

  return {
    speak,
    pause,
    resume,
    cancel,
    speaking,
    paused,
    supported,
    progress,
  };
};
