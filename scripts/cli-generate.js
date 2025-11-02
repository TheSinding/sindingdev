#!/usr/bin/env node

const ResumeGenerator = require("./generate-resume-pdf")
const fs = require("fs").promises
const path = require("path")
const yaml = require("js-yaml")

/**
 * CLI tool for generating tailored resumes
 */

async function getAvailableConfigs() {
  try {
    const configsDir = path.join(__dirname, "configs")
    const files = await fs.readdir(configsDir)
    return files
      .filter((file) => file.endsWith(".yaml"))
      .map((file) => path.basename(file, ".yaml"))
      .sort()
  } catch (error) {
    return []
  }
}

async function loadConfig(configName) {
  const configPath = path.join(__dirname, "configs", `${configName}.yaml`)

  try {
    const fileContents = await fs.readFile(configPath, "utf8")
    return yaml.load(fileContents)
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Configuration file not found: ${configPath}`)
    }
    throw new Error(`Error reading configuration: ${error.message}`)
  }
}

async function listConfigs() {
  console.log("\n📋 Available Resume Configurations:\n")

  try {
    const configsDir = path.join(__dirname, "configs")
    const files = await fs.readdir(configsDir)
    const yamlFiles = files.filter((file) => file.endsWith(".yaml")).sort()

    if (yamlFiles.length === 0) {
      console.log("  No configuration files found in scripts/configs/")
      return
    }

    for (const file of yamlFiles) {
      const configName = path.basename(file, ".yaml")
      try {
        const config = await loadConfig(configName)

        // Main config info
        console.log(
          `🔧 ${configName.padEnd(12)} - ${
            config.jobTitle || "Custom configuration"
          }`
        )

        if (config.customizations?.companyName) {
          console.log(
            `   ${"Company:".padEnd(11)} ${config.customizations.companyName}`
          )
        }

        if (config.customizations?.keySkills) {
          console.log(
            `   ${"Focus:".padEnd(11)} ${config.customizations.keySkills}`
          )
        }

        if (config.filename) {
          console.log(`   ${"Output:".padEnd(11)} ${config.filename}`)
        }

        // Show highlight skills count if available
        if (config.customizations?.highlightSkills?.length) {
          console.log(
            `   ${"Highlights:".padEnd(11)} ${
              config.customizations.highlightSkills.length
            } skills emphasized`
          )
        }

        console.log("")
      } catch (error) {
        console.log(`❌ ${configName.padEnd(12)} - Error: ${error.message}`)
        console.log("")
      }
    }

    console.log(`💡 Usage: npm run generate-resume [config-name]`)
    console.log(`📝 Edit configs in: scripts/configs/`)
  } catch (error) {
    console.error("❌ Error listing configurations:", error.message)
  }
}

async function showHelp() {
  console.log(`
📄 Resume Generator CLI

Usage:
  npm run generate-resume [config-name]
  node scripts/cli-generate.js [config-name]

Available configurations:`)

  // Dynamically list available configs
  try {
    const configsDir = path.join(__dirname, "configs")
    const files = await fs.readdir(configsDir)
    const yamlFiles = files.filter((file) => file.endsWith(".yaml"))

    for (const file of yamlFiles) {
      const configName = path.basename(file, ".yaml")
      try {
        const config = await loadConfig(configName)
        console.log(
          `  ${configName.padEnd(12)} - ${
            config.jobTitle || "Custom configuration"
          }`
        )
      } catch (error) {
        console.log(`  ${configName.padEnd(12)} - (Error loading config)`)
      }
    }
  } catch (error) {
    console.log("  (Unable to scan config directory)")
  }

  console.log(`
Examples:
  npm run generate-resume lego
  npm run generate-resume frontend
  node scripts/cli-generate.js startup

Options:
  --help      Show this help message
  --list      List available configurations with details

Configuration files are stored in scripts/configs/ as YAML files.
You can edit them directly or create new ones following the same format.
`)
}

async function main() {
  const args = process.argv.slice(2)

  // Handle help and list options
  if (args.includes("--help") || args.includes("-h")) {
    await showHelp()
    return
  }

  if (args.includes("--list") || args.includes("-l")) {
    await listConfigs()
    return
  }

  // Get configuration name - handle both --config flag and direct argument
  let configName

  const configIndex = args.indexOf("--config")
  if (configIndex !== -1 && args[configIndex + 1]) {
    configName = args[configIndex + 1]
  } else {
    // Use first argument that doesn't start with --
    configName = args.find((arg) => !arg.startsWith("--"))
  }

  if (!configName) {
    console.log("❌ Please specify a configuration name.")
    console.log("Run with --help to see available options.")
    process.exit(1)
  }

  // Load the configuration
  let config
  try {
    config = await loadConfig(configName)
  } catch (error) {
    console.log(`❌ ${error.message}`)

    // Show available configs dynamically
    const availableConfigs = await getAvailableConfigs()
    if (availableConfigs.length > 0) {
      console.log("\n📋 Available configurations:")
      availableConfigs.forEach((name) => {
        console.log(`  - ${name}`)
      })
      console.log("\n💡 Use --list for detailed information about each config")
    } else {
      console.log("\n❌ No configuration files found in scripts/configs/")
      console.log(
        "💡 Create a .yaml config file first, or check the configs directory"
      )
    }
    process.exit(1)
  }

  // Generate the resume
  const generator = new ResumeGenerator()

  try {
    console.log(`🔧 Generating resume for: ${config.jobTitle || configName}`)
    if (config.customizations?.companyName) {
      console.log(`🏢 Company: ${config.customizations.companyName}`)
    }

    const outputPath = await generator.generateTailoredResume(config)

    console.log(`\n🎉 Successfully generated tailored resume!`)
    console.log(`📁 Location: ${outputPath}`)
    console.log(
      `\n💡 Tip: Review the PDF to ensure all customizations look correct.`
    )
  } catch (error) {
    console.error(`❌ Error generating resume: ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { loadConfig, getAvailableConfigs, showHelp, listConfigs }
