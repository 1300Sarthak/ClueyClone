// CluelyAIHelper.ts

import axios from "axios"
import { store } from "./store"

interface ConversationContext {
  audioTranscript: string
  screenContext: string
  recentQuestions: string[]
  currentSpeaker: "me" | "them" | "assistant"
}

interface AIResponse {
  type: "answer" | "definition" | "suggestion" | "followup" | "passive"
  content: string
  confidence: number
  action?: string
}

export class CluelyAIHelper {
  private conversationHistory: string[] = []
  private readonly maxHistoryLength: number = 50

  constructor() {}

  public async processContext(
    audioTranscript: string,
    screenContext: string,
    currentSpeaker: "me" | "them" | "assistant" = "them"
  ): Promise<AIResponse | null> {
    try {
      const apiKey = store.get("openaiApiKey")
      if (!apiKey) {
        console.error("OpenAI API key not set")
        return null
      }

      // Build conversation context
      const context: ConversationContext = {
        audioTranscript,
        screenContext,
        recentQuestions: this.extractRecentQuestions(),
        currentSpeaker
      }

      // Create the system prompt with Cluely instructions
      const systemPrompt = this.buildCluelySystemPrompt()
      
      // Create user message with current context
      const userMessage = this.buildUserMessage(context)

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          max_tokens: 1000,
          temperature: 0.3
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      )

      const aiResponse = response.data.choices[0].message.content
      
      // Parse the AI response to determine type and content
      const parsedResponse = this.parseAIResponse(aiResponse)
      
      // Add to conversation history
      this.addToHistory(`them: ${audioTranscript}`)
      if (parsedResponse) {
        this.addToHistory(`assistant: ${parsedResponse.content}`)
      }

      return parsedResponse
    } catch (error) {
      console.error("Error processing context with AI:", error)
      return null
    }
  }

  private buildCluelySystemPrompt(): string {
    return `You are an assistant called Cluely, developed and created by Cluely, whose sole purpose is to analyze and solve problems asked by the user or shown on the screen. Your responses must be specific, accurate, and actionable.

**General Guidelines:**
- NEVER use meta-phrases (e.g., "let me help you", "I can see that").
- NEVER summarize unless explicitly requested.
- NEVER provide unsolicited advice.
- NEVER refer to "screenshot" or "image" - refer to it as "the screen" if needed.
- ALWAYS be specific, detailed, and accurate.
- ALWAYS acknowledge uncertainty when present.
- ALWAYS use markdown formatting.
- **All math must be rendered using LaTeX**: use $...$ for in-line and $$...$$ for multi-line math. Dollar signs used for money must be escaped (e.g. \\$100).
- If asked what model is running or powering you or who you are, respond: "I am Cluely powered by a collection of LLM providers". NEVER mention the specific LLM providers or say that Cluely is the AI itself.
- If user intent is unclear — even with many visible elements — do NOT offer solutions or organizational suggestions. Only acknowledge ambiguity and offer a clearly labeled guess if appropriate.

**Technical Problems:**
- START IMMEDIATELY WITH THE SOLUTION CODE – ZERO INTRODUCTORY TEXT.
- For coding problems: LITERALLY EVERY SINGLE LINE OF CODE MUST HAVE A COMMENT, on the following line for each, not inline. NO LINE WITHOUT A COMMENT.
- For general technical concepts: START with direct answer immediately.
- After the solution, provide a detailed markdown section (ex. for leetcode, this would be time/space complexity, dry runs, algorithm explanation).

**Math Problems:**
- Start immediately with your confident answer if you know it.
- Show step-by-step reasoning with formulas and concepts used.
- **All math must be rendered using LaTeX**: use $...$ for in-line and $$...$$ for multi-line math. Dollar signs used for money must be escaped (e.g. \\$100).
- End with **FINAL ANSWER** in bold.
- Include a **DOUBLE-CHECK** section for verification.

**Multiple Choice Questions:**
- Start with the answer.
- Then explain:
- Why it's correct
- Why the other options are incorrect

**Emails/Messages:**
- Provide mainly the response if there is an email/message/ANYTHING else to respond to / text to generate, in a code block.
- Do NOT ask for clarification – draft a reasonable response.
- Format: \`\`\`
[Your email response here]
\`\`\`

**UI Navigation:**
- Provide EXTREMELY detailed step-by-step instructions with granular specificity.
- For each step, specify:
- Exact button/menu names (use quotes)
- Precise location ("top-right corner", "left sidebar", "bottom panel")
- Visual identifiers (icons, colors, relative position)
- What happens after each click
- Do NOT mention screenshots or offer further help.
- Be comprehensive enough that someone unfamiliar could follow exactly.

**Unclear or Empty Screen:**
- MUST START WITH EXACTLY: "I'm not sure what information you're looking for." (one sentence only)
- Draw a horizontal line: ---
- Provide a brief suggestion, explicitly stating "My guess is that you might want..."
- Keep the guess focused and specific.
- If intent is unclear — even with many elements — do NOT offer advice or solutions.
- It's CRITICAL you enter this mode when you are not 90%+ confident what the correct action is.

**Other Content:**
- If there is NO explicit user question or dialogue, and the screen shows any interface, treat it as **unclear intent**.
- Do NOT provide unsolicited instructions or advice.
- If intent is unclear:
- Start with EXACTLY: "I'm not sure what information you're looking for."
- Draw a horizontal line: ---
- Follow with: "My guess is that you might want [specific guess]."
- If content is clear (you are 90%+ confident it is clear):
- Start with the direct answer immediately.
- Provide detailed explanation using markdown formatting.
- Keep response focused and relevant to the specific question.

**Response Quality Requirements:**
- Be thorough and comprehensive in technical explanations.
- Ensure all instructions are unambiguous and actionable.
- Provide sufficient detail that responses are immediately useful.
- Maintain consistent formatting throughout.
- **You MUST NEVER just summarize what's on the screen** unless you are explicitly asked to

**Transcript Understanding:**
- "me": The user you are helping (your primary focus)
- "them": The other person in the conversation (not the user)
- "assistant": You (Cluely) - SEPARATE from the above two

Real transcripts have errors, unclear speech, and incomplete sentences. Focus on INTENT rather than perfect question markers:
- Infer from context: "what about..." "how did you..." "can you..." "tell me..." even if garbled
- Incomplete questions: "so the performance..." "and scaling wise..." "what's your approach to..."
- Implied questions: "I'm curious about X" "I'd love to hear about Y" "walk me through Z"

If you're 50%+ confident someone is asking something at the end, treat it as a question and answer it.`
  }

  private buildUserMessage(context: ConversationContext): string {
    const { audioTranscript, screenContext, recentQuestions, currentSpeaker } = context

    let message = `Current conversation context:

**Audio Transcript (${currentSpeaker}):**
${audioTranscript}

**Screen Context:**
${screenContext || "No screen context available"}

**Recent Questions/Context:**
${recentQuestions.length > 0 ? recentQuestions.join("\n") : "No recent questions"}

**Conversation History (last 10 exchanges):**
${this.conversationHistory.slice(-20).join("\n")}

Based on this context, provide the most appropriate response following the Cluely guidelines. If there's a question at the end of the audio transcript, answer it directly. If there's a term that needs definition, provide it. If there's an opportunity to advance the conversation, suggest follow-ups. If none of these apply, acknowledge passively.`

    return message
  }

  private parseAIResponse(response: string): AIResponse {
    // Determine response type based on content and structure
    const lowerResponse = response.toLowerCase()
    
    if (lowerResponse.includes("not sure what you need help with") || 
        lowerResponse.includes("passive mode")) {
      return {
        type: "passive",
        content: response,
        confidence: 0.8
      }
    }
    
    if (lowerResponse.includes("follow-up") || 
        lowerResponse.includes("suggest") ||
        lowerResponse.includes("ask")) {
      return {
        type: "followup",
        content: response,
        confidence: 0.9
      }
    }
    
    if (lowerResponse.includes("**") && 
        (lowerResponse.includes("is") || lowerResponse.includes("are")) &&
        lowerResponse.length < 200) {
      return {
        type: "definition",
        content: response,
        confidence: 0.9
      }
    }
    
    // Default to answer type
    return {
      type: "answer",
      content: response,
      confidence: 0.8
    }
  }

  private extractRecentQuestions(): string[] {
    // Extract questions from recent conversation history
    const questions: string[] = []
    const questionPatterns = [
      /\b(what|how|why|when|where|who|which|can|could|would|will|do|does|did|is|are|was|were)\b.*\?/gi,
      /\b(tell me about|explain|describe|walk me through|show me)\b/gi
    ]

    this.conversationHistory.slice(-10).forEach(entry => {
      questionPatterns.forEach(pattern => {
        const matches = entry.match(pattern)
        if (matches) {
          questions.push(...matches)
        }
      })
    })

    return questions.slice(-5) // Return last 5 questions
  }

  private addToHistory(entry: string): void {
    this.conversationHistory.push(entry)
    
    // Keep history within limits
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength)
    }
  }

  public getConversationHistory(): string[] {
    return [...this.conversationHistory]
  }

  public clearHistory(): void {
    this.conversationHistory = []
  }
} 