require("dotenv").config()
const { execSync } = require("child_process")

try {
  // Verify environment variables
  const requiredEnvVars = [
    "APPLE_ID",
    "APPLE_APP_SPECIFIC_PASSWORD",
    "APPLE_TEAM_ID"
  ]

  const missing = requiredEnvVars.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error("Missing required environment variables:", missing.join(", "))
    process.exit(1)
  }

  // Add platform check
  if (process.platform !== "darwin") {
    console.warn("Warning: Building for macOS on a non-macOS platform may fail")
  }

  // Run the build command with notarization settings
  execSync(
    "npm run clean && cross-env NODE_ENV=production tsc && vite build && electron-builder --mac",
    {
      stdio: "inherit",
      env: {
        ...process.env,
        CSC_IDENTITY_AUTO_DISCOVERY: "true",
        APPLE_ID: process.env.APPLE_ID,
        APPLE_APP_SPECIFIC_PASSWORD: process.env.APPLE_APP_SPECIFIC_PASSWORD,
        APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
        NOTARIZE: "true"
      }
    }
  )
} catch (error) {
  console.error("Build failed:", error)
  process.exit(1)
}
