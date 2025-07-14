import { useState, useRef, useEffect } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "./ui/card"

interface ApiKeyAuthProps {
  onApiKeySubmit: (apiKey: string) => void
}

const ApiKeyAuth: React.FC<ApiKeyAuthProps> = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState("")
  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Height update logic
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
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

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim())
    }
  }

  const handleOpenLink = (url: string) => {
    window.electronAPI.openExternal(url)
  }

  return (
    <div
      ref={contentRef}
      className="w-fit h-fit flex flex-col items-center justify-center bg-black rounded-xl p-8"
    >
      <Card className="bg-black border-gray-800 text-white">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center text-white">
            Cluely Copilot
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Recreated Cluely by Sarthak Sethi
          </CardDescription>
          <CardDescription className="text-center text-gray-500 text-sm">
            Please enter your OpenAI API key to continue. Your key will be stored securely locally.
            Press Cmd + B to hide/show the window, Cmd + Shift + K to activate the copilot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full font-medium bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!apiKey.trim()}
            >
              Start Cluely Copilot
            </Button>
            
            <p className="text-gray-500 text-xs text-center pt-2">
              Built with ❤️ by{" "}
              <button
                onClick={() =>
                  handleOpenLink("https://github.com/sarthaksethi")
                }
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Sarthak Sethi
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ApiKeyAuth
