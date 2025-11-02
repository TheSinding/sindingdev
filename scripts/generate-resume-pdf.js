#!/usr/bin/env node

const puppeteer = require("puppeteer")
const fs = require("fs").promises
const path = require("path")
const liveServer = require("live-server")

/**
 * Resume PDF Generator
 *
 * This script allows you to:
 * 1. Modify resume content programmatically
 * 2. Generate tailored PDFs for specific job applications
 * 3. Maintain your public HTML version separately
 */

class ResumeGenerator {
  constructor() {
    this.templatePath = path.join(__dirname, "../docs/index.html")
    this.outputDir = path.join(__dirname, "../generated-resumes")
    this.serverUrl = "http://localhost:8080"
  }

  /**
   * Start the live-server directly
   * @returns {Promise<void>}
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      console.log("🌐 Starting local server...")

      const params = {
        port: 8080,
        host: "localhost",
        root: path.join(__dirname, "../docs"),
        open: false,
        ignore: "scss,my/files,dist,*.txt",
        file: "index.html",
        wait: 1000,
        mount: [],
        logLevel: 0, // 0 = errors only, 1 = some, 2 = lots
        middleware: [
          function (req, res, next) {
            next()
          },
        ],
      }

      try {
        liveServer.start(params)
        console.log(`✅ Server running at ${this.serverUrl}`)
        // Give it a moment to fully initialize
        setTimeout(resolve, 2000)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Stop the live-server
   */
  async stopServer() {
    try {
      console.log("🛑 Stopping server...")
      liveServer.shutdown()
      // Give it a moment to shut down
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      // Server might already be stopped, that's ok
      console.log("Server already stopped or error stopping:", error.message)
    }
  }

  async init() {
    // Ensure output directory exists
    try {
      await fs.mkdir(this.outputDir, { recursive: true })
    } catch (err) {
      console.log("Output directory already exists or created")
    }
  }

  /**
   * Load the base HTML template
   */
  async loadTemplate() {
    try {
      const html = await fs.readFile(this.templatePath, "utf8")
      return html
    } catch (error) {
      throw new Error(`Failed to load template: ${error.message}`)
    }
  }

