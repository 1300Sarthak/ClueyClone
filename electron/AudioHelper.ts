// AudioHelper.ts

import { app } from "electron"
import path from "node:path"
import fs from "node:fs"
import { v4 as uuidv4 } from "uuid"
import { execFile } from "child_process"
import { promisify } from "util"
import axios from "axios"
import { store } from "./store"

const execFileAsync = promisify(execFile)

interface TranscriptionResult {
  text: string
  confidence: number
  language: string
}

interface AudioChunk {
  id: string
  path: string
  timestamp: number
  duration: number
}

export class AudioHelper {
  private isRecording: boolean = false
  private audioChunks: AudioChunk[] = []
  private readonly audioDir: string
  private readonly maxChunks: number = 10 // Keep last 10 chunks
  private recordingProcess: any = null

  constructor() {
    this.audioDir = path.join(app.getPath("userData"), "audio_chunks")
    
    // Create audio directory if it doesn't exist
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true })
    }
  }

  public async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.log("Already recording")
      return
    }

    this.isRecording = true
    console.log("Starting audio recording...")

    // Start recording using platform-specific methods
    if (process.platform === "darwin") {
      await this.startRecordingMac()
    } else if (process.platform === "win32") {
      await this.startRecordingWindows()
    } else {
      throw new Error("Unsupported platform for audio recording")
    }
  }

  public async stopRecording(): Promise<void> {
    if (!this.isRecording) {
      console.log("Not currently recording")
      return
    }

    this.isRecording = false
    console.log("Stopping audio recording...")

    if (this.recordingProcess) {
      this.recordingProcess.kill()
      this.recordingProcess = null
    }

    // Process the latest audio chunk
    await this.processLatestChunk()
  }

  private async startRecordingMac(): Promise<void> {
    const outputPath = path.join(this.audioDir, `${uuidv4()}.wav`)
    
    // Use sox for recording on macOS
    this.recordingProcess = execFile("sox", [
      "-d", // Default audio input
      "-r", "16000", // Sample rate
      "-c", "1", // Mono
      "-b", "16", // 16-bit
      outputPath,
      "trim", "0", "30" // Record for 30 seconds max
    ])

    // Store chunk info
    this.audioChunks.push({
      id: uuidv4(),
      path: outputPath,
      timestamp: Date.now(),
      duration: 30
    })

    // Clean up old chunks
    this.cleanupOldChunks()
  }

  private async startRecordingWindows(): Promise<void> {
    const outputPath = path.join(this.audioDir, `${uuidv4()}.wav`)
    
    // Use PowerShell with Media.SoundRecorder on Windows
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Media
      $recorder = New-Object System.Media.SoundRecorder
      $recorder.StartRecording()
      Start-Sleep -Seconds 30
      $recorder.StopRecording()
      $recorder.Save('${outputPath.replace(/\\/g, "\\\\")}')
    `
    
    this.recordingProcess = execFile("powershell", ["-command", script])

    // Store chunk info
    this.audioChunks.push({
      id: uuidv4(),
      path: outputPath,
      timestamp: Date.now(),
      duration: 30
    })

    // Clean up old chunks
    this.cleanupOldChunks()
  }

  private async processLatestChunk(): Promise<void> {
    if (this.audioChunks.length === 0) return

    const latestChunk = this.audioChunks[this.audioChunks.length - 1]
    
    try {
      const transcription = await this.transcribeAudio(latestChunk.path)
      if (transcription && transcription.text.trim()) {
        console.log("Transcription:", transcription.text)
        // Emit transcription event to main process
        this.emitTranscriptionEvent(transcription)
      }
    } catch (error) {
      console.error("Error transcribing audio:", error)
    }
  }

  private async transcribeAudio(audioPath: string): Promise<TranscriptionResult | null> {
    const apiKey = store.get("openaiApiKey")
    if (!apiKey) {
      console.error("OpenAI API key not set")
      return null
    }

    try {
      // Read audio file as base64
      const audioBuffer = fs.readFileSync(audioPath)
      const base64Audio = audioBuffer.toString("base64")

      // Send to OpenAI Whisper API
      const response = await axios.post(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          file: `data:audio/wav;base64,${base64Audio}`,
          model: "whisper-1",
          language: "en"
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      )

      return {
        text: response.data.text,
        confidence: 0.9, // Whisper doesn't return confidence scores
        language: response.data.language || "en"
      }
    } catch (error) {
      console.error("Error calling Whisper API:", error)
      return null
    }
  }

  private emitTranscriptionEvent(transcription: TranscriptionResult): void {
    // This will be handled by the main process
    // We'll implement the event emission in the main process
    console.log("Transcription event:", transcription)
  }

  private cleanupOldChunks(): void {
    if (this.audioChunks.length > this.maxChunks) {
      const chunksToRemove = this.audioChunks.splice(0, this.audioChunks.length - this.maxChunks)
      
      chunksToRemove.forEach(chunk => {
        try {
          fs.unlinkSync(chunk.path)
        } catch (error) {
          console.error("Error removing old audio chunk:", error)
        }
      })
    }
  }

  public getRecentTranscriptions(): AudioChunk[] {
    return this.audioChunks.slice(-5) // Return last 5 chunks
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  public async cleanup(): Promise<void> {
    if (this.isRecording) {
      await this.stopRecording()
    }

    // Clean up all audio chunks
    this.audioChunks.forEach(chunk => {
      try {
        fs.unlinkSync(chunk.path)
      } catch (error) {
        console.error("Error removing audio chunk:", error)
      }
    })
    
    this.audioChunks = []
  }
} 