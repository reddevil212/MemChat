"use client"

import React from 'react'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCall } from '../contexts/contexts_CallContext'

interface CallInterfaceProps {
  recipientName: string
}

export const CallInterface: React.FC<CallInterfaceProps> = ({ recipientName }) => {
  const { callState, endCall } = useCall()
  const [isMuted, setIsMuted] = React.useState(false)
  const [isVideoOff, setIsVideoOff] = React.useState(false)

  const localVideoRef = React.useRef<HTMLVideoElement>(null)
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null)
  const remoteAudioRef = React.useRef<HTMLAudioElement>(null)

  React.useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream
    }
  }, [callState.localStream])

  React.useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream
    }
    if (remoteAudioRef.current && callState.remoteStream) {
      remoteAudioRef.current.srcObject = callState.remoteStream
    }
  }, [callState.remoteStream])

  const toggleMute = () => {
    if (callState.localStream) {
      callState.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
        console.log(`Audio track enabled: ${track.enabled}`)
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (callState.localStream && callState.callType === 'video') {
      callState.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
        console.log(`Video track enabled: ${track.enabled}`)
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center">
      <div className="bg-[#1e1d1d] rounded-lg p-4 w-full max-w-4xl">
        <div className="flex flex-col h-[600px]">
          {/* Video Container */}
          <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
            {callState.callType === 'video' ? (
              <>
                <video
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                <video
                  ref={localVideoRef}
                  className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg"
                  autoPlay
                  playsInline
                  muted
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">{recipientName}</h2>
                  <p className="text-gray-400">Audio Call</p>
                </div>
              </div>
            )}
            {callState.callType === 'audio' && (
              <audio ref={remoteAudioRef} autoPlay />
            )}
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center space-x-4 mt-4">
            <Button
              variant="ghost"
              size="lg"
              className={`rounded-full p-4 ${isMuted ? 'bg-red-500' : 'bg-gray-700'}`}
              onClick={toggleMute}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="rounded-full p-4 bg-red-500"
              onClick={endCall}
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </Button>

            {callState.callType === 'video' && (
              <Button
                variant="ghost"
                size="lg"
                className={`rounded-full p-4 ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'}`}
                onClick={toggleVideo}
              >
                {isVideoOff ? (
                  <VideoOff className="w-6 h-6 text-white" />
                ) : (
                  <Video className="w-6 h-6 text-white" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}