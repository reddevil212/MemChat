"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioPlayerProps {
    src: string
    className?: string
    initialDuration?: number
}

export function AudioPlayer({ src, className, initialDuration }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(initialDuration || 0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const setAudioData = () => {
            // Only update duration from metadata if we don't have initialDuration
            if (!initialDuration) {
                setDuration(audio.duration)
            }
        }

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime)
        }

        const handleEnded = () => {
            setIsPlaying(false)
            audio.currentTime = 0
            setCurrentTime(0)
        }

        // Events
        audio.addEventListener('loadeddata', setAudioData)
        audio.addEventListener('timeupdate', setAudioTime)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('loadeddata', setAudioData)
            audio.removeEventListener('timeupdate', setAudioTime)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [initialDuration])

    // Update duration when initialDuration changes
    useEffect(() => {
        if (initialDuration) {
            setDuration(initialDuration)
        }
    }, [initialDuration])

    // Play/Pause
    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
            setIsPlaying(false)
        } else {
            audio.play()
            setIsPlaying(true)
        }
    }

    // Update current time
    const handleTimeChange = (values: number[]) => {
        const audio = audioRef.current
        if (!audio) return

        audio.currentTime = values[0]
        setCurrentTime(values[0])
    }

    // Toggle mute
    const toggleMute = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isMuted) {
            audio.volume = volume
            setIsMuted(false)
        } else {
            audio.volume = 0
            setIsMuted(true)
        }
    }

    // Format time (mm:ss)
    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00"

        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div className={cn("flex flex-col space-y-2", className)}>
            <audio ref={audioRef} src={src} preload="metadata" />

            <div className="flex items-center space-x-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={togglePlay}
                >
                    {isPlaying ? (
                        <Pause className="h-4 w-4" />
                    ) : (
                        <Play className="h-4 w-4" />
                    )}
                </Button>

                <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleTimeChange}
                    className="w-full"
                />

                <div className="text-xs text-muted-foreground w-16 text-right">
                    {formatTime(currentTime)}/{formatTime(duration)}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={toggleMute}
                >
                    {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                    ) : (
                        <Volume2 className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    )
}