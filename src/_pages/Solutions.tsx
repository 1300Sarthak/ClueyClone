// Solutions.tsx
import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"

import ScreenshotQueue from "../components/Queue/ScreenshotQueue"

import { ProblemStatementData } from "../types/solutions"
import SolutionCommands from "../components/Solutions/SolutionCommands"
import Debug from "./Debug"
import { useToast } from "../App"

export const ContentSection = ({
  title,
  content,
  isLoading
}: {
  title: string
  content: React.ReactNode
  isLoading: boolean
}) => (
  <div className="space-y-2">
    <h2 className="text-[13px] font-medium text-white tracking-wide">
      {title}
    </h2>
    {isLoading ? (
      <div className="mt-4 flex">
        <p className="text-xs bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent animate-pulse">
          Extracting problem statement...
        </p>
      </div>
    ) : (
      <div className="text-[13px] leading-[1.4] text-gray-200 max-w-[600px]">
        {content}
      </div>
    )}
  </div>
)
const SolutionSection = ({
  title,
  content,
  isLoading
}: {
  title: string
  content: React.ReactNode
  isLoading: boolean
}) => (
  <div className="space-y-2">
    <h2 className="text-[13px] font-medium text-white tracking-wide">
      {title}
    </h2>
    {isLoading ? (
      <div className="space-y-1.5">
        <div className="mt-4 flex">
          <p className="text-xs bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent animate-pulse">
            Loading solutions...
          </p>
        </div>
      </div>
    ) : (
      <div className="w-full">
        <SyntaxHighlighter
          showLineNumbers
          language="python"
          style={dracula}
          customStyle={{
            maxWidth: "100%",
            margin: 0,
            padding: "1rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all"
          }}
          wrapLongLines={true}
        >
          {content as string}
        </SyntaxHighlighter>
      </div>
    )}
  </div>
)

export const ComplexitySection = ({
  timeComplexity,
  spaceComplexity,
  isLoading
}: {
  timeComplexity: string | null
  spaceComplexity: string | null
  isLoading: boolean
}) => (
  <div className="space-y-2">
    <h2 className="text-[13px] font-medium text-white tracking-wide">
      Complexity
    </h2>
    {isLoading ? (
      <p className="text-xs bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent animate-pulse">
        Calculating complexity...
      </p>
    ) : (
      <div className="space-y-1">
        <div className="flex items-start gap-2 text-[13px] leading-[1.4] text-gray-200">
          <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
          <div>
            <strong>Time:</strong> {timeComplexity}
          </div>
        </div>
        <div className="flex items-start gap-2 text-[13px] leading-[1.4] text-gray-200">
          <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
          <div>
            <strong>Space:</strong> {spaceComplexity}
          </div>
        </div>
      </div>
    )}
  </div>
)