  /**
   * Apply customizations to the HTML content
   * @param {string} html - Original HTML content
   * @param {Object} customizations - Customization options
   */
  customizeContent(html, customizations = {}) {
    let modifiedHtml = html

    // Example customizations for job-specific tailoring
    if (customizations.companyName) {
      // Add company-specific objective
      const objectiveSection = `
        <section class="mb-4.5 break-inside-avoid">
          <header>
            <h3 class="text-lg font-bold text-terminal-cyan leading-snugish">
              Objective
            </h3>
          </header>
          <p class="mt-2.1">
            Seeking a Software Engineer position at ${
              customizations.companyName
            } where I can leverage my expertise in 
            ${
              customizations.keySkills ||
              "cloud infrastructure, full-stack development, and DevOps"
            } 
            to contribute to innovative projects and drive technical excellence.
          </p>
        </section>
      `

      // Insert after ABOUT ME section
      modifiedHtml = modifiedHtml.replace(
        /(# ABOUT ME[\s\S]*?<\/section>\s*<\/div>\s*<\/section>)/,
        `$1\n${objectiveSection}`
      )
    }

    // Highlight specific skills for the job
    if (customizations.highlightSkills) {
      customizations.highlightSkills.forEach((skill) => {
        const skillRegex = new RegExp(`(${skill})`, "gi")
        modifiedHtml = modifiedHtml.replace(
          skillRegex,
          `<strong class="text-terminal-yellow">$1</strong>`
        )
      })
    }

    // Add job-specific experience emphasis
    if (customizations.emphasizeExperience) {
      customizations.emphasizeExperience.forEach((emphasis) => {
        if (emphasis.company && emphasis.highlight) {
          const companyRegex = new RegExp(
            `(${emphasis.company}[\\s\\S]*?<p class="mt-2\\.1">)([\\s\\S]*?)(</p>)`,
            "i"
          )
          modifiedHtml = modifiedHtml.replace(
            companyRegex,
            (match, start, content, end) => {
              let emphasizedContent = content
              emphasis.highlight.forEach((term) => {
                const termRegex = new RegExp(`(${term})`, "gi")
                emphasizedContent = emphasizedContent.replace(
                  termRegex,
                  `<strong class="text-terminal-yellow">$1</strong>`
                )
              })
              return start + emphasizedContent + end
            }
          )
        }
      })
    }

    // Remove sections if specified
    if (customizations.removeSections) {
      customizations.removeSections.forEach((section) => {
        const sectionRegex = new RegExp(
          `<section[\\s\\S]*?# ${section}[\\s\\S]*?</section>`,
          "i"
        )
        modifiedHtml = modifiedHtml.replace(sectionRegex, "")
      })
    }

    // Add custom references if specified
    if (customizations.references) {
      const referencesSection = this.generateReferencesSection(
        customizations.references
      )

      // Replace the default references section
      const defaultReferencesRegex = new RegExp(
        `<section[\\s\\S]*?# REFERENCES[\\s\\S]*?</section>\\s*</div>\\s*</section>`,
        "i"
      )

      if (modifiedHtml.match(defaultReferencesRegex)) {
        modifiedHtml = modifiedHtml.replace(
          defaultReferencesRegex,
          referencesSection
        )
      } else {
        // If no references section exists, add it before the fork link
        const forkLinkRegex = /(<p>\s*Fork this resume at)/i
        modifiedHtml = modifiedHtml.replace(
          forkLinkRegex,
          `${referencesSection}\n\n        $1`
        )
      }
    }

    return modifiedHtml
  }

  /**
   * Generate HTML for references section based on configuration
   * @param {Object} references - References configuration
   * @returns {string} HTML for references section
   */
  generateReferencesSection(references) {
    let html = `
        <section class="mt-8 first:mt-0">
          <div class="break-inside-avoid">
            <h2
              class="mb-4 font-bold tracking-widest text-sm2 text-terminal-yellow italic print:font-normal"
            >
              # REFERENCES
            </h2>
    `

    // Process different reference types
    if (references.professional && references.professional.length > 0) {
      html += this.generateProfessionalReferences(references.professional)
    }

    if (references.portfolio && references.portfolio.length > 0) {
      html += this.generatePortfolioReferences(references.portfolio)
    }

    if (references.academic && references.academic.length > 0) {
      html += this.generateAcademicReferences(references.academic)
    }

    // Add default contact section if no specific contact info provided
    if (!references.hideContactSection) {
      html += `
            <section class="mb-4.5 break-inside-avoid">
              <header>
                <h3
                  class="text-lg font-bold text-terminal-cyan leading-snugish"
                >
                  Contact for References
                </h3>
              </header>
              <p class="leading-normal text-md text-terminal-white mt-2.1">
                Please feel free to reach out via email or LinkedIn to request
                additional references tailored to the role and responsibilities
                you're considering me for.
              </p>
            </section>
      `
    }

    html += `
          </div>
        </section>
    `

    return html
  }

  /**
   * Generate professional references section
   */
  generateProfessionalReferences(professionalRefs) {
    let html = `
            <section class="mb-4.5 break-inside-avoid">
              <header>
                <h3
                  class="text-lg font-bold text-terminal-cyan leading-snugish"
                >
                  Professional References
                </h3>
              </header>
    `

    professionalRefs.forEach((ref) => {
      if (ref.type === "person") {
        html += `
              <div class="mt-2.1 mb-3">
                <p class="leading-normal text-md text-terminal-white">
                  <strong class="text-terminal-cyan">${ref.name}</strong>
                  ${ref.title ? `<br />${ref.title}` : ""}
                  ${ref.company ? `<br />${ref.company}` : ""}
                  ${ref.email ? `<br />📧 ${ref.email}` : ""}
                  ${ref.phone ? `<br />📞 ${ref.phone}` : ""}
                  ${
                    ref.linkedin
                      ? `<br />🔗 <a href="${ref.linkedin}" class="main-link">${ref.linkedin}</a>`
                      : ""
                  }
                </p>
                ${
                  ref.note
                    ? `<p class="text-sm text-gray-600 mt-1">${ref.note}</p>`
                    : ""
                }
              </div>
        `
      } else if (ref.type === "available") {
        html += `
              <p class="leading-normal text-md text-terminal-white mt-2.1">
                ${
                  ref.message ||
                  "Professional references are available upon request. I can provide contacts from current and previous employers, colleagues, and project stakeholders who can speak to my technical abilities, work ethic, and collaborative skills."
                }
              </p>
        `
      }
    })

    html += `
            </section>
    `

    return html
  }

  /**
   * Generate portfolio references section
   */
  generatePortfolioReferences(portfolioRefs) {
    let html = `
            <section class="mb-4.5 break-inside-avoid">
              <header>
                <h3
                  class="text-lg font-bold text-terminal-cyan leading-snugish"
                >
                  Portfolio & Code Samples
                </h3>
              </header>
    `

    portfolioRefs.forEach((ref) => {
      if (ref.type === "page") {
        html += `
              <div class="mt-2.1">
                <p class="leading-normal text-md main-link">
                  <a href="${ref.url}" class="group" ${
          ref.url.startsWith("http") ? 'target="_blank"' : ""
        }>
                    ${ref.name}
                    <span
                      class="inline-block text-terminal-green print:text-black font-normal group-hover:text-terminal-white transition duration-100 ease-in"
                    >
                      ↗
                    </span>
                  </a>
                  ${ref.description ? ` - ${ref.description}` : ""}
                </p>
              </div>
        `
      } else if (ref.type === "github") {
        html += `
              <div class="mt-2.1">
                <p class="leading-normal text-md main-link">
                  <a href="${ref.url}" class="group" target="_blank">
                    📂 ${ref.name}
                    <span
                      class="inline-block text-terminal-green print:text-black font-normal group-hover:text-terminal-white transition duration-100 ease-in"
                    >
                      ↗
                    </span>
                  </a>
                  ${ref.description ? ` - ${ref.description}` : ""}
                  ${ref.stars ? ` (⭐ ${ref.stars} stars)` : ""}
                </p>
              </div>
        `
      }
    })

    html += `
            </section>
    `

    return html
  }

  /**
   * Generate academic references section
   */
  generateAcademicReferences(academicRefs) {
    let html = `
            <section class="mb-4.5 break-inside-avoid">
              <header>
                <h3
                  class="text-lg font-bold text-terminal-cyan leading-snugish"
                >
                  Academic References
                </h3>
              </header>
    `

    academicRefs.forEach((ref) => {
      if (ref.type === "person") {
        html += `
              <div class="mt-2.1 mb-3">
                <p class="leading-normal text-md text-terminal-white">
                  <strong class="text-terminal-cyan">${ref.name}</strong>
                  ${ref.title ? `<br />${ref.title}` : ""}
                  ${ref.institution ? `<br />${ref.institution}` : ""}
                  ${ref.email ? `<br />📧 ${ref.email}` : ""}
                  ${ref.phone ? `<br />📞 ${ref.phone}` : ""}
                </p>
                ${
                  ref.note
                    ? `<p class="text-sm text-gray-600 mt-1">${ref.note}</p>`
                    : ""
                }
              </div>
        `
      }
    })

    html += `
            </section>
    `

    return html
  }

  /**
   * Generate PDF by loading the actual webpage and applying customizations
   * @param {string} html - HTML content (for fallback)
   * @param {string} outputPath - Path for the generated PDF
   * @param {Object} customizations - Customizations to apply to the live page
   */
  async generatePDF(html, outputPath, customizations = {}) {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
      timeout: 60000,
    })

