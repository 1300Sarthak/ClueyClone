// OCRHelper.ts

import { app } from "electron"
import path from "node:path"
import fs from "node:fs"
import { v4 as uuidv4 } from "uuid"
import sharp from "sharp"

interface OCRResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
  }>
}

interface ScreenContext {
  timestamp: number
  text: string
  confidence: number
  windowTitle?: string
  application?: string
}

export class OCRHelper {
  private screenContextHistory: ScreenContext[] = []
  private readonly maxHistorySize: number = 20
  private readonly tempDir: string

  constructor() {
    this.tempDir = path.join(app.getPath("temp"), "cluely-ocr")
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  public async extractTextFromImage(imagePath: string): Promise<OCRResult> {
    try {
      // Preprocess image for better OCR
      const processedImagePath = await this.preprocessImage(imagePath)
      
      // Use Tesseract.js for OCR
      const { createWorker } = require('tesseract.js')
      const worker = await createWorker('eng')
      
      const { data } = await worker.recognize(processedImagePath)
      
      await worker.terminate()

      // Clean up processed image
      try {
        fs.unlinkSync(processedImagePath)
      } catch (error) {
        console.error("Error cleaning up processed image:", error)
      }

      return {
        text: data.text,
        confidence: data.confidence / 100, // Normalize to 0-1
        words: data.words.map((word: any) => ({
          text: word.text,
          confidence: word.confidence / 100,
          bbox: word.bbox
        }))
      }
    } catch (error) {
      console.error("Error extracting text from image:", error)
      return {
        text: "",
        confidence: 0,
        words: []
      }
    }
  }

  private async preprocessImage(imagePath: string): Promise<string> {
    const outputPath = path.join(this.tempDir, `${uuidv4()}.png`)
    
    try {
      await sharp(imagePath)
        .grayscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen() // Sharpen edges
        .png()
        .toFile(outputPath)
      
      return outputPath
    } catch (error) {
      console.error("Error preprocessing image:", error)
      return imagePath // Return original if preprocessing fails
    }
  }

  public async updateScreenContext(imagePath: string, windowInfo?: { title?: string; app?: string }): Promise<void> {
    try {
      const ocrResult = await this.extractTextFromImage(imagePath)
      
      if (ocrResult.text.trim() && ocrResult.confidence > 0.3) {
        const screenContext: ScreenContext = {
          timestamp: Date.now(),
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          windowTitle: windowInfo?.title,
          application: windowInfo?.app
        }

        this.screenContextHistory.push(screenContext)
        
        // Keep only recent history
        if (this.screenContextHistory.length > this.maxHistorySize) {
          this.screenContextHistory = this.screenContextHistory.slice(-this.maxHistorySize)
        }

        console.log("Updated screen context:", screenContext.text.substring(0, 100) + "...")
      }
    } catch (error) {
      console.error("Error updating screen context:", error)
    }
  }

  public getRecentScreenContext(minutes: number = 5): ScreenContext[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000)
    return this.screenContextHistory.filter(context => context.timestamp > cutoffTime)
  }

  public getCurrentScreenText(): string {
    if (this.screenContextHistory.length === 0) return ""
    
    const latest = this.screenContextHistory[this.screenContextHistory.length - 1]
    return latest.text
  }

  public getScreenContextSummary(): string {
    const recentContexts = this.getRecentScreenContext(2) // Last 2 minutes
    
    if (recentContexts.length === 0) return ""
    
    // Combine all recent text with timestamps
    return recentContexts
      .map(context => {
        const timeAgo = Math.round((Date.now() - context.timestamp) / 1000)
        return `[${timeAgo}s ago] ${context.text}`
      })
      .join("\n")
  }

  public clearHistory(): void {
    this.screenContextHistory = []
  }

  public async cleanup(): Promise<void> {
    // Clean up temp directory
    try {
      const files = fs.readdirSync(this.tempDir)
      for (const file of files) {
        fs.unlinkSync(path.join(this.tempDir, file))
      }
      fs.rmdirSync(this.tempDir)
    } catch (error) {
      console.error("Error cleaning up OCR temp directory:", error)
    }
    
    this.clearHistory()
  }
} 