interface SolutionsProps {
  setView: React.Dispatch<React.SetStateAction<"queue" | "solutions" | "debug" | "copilot">>
}
const Solutions: React.FC<SolutionsProps> = ({ setView }) => {
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)

  const [debugProcessing, setDebugProcessing] = useState(false)
  const [problemStatementData, setProblemStatementData] =
    useState<ProblemStatementData | null>(null)
  const [solutionData, setSolutionData] = useState<string | null>(null)
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null)
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(
    null
  )
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(
    null
  )

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)

  const [isResetting, setIsResetting] = useState(false)

  const { data: extraScreenshots = [], refetch } = useQuery({
    queryKey: ["extras"],
    queryFn: async () => {
      try {
        const existing = await window.electronAPI.getScreenshots()
        return existing
      } catch (error) {
        console.error("Error loading extra screenshots:", error)
        return []
      }
    },
    staleTime: Infinity,
    cacheTime: Infinity
  })

  const { showToast } = useToast()

  useEffect(() => {
    // Height update logic
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        if (isTooltipVisible) {
          contentHeight += tooltipHeight
        }
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
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onApiKeyOutOfCredits(() => {
        showToast(
          "API Key Out of Credits",
          "Your OpenAI API key is out of credits. Please refill your credits and try again.",
          "error"
        )
      }),
      window.electronAPI.onResetView(() => {
        // Set resetting state first
        setIsResetting(true)

        // Clear the queries
        queryClient.removeQueries(["solution"])
        queryClient.removeQueries(["new_solution"])

        // Reset other states
        refetch()

        // After a small delay, clear the resetting state
        setTimeout(() => {
          setIsResetting(false)
        }, 0)
      }),
      window.electronAPI.onSolutionStart(() => {
        // Every time processing starts, reset relevant states
        setSolutionData(null)
        setThoughtsData(null)
        setTimeComplexityData(null)
        setSpaceComplexityData(null)
      }),
      //if there was an error processing the initial solution
      window.electronAPI.onSolutionError((error: string) => {
        showToast(
          "Processing Failed",
          "There was an error processing your extra screenshots.",
          "error"
        )
        // Reset solutions in the cache (even though this shouldn't ever happen) and complexities to previous states
        const solution = queryClient.getQueryData(["solution"]) as {
          code: string
          thoughts: string[]
          time_complexity: string
          space_complexity: string
        } | null
        if (!solution) {
          setView("queue") //make sure that this is correct. or like make sure there's a toast or something
        }
        setSolutionData(solution?.code || null)
        setThoughtsData(solution?.thoughts || null)
        setTimeComplexityData(solution?.time_complexity || null)
        setSpaceComplexityData(solution?.space_complexity || null)
        console.error("Processing error:", error)
      }),
      //when the initial solution is generated, we'll set the solution data to that
      window.electronAPI.onSolutionSuccess((data) => {
        if (!data) {
          console.warn("Received empty or invalid solution data")
          return
        }
        console.log({ data })
        const solutionData = {
          code: data.code,
          thoughts: data.thoughts,
          time_complexity: data.time_complexity,
          space_complexity: data.space_complexity
        }

        queryClient.setQueryData(["solution"], solutionData)
        setSolutionData(solutionData.code || null)
        setThoughtsData(solutionData.thoughts || null)
        setTimeComplexityData(solutionData.time_complexity || null)
        setSpaceComplexityData(solutionData.space_complexity || null)
      }),

      //########################################################
      //DEBUG EVENTS
      //########################################################
      window.electronAPI.onDebugStart(() => {
        //we'll set the debug processing state to true and use that to render a little loader
        setDebugProcessing(true)
      }),
      //the first time debugging works, we'll set the view to debug and populate the cache with the data
      window.electronAPI.onDebugSuccess((data) => {
        queryClient.setQueryData(["new_solution"], data)
        setDebugProcessing(false)
      }),
      //when there was an error in the initial debugging, we'll show a toast and stop the little generating pulsing thing.
      window.electronAPI.onDebugError(() => {
        showToast(
          "Processing Failed",
          "There was an error debugging your code.",
          "error"
        )
        setDebugProcessing(false)
      }),
      window.electronAPI.onProcessingNoScreenshots(() => {
        showToast(
          "No Screenshots",
          "There are no extra screenshots to process.",
          "neutral"
        )
      })
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isTooltipVisible, tooltipHeight])

  useEffect(() => {
    setProblemStatementData(
      queryClient.getQueryData(["problem_statement"]) || null
    )
    setSolutionData(queryClient.getQueryData(["solution"]) || null)

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query.queryKey[0] === "problem_statement") {
        setProblemStatementData(
          queryClient.getQueryData(["problem_statement"]) || null
        )
      }
      if (event?.query.queryKey[0] === "solution") {
        const solution = queryClient.getQueryData(["solution"]) as {
          code: string
          thoughts: string[]
          time_complexity: string
          space_complexity: string
        } | null

        setSolutionData(solution?.code ?? null)
        setThoughtsData(solution?.thoughts ?? null)
        setTimeComplexityData(solution?.time_complexity ?? null)
        setSpaceComplexityData(solution?.space_complexity ?? null)
      }
    })
    return () => unsubscribe()
  }, [queryClient])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  const handleDeleteExtraScreenshot = async (index: number) => {
    const screenshotToDelete = extraScreenshots[index]

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path
      )

      if (response.success) {
        refetch() // Refetch screenshots instead of managing state directly
      } else {
        console.error("Failed to delete extra screenshot:", response.error)
        showToast("Error", "Failed to delete the screenshot", "error")
      }
    } catch (error) {
      console.error("Error deleting extra screenshot:", error)
      showToast("Error", "Failed to delete the screenshot", "error")
    }
  }

  return (
    <>
      {!isResetting && queryClient.getQueryData(["new_solution"]) ? (
        <>
          <Debug
            isProcessing={debugProcessing}
            setIsProcessing={setDebugProcessing}
          />
        </>
      ) : (
        <div ref={contentRef} className="relative space-y-3 px-4 py-3 bg-black">
          {/* Conditionally render the screenshot queue if solutionData is available */}
          {solutionData && (
            <div className="bg-transparent w-fit">
              <div className="pb-3">
                <div className="space-y-3 w-fit">
                  <ScreenshotQueue
                    isLoading={debugProcessing}
                    screenshots={extraScreenshots}
                    onDeleteScreenshot={handleDeleteExtraScreenshot}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navbar of commands with the SolutionsHelper */}
          <SolutionCommands
            extraScreenshots={extraScreenshots}
            onTooltipVisibilityChange={handleTooltipVisibilityChange}
          />

          {/* Main Content - Modified width constraints */}
          <div className="w-full text-sm text-white bg-gray-900/80 rounded-md border border-gray-700">
            <div className="rounded-lg overflow-hidden">
              <div className="px-4 py-3 space-y-4 max-w-full">
                {!solutionData && (
                  <>
                    <ContentSection
                      title="Problem Statement"
                      content={problemStatementData?.problem_statement}
                      isLoading={!problemStatementData}
                    />
                    {problemStatementData && (
                      <div className="mt-4 flex">
                        <p className="text-xs bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent animate-pulse">
                          Generating solutions...
                        </p>
                      </div>
                    )}
                  </>
                )}
                {solutionData && (
                  <>
                    <ContentSection
                      title="Thoughts (Read these aloud)"
                      content={
                        thoughtsData && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              {thoughtsData.map((thought, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
                                  <div>{thought}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }
                      isLoading={!thoughtsData}
                    />

                    <SolutionSection
                      title="Solution"
                      content={solutionData}
                      isLoading={!solutionData}
                    />
                    <ComplexitySection
                      timeComplexity={timeComplexityData}
                      spaceComplexity={spaceComplexityData}
                      isLoading={!timeComplexityData || !spaceComplexityData}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Solutions
