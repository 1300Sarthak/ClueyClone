import { app, BrowserWindow } from "electron"
import { initializeIpcHandlers } from "./ipcHandlers"
import { WindowHelper } from "./WindowHelper"
import { ScreenshotHelper } from "./ScreenshotHelper"
import { ShortcutsHelper } from "./shortcuts"
import { ProcessingHelper } from "./ProcessingHelper"
import { AudioHelper } from "./AudioHelper"
import { OCRHelper } from "./OCRHelper"
import { CluelyAIHelper } from "./CluelyAIHelper"
import { autoUpdater } from "electron-updater"
import { initAutoUpdater } from "./autoUpdater"

export class AppState {
  private static instance: AppState | null = null

  private windowHelper: WindowHelper
  private screenshotHelper: ScreenshotHelper
  public shortcutsHelper: ShortcutsHelper
  public processingHelper: ProcessingHelper
  private audioHelper: AudioHelper
  private ocrHelper: OCRHelper
  private cluelyAIHelper: CluelyAIHelper

  // View management
  private view: "queue" | "solutions" | "copilot" = "queue"

  private problemInfo: {
    problem_statement: string
    input_format: Record<string, any>
    output_format: Record<string, any>
    constraints: Array<Record<string, any>>
    test_cases: Array<Record<string, any>>
  } | null = null // Allow null

  private hasDebugged: boolean = false

  // Copilot state
  private isCopilotActive: boolean = false
  private currentAudioTranscript: string = ""
  private currentScreenContext: string = ""
  private screenContextInterval: NodeJS.Timeout | null = null

  // Processing events
  public readonly PROCESSING_EVENTS = {
    //global states
    UNAUTHORIZED: "procesing-unauthorized",
    NO_SCREENSHOTS: "processing-no-screenshots",
    API_KEY_OUT_OF_CREDITS: "processing-api-key-out-of-credits",
    API_KEY_INVALID: "processing-api-key-invalid",

    //states for generating the initial solution
    INITIAL_START: "initial-start",
    PROBLEM_EXTRACTED: "problem-extracted",
    SOLUTION_SUCCESS: "solution-success",
    INITIAL_SOLUTION_ERROR: "solution-error",

    //states for processing the debugging
    DEBUG_START: "debug-start",
    DEBUG_SUCCESS: "debug-success",
    DEBUG_ERROR: "debug-error",

    // Copilot events
    COPILOT_ACTIVATED: "copilot-activated",
    COPILOT_DEACTIVATED: "copilot-deactivated",
    COPILOT_RESPONSE: "copilot-response",
    AUDIO_TRANSCRIPTION: "audio-transcription",
    SCREEN_CONTEXT_UPDATED: "screen-context-updated"
  } as const

