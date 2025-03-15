"use client"

import React from 'react'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCall } from '../contexts/contexts_CallContext'

interface IncomingCallDialogProps {
  callerName: string
}

export const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({ callerName }) => {
  const { callState, answerCall, rejectCall } = useCall()

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center">
      <div className="bg-[#1e1d1d] rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            {callState.callType === 'video' ? (
              <Video className="w-8 h-8 text-white" />
            ) : (
              <Phone className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Incoming {callState.callType} call
          </h2>
          <p className="text-gray-400 mb-6">{callerName}</p>

          <div className="flex justify-center space-x-4">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full p-4 bg-red-500"
              onClick={rejectCall}
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full p-4 bg-green-500"
              onClick={answerCall}
            >
              <Phone className="w-6 h-6 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}