    try {
      const page = await browser.newPage()

      // Set a longer timeout for page operations
      page.setDefaultTimeout(30000)

      // Load the webpage from the live server
      console.log(`📖 Loading webpage: ${this.serverUrl}`)
      await page.goto(this.serverUrl, {
        waitUntil: "networkidle0",
        timeout: 30000,
      })

      // Apply customizations to the live page if provided
      if (customizations && Object.keys(customizations).length > 0) {
        console.log(`🎨 Applying customizations to live page...`)
        await this.applyCustomizationsToLivePage(page, customizations)
        // Wait for DOM changes to settle
      }

      // Emulate print media to trigger @media print styles
      console.log(`🖨️ Switching to print media...`)
      await page.emulateMediaType("print")

      // Override color-adjust to allow white background in print
      console.log(`🎨 Forcing white background for print...`)
      await page.addStyleTag({
        content: `
          @media print {
            * {
              color-adjust: auto !important;
              -webkit-print-color-adjust: auto !important;
              print-color-adjust: auto !important;
            }
            body, html, .page {
              background: white !important;
              background-color: white !important;
            }
            .bg-terminal-black, .bg-black {
              background: white !important;
              background-color: white !important;
            }
          }
        `,
      })

      // Wait for print styles to apply
      await page.waitForTimeout(1000)

      // Minimal PDF options - let CSS handle the rest
      const defaultOptions = {
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true, // Use CSS @page settings
        margin: { top: 0, right: 0, bottom: 0, left: 0 }, // Let CSS handle margins
        displayHeaderFooter: false,
      }

      const finalOptions = {
        ...defaultOptions,
        path: outputPath,
      }

      console.log(`🖨️ Generating PDF...`)
      await page.pdf(finalOptions)
      console.log(`✅ PDF generated: ${outputPath}`)
    } finally {
      await browser.close()
    }
  }

  /**
   * Apply customizations to the live page via JavaScript injection
   * @param {Object} page - Puppeteer page object
   * @param {Object} customizations - Customizations to apply
   */
  async applyCustomizationsToLivePage(page, customizations) {
    // Inject JavaScript to modify the live page
    await page.evaluate((customizations) => {
      // Helper function to safely find elements containing text
      function findElementContainingText(text, tag = "*") {
        const xpath = `//${tag}[contains(text(), '${text}')]`
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        )
        return result.singleNodeValue
      }

      // Highlight specific skills
      if (
        customizations.highlightSkills &&
        customizations.highlightSkills.length > 0
      ) {
        customizations.highlightSkills.forEach((skill) => {
          const regex = new RegExp(`\\b${skill}\\b`, "gi")

          // Walk through all text nodes
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
          )

          const textNodes = []
          let node
          while ((node = walker.nextNode())) {
            if (node.textContent.match(regex)) {
              textNodes.push(node)
            }
          }

          textNodes.forEach((textNode) => {
            const parent = textNode.parentNode
            const highlighted = textNode.textContent.replace(
              regex,
              `<strong class="text-terminal-yellow">$&</strong>`
            )
            const tempDiv = document.createElement("div")
            tempDiv.innerHTML = highlighted

            while (tempDiv.firstChild) {
              parent.insertBefore(tempDiv.firstChild, textNode)
            }
            parent.removeChild(textNode)
          })
        })
      }

      // Add company-specific objective/summary
      if (customizations.companyName) {
        const aboutSection = findElementContainingText("# ABOUT ME", "h2")
        if (aboutSection) {
          // Process custom objective with templating variables
          let objectiveText =
            customizations.customObjective ||
            `
            I'm excited about the {{jobTitle}} role at {{companyName}}. I'd love to bring my experience with 
            {{keySkills}} to help tackle challenges and contribute to the team's success.
          `

          function createRegexFromTemplate(template) {
            return new RegExp(`\\{\\{\\s*${template}\\s*\\}\\}`, "g")
          }

          // Replace template variables
          objectiveText = objectiveText
            .replace(
              createRegexFromTemplate("jobTitle"),
              customizations.jobTitle || "Software Engineer"
            )
            .replace(
              createRegexFromTemplate("companyName"),
              customizations.companyName
            )
            .replace(
              createRegexFromTemplate("keySkills"),
              customizations.keySkills ||
                "cloud infrastructure, full-stack development, and DevOps"
            )

          // Replace internal references variables
          if (customizations.references && customizations.references.internal) {
            customizations.references.internal.forEach((ref, index) => {
              objectiveText = objectiveText
                .replace(
                  createRegexFromTemplate(`internal.${index}.name`),
                  ref.name || ""
                )
                .replace(
                  createRegexFromTemplate(`internal.${index}.title`),
                  ref.title || ""
                )
                .replace(
                  createRegexFromTemplate(`internal.${index}.company`),
                  ref.company || ""
                )
            })
          }

          const objectiveHTML = `
            <section class="mb-4.5 break-inside-avoid">
              <header>
                <h3 class="text-lg font-bold text-terminal-cyan leading-snugish">
                  Why I'm applying to ${customizations.companyName}
                </h3>
              </header>
              <p class="mt-2.1">
                ${objectiveText.trim()}
              </p>
            </section>
          `

          const aboutParent = aboutSection.closest("section")
          if (aboutParent) {
            aboutParent.insertAdjacentHTML("afterend", objectiveHTML)
          }
        }
      }

      // Handle custom references if provided
      if (customizations.references) {
        const referencesSection = findElementContainingText(
          "# REFERENCES",
          "h2"
        )
        if (referencesSection) {
          const referencesContainer = referencesSection.closest("section")
          if (referencesContainer) {
            // Build new references HTML
            let newReferencesHTML = '<div class="break-inside-avoid">'
            newReferencesHTML +=
              '<h2 class="mb-4 font-bold tracking-widest text-sm2 text-terminal-yellow italic print:font-normal"># REFERENCES</h2>'

            // Add internal references section
            if (customizations.references.internal) {
              newReferencesHTML += '<section class="mb-4.5 break-inside-avoid">'
              newReferencesHTML += `<header><h3 class="text-lg font-bold text-terminal-cyan leading-snugish">References at ${customizations.companyName}</h3></header>`

              customizations.references.internal.forEach((ref) => {
                if (ref.type === "person") {
                  newReferencesHTML += `
                    <div class="mt-2.1 mb-3">
                      <p class="leading-normal text-md text-gray-650">
                        ${ref.name}
                        <span>
                          ${
                            ref.title
                              ? `<span class="text-position font-bold">| ${ref.title}</span>`
                              : ""
                          }
                          ${
                            ref.company
                              ? `<span class="text-position font-bold">at ${ref.company}</span>`
                              : ""
                          }
                         </span>
                        </p>
                        <p>
                          ${
                            ref.note
                              ? `<span class="text-sm text-gray-600 mb-2">${ref.note}</span>`
                              : ""
                          }
                        </p>
                        <p>
                        ${
                          ref.email
                            ? `<span class="text-terminal-black">📧 ${ref.email}</span>`
                            : ""
                        }
                      </p>
                      <p>
                        ${
                          ref.phone
                            ? `<span class="text-terminal-black">📞 ${ref.phone}</span>`
                            : ""
                        }
                      </p>
                      <p>
                        ${
                          ref.linkedin
                            ? `<span>🔗 <a href="${ref.linkedin}" class="main-link">${ref.linkedin}</a></span>`
                            : ""
                        }
                      </p>
                   
                    </div>
                  `
                } else if (ref.type === "available") {
                  newReferencesHTML += `<p class="leading-normal text-md text-terminal-white mt-2.1">${
                    ref.message ||
                    "Additional internal contacts are available upon request."
                  }</p>`
                }
              })

              newReferencesHTML += "</section>"
            }

            if (customizations.references.professional) {
              newReferencesHTML += '<section class="mb-4.5 break-inside-avoid">'
              newReferencesHTML +=
                '<header><h3 class="text-lg font-bold text-terminal-cyan leading-snugish">Professional References</h3></header>'

              customizations.references.professional.forEach((ref) => {
                if (ref.type === "person") {
                  newReferencesHTML += `
                    <div class="mt-2.1 mb-3">
                     <p class="leading-normal text-md text-gray-650">
                        ${ref.name}
                        <span>
                          ${
                            ref.title
                              ? `<span class="text-position font-bold">| ${ref.title}</span>`
                              : ""
                          }
                          ${
                            ref.company
                              ? `<span class="text-position font-bold">at ${ref.company}</span>`
                              : ""
                          }
                         </span>
                        </p>
                        <p>
                          ${
                            ref.note
                              ? `<span class="text-sm text-gray-600 mt-1">${ref.note}</span>`
                              : ""
                          }
                        </p>
                        <p>
                        ${
                          ref.email
                            ? `<span class="text-terminal-black">📧 ${ref.email}</span>`
                            : ""
                        }
                      </p>
                      <p>
                        ${
                          ref.phone
                            ? `<span class="text-terminal-black">📞 ${ref.phone}</span>`
                            : ""
                        }
                      </p>
                      <p>
                        ${
                          ref.linkedin
                            ? `<span>🔗 <a href="${ref.linkedin}" class="main-link">${ref.linkedin}</a></span>`
                            : ""
                        }
                      </p>
                   

                    </div>
                  `
                } else if (ref.type === "available") {
                  newReferencesHTML += `<p class="leading-normal text-md text-terminal-white mt-2.1">${
                    ref.message ||
                    "Professional references are available upon request."
                  }</p>`
                }
              })

              newReferencesHTML += "</section>"
            }

            if (customizations.references.portfolio) {
              newReferencesHTML += '<section class="mb-4.5 break-inside-avoid">'
              newReferencesHTML +=
                '<header><h3 class="text-lg font-bold text-terminal-cyan leading-snugish">Portfolio & Code Samples</h3></header>'

              customizations.references.portfolio.forEach((ref) => {
                if (ref.type === "github" || ref.type === "page") {
                  newReferencesHTML += `
                    <div class="mt-2.1">
                      <p class="leading-normal text-md main-link">
                        <a href="${ref.url}" class="group" target="_blank">
                          ${ref.type === "github" ? "📂 " : ""}${ref.name}
                          <span class="inline-block text-terminal-green print:text-black font-normal">↗</span>
                        </a>
                        ${ref.description ? ` - ${ref.description}` : ""}
                        ${ref.stars ? ` (⭐ ${ref.stars} stars)` : ""}
                      </p>
                    </div>
                  `
                }
              })

              newReferencesHTML += "</section>"
            }

            newReferencesHTML += "</div>"

            // Replace the existing references section
            referencesContainer.outerHTML = newReferencesHTML
          }
        }
      }
    }, customizations)

    console.log(`✨ Customizations applied to live page`)
  }

  /**
   * Generate a tailored resume PDF
   * @param {Object} config - Configuration for the tailored resume
   */
  async generateTailoredResume(config) {
    await this.init()

    try {
      // Start the local server
      await this.startServer()

      console.log("📄 Loading HTML template...")
      const html = await this.loadTemplate()

      console.log("🔧 Applying customizations...")
      // We still need the HTML for fallback, but we'll primarily use the webpage approach
      const customizedHtml = this.customizeContent(html, config.customizations)

      const timestamp = new Date().toISOString().slice(0, 10)
      const filename =
        config.filename ||
        `resume-${config.jobTitle || "tailored"}-${timestamp}.pdf`
      const outputPath = path.join(this.outputDir, filename)

      console.log("🚀 Launching browser and generating PDF...")
      // Generate PDF from the live webpage with customizations applied
      await this.generatePDF(customizedHtml, outputPath, config.customizations)

      return outputPath
    } catch (error) {
      console.error("💥 Detailed error information:")
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      throw error
    } finally {
      // Always stop the server, even if there was an error
      await this.stopServer()
    }
  }
}