  constructor() {
    // Initialize WindowHelper with this
    this.windowHelper = new WindowHelper(this)

    // Initialize ScreenshotHelper
    this.screenshotHelper = new ScreenshotHelper(this.view)

    // Initialize ProcessingHelper
    this.processingHelper = new ProcessingHelper(this)

    // Initialize ShortcutsHelper
    this.shortcutsHelper = new ShortcutsHelper(this)

    // Initialize new helpers
    this.audioHelper = new AudioHelper()
    this.ocrHelper = new OCRHelper()
    this.cluelyAIHelper = new CluelyAIHelper()
  }

  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState()
    }
    return AppState.instance
  }

  // Getters and Setters
  public getMainWindow(): BrowserWindow | null {
    return this.windowHelper.getMainWindow()
  }

  public getView(): "queue" | "solutions" | "copilot" {
    return this.view
  }

  public setView(view: "queue" | "solutions" | "copilot"): void {
    this.view = view
    this.screenshotHelper.setView(view)
  }

  public isVisible(): boolean {
    return this.windowHelper.isVisible()
  }

  public getScreenshotHelper(): ScreenshotHelper {
    return this.screenshotHelper
  }

  public getProblemInfo(): any {
    return this.problemInfo
  }

  public setProblemInfo(problemInfo: any): void {
    this.problemInfo = problemInfo
  }

  public getScreenshotQueue(): string[] {
    return this.screenshotHelper.getScreenshotQueue()
  }

  public getExtraScreenshotQueue(): string[] {
    return this.screenshotHelper.getExtraScreenshotQueue()
  }

  // Copilot methods
  public async activateCopilot(): Promise<void> {
    if (this.isCopilotActive) return

    this.isCopilotActive = true
    this.setView("copilot")
    
    const mainWindow = this.getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send(this.PROCESSING_EVENTS.COPILOT_ACTIVATED)
    }

    // Start audio recording
    await this.audioHelper.startRecording()
    
    // Start periodic screen context updates
    this.startScreenContextUpdates()
  }

  public async deactivateCopilot(): Promise<void> {
    if (!this.isCopilotActive) return

    this.isCopilotActive = false
    this.setView("queue")
    
    const mainWindow = this.getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send(this.PROCESSING_EVENTS.COPILOT_DEACTIVATED)
    }

    // Stop audio recording
    await this.audioHelper.stopRecording()
    
    // Stop screen context updates
    this.stopScreenContextUpdates()
  }

  public getCopilotActive(): boolean {
    return this.isCopilotActive
  }

  private startScreenContextUpdates(): void {
    // Update screen context every 5 seconds when copilot is active
    this.screenContextInterval = setInterval(async () => {
      if (!this.isCopilotActive) return

      try {
        // Take a screenshot for context
        const screenshotPath = await this.takeScreenshot()
        
        // Update screen context with OCR
        await this.ocrHelper.updateScreenContext(screenshotPath)
        
        // Get updated context
        this.currentScreenContext = this.ocrHelper.getScreenContextSummary()
        
        const mainWindow = this.getMainWindow()
        if (mainWindow) {
          mainWindow.webContents.send(
            this.PROCESSING_EVENTS.SCREEN_CONTEXT_UPDATED,
            this.currentScreenContext
          )
        }
      } catch (error) {
        console.error("Error updating screen context:", error)
      }
    }, 5000)
  }

  private stopScreenContextUpdates(): void {
    if (this.screenContextInterval) {
      clearInterval(this.screenContextInterval)
      this.screenContextInterval = null
    }
  }

  public async processCopilotContext(): Promise<void> {
    if (!this.isCopilotActive) return

    try {
      // Get current audio transcript
      const audioChunks = this.audioHelper.getRecentTranscriptions()
      if (audioChunks.length === 0) return

      // For now, use the latest chunk's transcription
      // In a full implementation, you'd want to get the actual transcription text
      this.currentAudioTranscript = "Latest audio transcript" // Placeholder

      // Process with AI
      const aiResponse = await this.cluelyAIHelper.processContext(
        this.currentAudioTranscript,
        this.currentScreenContext
      )

      if (aiResponse) {
        const mainWindow = this.getMainWindow()
        if (mainWindow) {
          mainWindow.webContents.send(
            this.PROCESSING_EVENTS.COPILOT_RESPONSE,
            aiResponse
          )
        }
      }
    } catch (error) {
      console.error("Error processing copilot context:", error)
    }
  }

  // Window management methods
  public createWindow(): void {
    this.windowHelper.createWindow()
  }

  public hideMainWindow(): void {
    this.windowHelper.hideMainWindow()
  }

  public showMainWindow(): void {
    this.windowHelper.showMainWindow()
  }

  public toggleMainWindow(): void {
    this.windowHelper.toggleMainWindow()
  }

  public setWindowDimensions(width: number, height: number): void {
    this.windowHelper.setWindowDimensions(width, height)
  }

  public clearQueues(): void {
    this.screenshotHelper.clearQueues()

    // Clear problem info
    this.problemInfo = null

    // Reset view to initial state
    this.setView("queue")
  }

  // Screenshot management methods
  public async takeScreenshot(): Promise<string> {
    if (!this.getMainWindow()) throw new Error("No main window available")

    const screenshotPath = await this.screenshotHelper.takeScreenshot(
      () => this.hideMainWindow(),
      () => this.showMainWindow()
    )

    return screenshotPath
  }

  public async getImagePreview(filepath: string): Promise<string> {
    return this.screenshotHelper.getImagePreview(filepath)
  }

  public async deleteScreenshot(
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.screenshotHelper.deleteScreenshot(path)
  }

  // New methods to move the window
  public moveWindowLeft(): void {
    this.windowHelper.moveWindowLeft()
  }

  public moveWindowRight(): void {
    this.windowHelper.moveWindowRight()
  }
  public moveWindowDown(): void {
    this.windowHelper.moveWindowDown()
  }
  public moveWindowUp(): void {
    this.windowHelper.moveWindowUp()
  }

  public setHasDebugged(value: boolean): void {
    this.hasDebugged = value
  }

  public getHasDebugged(): boolean {
    return this.hasDebugged
  }

  // Cleanup method
  public async cleanup(): Promise<void> {
    await this.audioHelper.cleanup()
    await this.ocrHelper.cleanup()
    this.cluelyAIHelper.clearHistory()
  }
}

// Application initialization
async function initializeApp() {
  const appState = AppState.getInstance()

  // Initialize IPC handlers before window creation
  initializeIpcHandlers(appState)

  app.whenReady().then(() => {
    appState.createWindow()
    // Register global shortcuts using ShortcutsHelper
    appState.shortcutsHelper.registerGlobalShortcuts()

    // Initialize auto-updater in production
    if (app.isPackaged) {
      initAutoUpdater()
    } else {
      console.log("Running in development mode - auto-updater disabled")
    }
  })

  app.on("activate", () => {
    if (appState.getMainWindow() === null) {
      appState.createWindow()
    }
  })

  // Quit when all windows are closed, except on macOS
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit()
    }
  })

  // Cleanup on app quit
  app.on("will-quit", async () => {
    await appState.cleanup()
  })

  app.dock?.hide() // Hide dock icon (optional)
  app.commandLine.appendSwitch("disable-background-timer-throttling")
}

// Start the application
initializeApp().catch(console.error)
