import React, { useState, useEffect, useRef } from "react"
import { useToast } from "../App"

interface CopilotProps {
  setView: React.Dispatch<React.SetStateAction<"queue" | "solutions" | "debug" | "copilot">>
}

interface AIResponse {
  type: "answer" | "definition" | "suggestion" | "followup" | "passive"
  content: string
  confidence: number
  action?: string
}

const Copilot: React.FC<CopilotProps> = ({ setView }) => {
  const { showToast } = useToast()
  const contentRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null)
  const [screenContext, setScreenContext] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Height update logic
    const updateDimensions = () => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
    }

    // Initialize resize observer
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    // Set up event listeners
    const cleanupFunctions = [
      window.electronAPI.onCopilotActivated(() => {
        setIsActive(true)
        showToast("Copilot Activated", "Listening and analyzing...", "success")
      }),

      window.electronAPI.onCopilotDeactivated(() => {
        setIsActive(false)
        setCurrentResponse(null)
        showToast("Copilot Deactivated", "Stopped listening", "neutral")
      }),

      window.electronAPI.onCopilotResponse((response: AIResponse) => {
        setCurrentResponse(response)
        setIsProcessing(false)
      }),

      window.electronAPI.onScreenContextUpdated((context: string) => {
        setScreenContext(context)
      })
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [])

  const handleProcessContext = async () => {
    setIsProcessing(true)
    try {
      await window.electronAPI.processCopilotContext()
    } catch (error) {
      console.error("Error processing context:", error)
      setIsProcessing(false)
      showToast("Error", "Failed to process context", "error")
    }
  }

  const renderResponse = (response: AIResponse) => {
    const getResponseIcon = () => {
      switch (response.type) {
        case "answer":
          return "💡"
        case "definition":
          return "📚"
        case "suggestion":
          return "💭"
        case "followup":
          return "❓"
        case "passive":
          return "👁️"
        default:
          return "🤖"
      }
    }

    const getResponseTitle = () => {
      switch (response.type) {
        case "answer":
          return "Answer"
        case "definition":
          return "Definition"
        case "suggestion":
          return "Suggestion"
        case "followup":
          return "Follow-up Questions"
        case "passive":
          return "Listening"
        default:
          return "Response"
      }
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getResponseIcon()}</span>
          <h3 className="text-sm font-medium text-white">
            {getResponseTitle()}
          </h3>
          <div className="flex-1" />
          <div className="text-xs text-gray-400">
            {Math.round(response.confidence * 100)}% confidence
          </div>
        </div>
        
        <div className="bg-gray-900/80 rounded-lg p-3 text-sm text-gray-100 leading-relaxed border border-gray-700">
          <div 
            className="prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: response.content.replace(/\n/g, '<br/>') 
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div ref={contentRef} className="bg-black w-80">
      <div className="px-4 py-3">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-white mb-1">Cluely Copilot</h1>
            <p className="text-xs text-gray-400">Recreated by Sarthak Sethi</p>
          </div>

          {/* Status Header */}
          <div className="flex items-center justify-between bg-gray-900/80 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm text-white/90">
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            
            <div className="text-xs text-gray-400">
              ⌘⇧K to toggle
            </div>
          </div>

          {/* Screen Context */}
          {screenContext && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-white/90">Screen Context</h3>
              <div className="bg-gray-900/60 rounded-lg p-2 text-xs text-gray-300 max-h-20 overflow-y-auto border border-gray-700">
                {screenContext}
              </div>
            </div>
          )}

          {/* AI Response */}
          {currentResponse && renderResponse(currentResponse)}

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-900/80 rounded-lg p-3 border border-gray-700">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Processing context...
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleProcessContext}
              disabled={!isActive || isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm px-3 py-2 rounded-md transition-colors"
            >
              Process Context
            </button>
            
            <button
              onClick={() => setView("queue")}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-md transition-colors"
            >
              Back
            </button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-400 space-y-1 bg-gray-900/60 rounded-lg p-3 border border-gray-700">
            <div>• Press ⌘⇧K to activate/deactivate</div>
            <div>• Copilot listens to audio and reads screen</div>
            <div>• Provides intelligent responses in real-time</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Copilot 