// CLI interface
async function main() {
  const generator = new ResumeGenerator()

  // Example: Generate a LEGO-specific resume
  const legoConfig = {
    filename: "simon-sinding-resume-lego-cloud-engineer.pdf",
    jobTitle: "Cloud Engineer - LEGO",
    customizations: {
      companyName: "LEGO Group",
      keySkills:
        "cloud infrastructure, AWS, Node.js, and enterprise applications",
      highlightSkills: [
        "cloud",
        "AWS",
        "Node.js",
        "Kubernetes",
        "TypeScript",
        "API",
      ],
      emphasizeExperience: [
        {
          company: "Danfoss",
          highlight: [
            "cloud infrastructure",
            "enterprise monitoring",
            "supply chain",
            "API development",
          ],
        },
      ],
    },
    pdfOptions: {
      format: "A4",
      margin: { top: "0.4in", right: "0.4in", bottom: "0.4in", left: "0.4in" },
    },
  }

  try {
    const outputPath = await generator.generateTailoredResume(legoConfig)
    console.log(`🎉 Generated tailored resume: ${outputPath}`)
  } catch (error) {
    console.error("❌ Error generating resume:", error.message)
    process.exit(1)
  }
}

// Export for use as module
module.exports = ResumeGenerator

// Run if called directly
if (require.main === module) {
  main()
}
