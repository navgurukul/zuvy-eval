'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

import { toast } from '@/components/ui/use-toast'
import { getSocketConnectionStore, getUser } from '@/store/store'
import MiniSparkle from './isGeneratingCard'

const API_URL = process.env.NEXT_PUBLIC_EVAL_URL

const GENERATION_STATUS_LINES = [
    'Analyzing topic coverage and intent',
    'Designing question structure by difficulty',
    'Generating clear and exam-ready MCQs',
    'Validating options and answer quality',
    'Finalizing question set for delivery',
]

export default function RootSocketConnection() {
    const socketRef = useRef<Socket | null>(null)
    const hasWarnedMissingUrlRef = useRef(false)
    const generatedQuestionsCountRef = useRef(0)
    const hasShownCompletionToastRef = useRef(false)
    const [isSocketDisabled, setIsSocketDisabled] = useState(false)
    const [retryKey, setRetryKey] = useState(0)
    const [statusLineIndex, setStatusLineIndex] = useState(0)
    const { user } = getUser()
    const {
        isGeneratingQuestions,
        generationProgress,
        totalJobs,
        completedJobs,
        setIsConnected,
        setLastQuestionsReadyEvent,
        setGenerationProgress,
        incrementCompletedJobs,
        stopGeneratingQuestions,
    } = getSocketConnectionStore()

    useEffect(() => {
        const accessToken = localStorage.getItem('access_token')

        if (!API_URL) {
            if (!hasWarnedMissingUrlRef.current) {
                console.error(
                    'Missing NEXT_PUBLIC_EVAL_URL; socket connection disabled.'
                )
                hasWarnedMissingUrlRef.current = true
            }
            setIsConnected(false)
            stopGeneratingQuestions()
            setIsSocketDisabled(true)
            return
        }

        setIsSocketDisabled(false)

        if (!accessToken || !user?.id) {
            setIsConnected(false)
            stopGeneratingQuestions()

            // Retry bootstrap while auth/user state is hydrating.
            if (accessToken || user?.id) {
                const retryTimer = window.setTimeout(() => {
                    setRetryKey((value) => value + 1)
                }, 1200)

                return () => {
                    window.clearTimeout(retryTimer)
                }
            }

            return
        }

        if (socketRef.current) {
            socketRef.current.disconnect()
            socketRef.current = null
        }

        const socket = io(API_URL, {
            auth: { token: accessToken },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
            withCredentials: true,
        })

        socketRef.current = socket

        const handleConnect = () => {
            console.log('WebSocket connected with ID:', socket.id)
            setIsConnected(true)
        }

        const handleDisconnect = (reason: string) => {
            console.warn('WebSocket disconnected:', reason)
            setIsConnected(false)
        }

        const handleQuestionsReady = (data: {
            count: number
            questionIds: number[]
        }) => {
            setLastQuestionsReadyEvent({
                count: data.count,
                questionIds: data.questionIds,
                receivedAt: Date.now(),
            })
            generatedQuestionsCountRef.current += data.count
            incrementCompletedJobs()

            const state = getSocketConnectionStore.getState()
            const safeTotalJobs = Math.max(1, state.totalJobs)
            const committedProgress = Math.floor(
                (state.completedJobs / safeTotalJobs) * 100
            )
            setGenerationProgress(committedProgress)

            if (
                state.completedJobs >= safeTotalJobs &&
                !hasShownCompletionToastRef.current
            ) {
                hasShownCompletionToastRef.current = true
                toast.success({
                    title: 'Questions Generated Successfully!',
                    description: `${generatedQuestionsCountRef.current} MCQ questions have been generated and indexed.`,
                })
            }
        }

        const handleConnectError = (err: Error) => {
            console.error('WebSocket connection error:', err.message)
            setIsConnected(false)
        }

        socket.on('connect', handleConnect)
        socket.on('disconnect', handleDisconnect)
        socket.on('questions:ready', handleQuestionsReady)
        socket.on('connect_error', handleConnectError)

        return () => {
            socket.off('connect', handleConnect)
            socket.off('disconnect', handleDisconnect)
            socket.off('questions:ready', handleQuestionsReady)
            socket.off('connect_error', handleConnectError)
            socket.disconnect()
            setIsConnected(false)
            socketRef.current = null
        }
    }, [
        user?.id,
        retryKey,
        setIsConnected,
        setLastQuestionsReadyEvent,
        setGenerationProgress,
        incrementCompletedJobs,
        stopGeneratingQuestions,
    ])

    useEffect(() => {
        if (!isGeneratingQuestions) {
            return
        }

        const singleJobCompletedByMock =
            totalJobs === 1 && generationProgress >= 100
        const multiJobCompletedByServer =
            totalJobs > 1 && completedJobs >= totalJobs

        if (singleJobCompletedByMock || multiJobCompletedByServer) {
            setGenerationProgress(100)

            // Keep 100% briefly for a smoother visual completion signal.
            const completeTimer = window.setTimeout(() => {
                stopGeneratingQuestions()
            }, 600)

            return () => {
                window.clearTimeout(completeTimer)
            }
        }
    }, [
        isGeneratingQuestions,
        generationProgress,
        completedJobs,
        totalJobs,
        setGenerationProgress,
        stopGeneratingQuestions,
    ])

    useEffect(() => {
        if (!isGeneratingQuestions) {
            generatedQuestionsCountRef.current = 0
            hasShownCompletionToastRef.current = false
            setStatusLineIndex(0)
            return
        }

        const statusTimer = window.setInterval(() => {
            setStatusLineIndex(
                (current) => (current + 1) % GENERATION_STATUS_LINES.length
            )
        }, 2200)

        return () => {
            window.clearInterval(statusTimer)
        }
    }, [isGeneratingQuestions])

    useEffect(() => {
        if (!isGeneratingQuestions) {
            return
        }

        const intervalId = window.setInterval(() => {
            const state = getSocketConnectionStore.getState()
            const current = state.generationProgress
            const safeTotalJobs = Math.max(1, state.totalJobs)
            const committedProgress = Math.floor(
                (state.completedJobs / safeTotalJobs) * 100
            )

            const maxMockProgress =
                safeTotalJobs === 1 ? 100 : Math.min(95, committedProgress + 20)

            if (current >= maxMockProgress) {
                return
            }

            // Mocked progress: fast at start, slower near completion.
            if (current < 65) {
                setGenerationProgress(Math.min(current + 4, maxMockProgress))
                return
            }

            if (current < 85) {
                setGenerationProgress(Math.min(current + 2, maxMockProgress))
                return
            }

            if (current < 95) {
                setGenerationProgress(Math.min(current + 1, maxMockProgress))
            }
        }, 900)

        return () => {
            window.clearInterval(intervalId)
        }
    }, [isGeneratingQuestions, totalJobs, completedJobs, setGenerationProgress])

    return (
        <div
            className="fixed bottom-4 right-4 z-50 pointer-events-none"
            aria-live="polite"
            aria-atomic="true"
        >
            {isSocketDisabled && (
                <div className="pointer-events-auto mb-3 w-[280px] rounded-lg border border-border bg-background/95 px-3 py-2 text-left text-xs text-foreground shadow-lg backdrop-blur">
                    <p className="font-medium">Realtime sync disabled</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Set NEXT_PUBLIC_EVAL_URL to enable socket updates.
                    </p>
                    <button
                        type="button"
                        className="mt-2 inline-flex items-center rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                        onClick={() => {
                            hasWarnedMissingUrlRef.current = false
                            setRetryKey((value) => value + 1)
                        }}
                    >
                        Try again
                    </button>
                </div>
            )}
            {isGeneratingQuestions && (
                <div className="min-w-[220px] max-w-[260px] rounded-lg border border-border bg-background/90 shadow-lg backdrop-blur px-3 py-2">
                    <div className="flex items-center gap-2">
                        
                           <MiniSparkle />
                        
                        <p className="text-xs font-medium text-foreground">
                            AI generation in progress
                        </p>
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />

                        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                            {generationProgress}%
                        </span>
                    </div>
                    <p
                        key={statusLineIndex}
                        className="mt-1 text-[11px] leading-4 text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                    >
                        {
                            GENERATION_STATUS_LINES[
                                statusLineIndex % GENERATION_STATUS_LINES.length
                            ]
                        }
                    </p>
                    {/* <p className="mt-1 text-[10px] leading-4 text-muted-foreground/90 tabular-nums">
                        {Math.min(completedJobs, totalJobs)} / {Math.max(1, totalJobs)} batches completed
                    </p> */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${generationProgress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
