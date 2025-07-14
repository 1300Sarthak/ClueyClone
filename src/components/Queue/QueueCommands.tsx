import React, { useState, useEffect, useRef } from "react"

interface QueueCommandsProps {
  onTooltipVisibilityChange: (visible: boolean, height: number) => void
}

const QueueCommands: React.FC<QueueCommandsProps> = ({
  onTooltipVisibilityChange
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let tooltipHeight = 0
    if (tooltipRef.current && isTooltipVisible) {
      tooltipHeight = tooltipRef.current.offsetHeight + 10 // Adding margin/padding if necessary
    }
    onTooltipVisibilityChange(isTooltipVisible, tooltipHeight)
  }, [isTooltipVisible])

  const handleMouseEnter = () => {
    setIsTooltipVisible(true)
  }

  const handleMouseLeave = () => {
    setIsTooltipVisible(false)
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Question mark circle */}
      <div className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center cursor-help z-10">
        <span className="text-xs text-white/70">?</span>
      </div>

      {/* Tooltip Content */}
      {isTooltipVisible && (
        <div ref={tooltipRef} className="absolute top-full right-0 mt-2 w-80">
          <div className="p-3 text-xs bg-gray-900/95 backdrop-blur-md rounded-lg border border-gray-700 text-white/90 shadow-lg">
            <div className="space-y-4">
              <h3 className="font-medium truncate">Keyboard Shortcuts</h3>
              <div className="space-y-3">
                {/* Toggle Command */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate">Toggle Window</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px] leading-none">
                        ⌘
                      </span>
                      <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px] leading-none">
                        B
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed text-white/70 truncate">
                    Show or hide this window.
                  </p>
                </div>
                {/* Screenshot Command */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate">Take Screenshot</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px] leading-none">
                        ⌘
                      </span>
                      <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px] leading-none">
                        H
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed text-white/70 truncate">
                    Take a screenshot of the problem description. The tool will
                    extract and analyze the problem. The 5 latest screenshots
                    are saved.
                  </p>
                </div>

                {/* Solve Command */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate">Solve Problem</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px] leading-none">
                        ⌘
                      </span>
                      <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px] leading-none">
                        ↵
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed text-white/70 truncate">
                    Generate a solution based on the current problem.
                  </p>
                </div>

                {/* Copilot Command */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate">Toggle Copilot</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <span className="bg-blue-600 px-1.5 py-0.5 rounded text-[10px] leading-none">
                        ⌘
                      </span>
                      <span className="bg-blue-600 px-1.5 py-0.5 rounded text-[10px] leading-none">
                        ⇧
                      </span>
                      <span className="bg-blue-600 px-1.5 py-0.5 rounded text-[10px] leading-none">
                        K
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed text-white/70 truncate">
                    Activate real-time AI assistant with audio and screen context.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QueueCommands
