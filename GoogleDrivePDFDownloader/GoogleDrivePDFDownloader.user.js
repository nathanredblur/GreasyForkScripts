// ==UserScript==
// @name         Enhanced Google Drive PDF Downloader
// @namespace    GoogleDrivePDFDownloader
// @version      8
// @description  Download protected PDF files from Google Drive. Auto-sets zoom to 200% and scrolls all pages.
// @author       nathanredblur
// @match        https://drive.google.com/*
// @grant        none
// @homepage     https://nathanredblur.dev
// @supportURL   https://github.com/nathanredblur/nathanredblur/issues
// @updateURL    https://github.com/nathanredblur/GreasyForkScripts/raw/main/GoogleDrivePDFDownloader/GoogleDrivePDFDownloader.user.js
// @downloadURL  https://github.com/nathanredblur/GreasyForkScripts/raw/main/GoogleDrivePDFDownloader/GoogleDrivePDFDownloader.user.js
// @license      MIT
// ==/UserScript==

; (function () {
  "use strict"

  // ─── Constants ──────────────────────────────────────────────────────────────

  const CONFIG = {
    scrollStepPx: 600,
    scrollStepDelayMs: 350,
    imageLoadTimeoutMs: 10000,
    imageCheckIntervalMs: 100,
    postScrollWaitMs: 1200,
    jsPdfUrl: "https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js",
  }

  const COLORS = {
    primary: "#4285f4",
    hover: "#3367d6",
  }

  // ─── Logger ─────────────────────────────────────────────────────────────────

  const logger = {
    log(message, type = "info") {
      const ts = new Date().toLocaleTimeString()
      const fn = type === "error" ? console.error : console.log
      fn(`[PDF Downloader ${ts}] ${message}`)
    },
  }

  // ─── DOM Utilities ───────────────────────────────────────────────────────────

  const domUtils = {
    setHTML: (() => {
      if (window.trustedTypes && trustedTypes.createPolicy) {
        const policy = trustedTypes.createPolicy("pdfDownloaderHTMLPolicy", {
          createHTML: (html) => html,
        })
        return (el, html) => {
          el.innerHTML = policy.createHTML(html)
        }
      }
      return (el, html) => {
        el.innerHTML = html
      }
    })(),

    delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }

  // ─── Progress Indicator ──────────────────────────────────────────────────────

  const progressIndicator = {
    element: null,

    create() {
      const el = document.createElement("div")
      el.style.cssText = `
        position: fixed;
        top: 65px;
        right: 20px;
        z-index: 9999;
        padding: 8px 16px;
        background-color: ${COLORS.primary};
        color: white;
        border-radius: 4px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        min-height: 20px;
        transition: all 0.3s ease;
      `
      document.body.appendChild(el)
      this.element = el
    },

    show(message) {
      if (!this.element) this.create()
      this.element.style.display = "flex"
      this.element.style.opacity = "0"
      setTimeout(() => {
        this.element.style.opacity = "1"
        this.element.textContent = message
      }, 10)
      const container = document.querySelector("#pdfDownloadContainer")
      if (container) container.style.display = "none"
    },

    hide() {
      if (!this.element) return
      this.element.style.opacity = "0"
      setTimeout(() => {
        this.element.style.display = "none"
        const container = document.querySelector("#pdfDownloadContainer")
        if (container) {
          container.style.display = "flex"
          container.style.opacity = "1"
        }
      }, 300)
    },

    updateProgress(current, total, prefix = "Processing") {
      const pct = Math.floor((current / total) * 100)
      this.show(`${prefix}: ${pct}% (${current}/${total})`)
    },
  }

  // ─── PDF Library Loader ──────────────────────────────────────────────────────

  const pdfLibLoader = {
    loaded: false,

    load() {
      if (this.loaded) return Promise.resolve()

      return new Promise((resolve, reject) => {
        logger.log("Loading jsPDF library...")
        progressIndicator.show("Loading PDF library...")

        const script = document.createElement("script")
        const url = CONFIG.jsPdfUrl

        if (window.trustedTypes && trustedTypes.createPolicy) {
          const policy = trustedTypes.createPolicy("pdfDownloaderPolicy", {
            createScriptURL: (input) => input,
          })
          script.src = policy.createScriptURL(url)
        } else {
          script.src = url
        }

        script.onload = () => {
          logger.log("jsPDF loaded successfully")
          this.loaded = true
          resolve()
        }
        script.onerror = (err) => {
          logger.log("Failed to load jsPDF", "error")
          reject(err)
        }
        document.body.appendChild(script)
      })
    },
  }

  // ─── Image Utilities ─────────────────────────────────────────────────────────

  const imageUtils = {
    isGoogleDrivePdfImage: (img) =>
      img.src.startsWith("blob:https://drive.google.com/") &&
      img.naturalWidth > 0 &&
      img.naturalHeight > 0,

    getValidPages: () =>
      Array.from(document.getElementsByTagName("img")).filter(
        imageUtils.isGoogleDrivePdfImage,
      ),

    async toBase64(img) {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight)
      return canvas.toDataURL("image/png", 1.0)
    },
  }

  // ─── Zoom Manager ────────────────────────────────────────────────────────────

  const zoomManager = {
    async setZoom200() {
      const zoomInput = document.querySelector('[aria-label="Page zoom control"]')
      if (!zoomInput) {
        logger.log("Zoom control not found, skipping auto-zoom")
        return
      }

      const currentValue = (zoomInput.value || "").trim()
      if (currentValue === "200%") {
        logger.log("Already at 200% zoom")
        return
      }

      progressIndicator.show("Setting zoom to 200%...")
      logger.log(`Current zoom: ${currentValue}, changing to 200%`)

      // Open the dropdown
      zoomInput.click()
      await domUtils.delay(300)

      // Find and click the 200% option in the listbox
      const listbox = document.querySelector(
        '[role="listbox"][aria-label="Page zoom control"]',
      )
      if (listbox) {
        const option200 = Array.from(
          listbox.querySelectorAll('[role="option"]'),
        ).find((o) => o.textContent.trim() === "200%")

        if (option200) {
          option200.click()
          await domUtils.delay(600)
          logger.log("Zoom set to 200%")
          return
        }
      }

      // Fallback: type directly in the combobox
      zoomInput.focus()
      zoomInput.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      )
      await domUtils.delay(200)
      zoomInput.select?.()
      await domUtils.delay(100)
      for (const char of "200") {
        zoomInput.dispatchEvent(
          new KeyboardEvent("keypress", { key: char, bubbles: true }),
        )
      }
      zoomInput.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      )
      await domUtils.delay(600)
    },
  }

  // ─── Page Navigator ──────────────────────────────────────────────────────────
  //
  // Google Drive virtualizes pages using IntersectionObserver on the window
  // viewport. Setting scrollTop on <main> moves internal content but does not
  // trigger the observer. The reliable fix is to use Google Drive's own page
  // navigation input, which forces the viewer to render the target page.

  const pageNavigator = {
    getInput() {
      const group = document.querySelector('[aria-label*="Page number input container"]')
      return group?.querySelector("input") ?? group
    },

    getTotalPages() {
      const input = this.getInput()
      if (!input) return 0
      // aria-label format: "Page X of Y"
      const match = (input.getAttribute("aria-label") || "").match(/of (\d+)/)
      return match ? parseInt(match[1], 10) : 0
    },

    async goTo(pageNum) {
      const input = this.getInput()
      if (!input) return

      input.focus()
      input.click()
      await domUtils.delay(80)

      // Use the native HTMLInputElement setter so framework state syncs
      const nativeSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set
      if (nativeSetter) {
        nativeSetter.call(input, String(pageNum))
        input.dispatchEvent(new Event("input", { bubbles: true }))
      } else {
        input.value = String(pageNum)
      }

      await domUtils.delay(50)
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }),
      )
      input.dispatchEvent(
        new KeyboardEvent("keypress", { key: "Enter", keyCode: 13, bubbles: true }),
      )
      await domUtils.delay(CONFIG.scrollStepDelayMs)
    },
  }

  // ─── Scroll Manager ──────────────────────────────────────────────────────────

  const scrollManager = {
    // Wait until we have at least `minCount` fully-loaded blob images.
    // This handles two cases that a plain "pending images" check misses:
    //   1. The <img> element hasn't been added to the DOM yet.
    //   2. The blob URL hasn't been assigned yet.
    async waitForLoadedCount(minCount) {
      const deadline = Date.now() + CONFIG.imageLoadTimeoutMs
      while (Date.now() < deadline) {
        const loaded = imageUtils.getValidPages().length
        if (loaded >= minCount) return
        await domUtils.delay(CONFIG.imageCheckIntervalMs)
      }
      logger.log(`Timeout waiting for ${minCount} images (got ${imageUtils.getValidPages().length})`, "error")
    },

    async scrollAllPages() {
      const total = pageNavigator.getTotalPages()
      if (total === 0)
        throw new Error("Could not find the page navigation input.")

      logger.log(`Navigating ${total} pages one by one...`)

      for (let page = 1; page <= total; page++) {
        const pct = Math.floor((page / total) * 100)
        progressIndicator.show(`Loading pages... ${pct}% (${page}/${total})`)
        await pageNavigator.goTo(page)
        await this.waitForLoadedCount(page)
      }

      // Return to page 1 so images are collected in order
      await pageNavigator.goTo(1)
      await domUtils.delay(CONFIG.postScrollWaitMs)
      logger.log(`All pages loaded (${imageUtils.getValidPages().length}/${total})`)
    },
  }

  // ─── PDF Generator ───────────────────────────────────────────────────────────

  const pdfGenerator = {
    async generate(images) {
      logger.log(`Generating PDF from ${images.length} pages`)
      const { jsPDF } = window.jspdf
      let pdf = null

      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const orientation = img.naturalWidth > img.naturalHeight ? "l" : "p"

        if (!pdf) {
          pdf = new jsPDF({
            orientation,
            unit: "px",
            format: [img.naturalWidth, img.naturalHeight],
            hotfixes: ["px_scaling"],
          })
        } else {
          pdf.addPage([img.naturalWidth, img.naturalHeight], orientation)
        }

        progressIndicator.show(`Converting page ${i + 1}/${images.length}...`)
        const imgData = await imageUtils.toBase64(img)
        pdf.addImage(
          imgData,
          "PNG",
          0,
          0,
          img.naturalWidth,
          img.naturalHeight,
          "",
          "FAST",
        )

        progressIndicator.updateProgress(i + 1, images.length, "Converting")
        await domUtils.delay(50)
      }

      return pdf
    },
  }

  // ─── Download Controller ─────────────────────────────────────────────────────

  const downloadController = {
    setButtonState(disabled, text) {
      const button = document.querySelector("#pdfDownloadButton")
      if (!button) return
      button.disabled = disabled
      button.textContent = text
    },

    getFileName() {
      const name =
        document.querySelector('meta[itemprop="name"]')?.content || "download"
      return name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`
    },

    async run() {
      this.setButtonState(true, "Loading pages...")
      logger.log("Starting PDF download process...")

      try {
        progressIndicator.show("Initializing...")

        await zoomManager.setZoom200()
        await scrollManager.scrollAllPages()
        await pdfLibLoader.load()

        const pages = imageUtils.getValidPages()
        if (pages.length === 0)
          throw new Error(
            "No pages found. Make sure you are viewing a PDF in Google Drive.",
          )

        logger.log(`Found ${pages.length} pages, generating PDF...`)

        const pdf = await pdfGenerator.generate(pages)
        const fileName = this.getFileName()

        progressIndicator.show(`Saving ${fileName}...`)
        await pdf.save(fileName, { returnPromise: true })

        logger.log("PDF downloaded successfully!")
        progressIndicator.show("Download complete!")
        setTimeout(() => progressIndicator.hide(), 3000)
      } catch (error) {
        logger.log(`PDF generation failed: ${error.message}`, "error")
        progressIndicator.show(`Error: ${error.message}`)
        alert(`Failed to generate PDF: ${error.message}`)
      } finally {
        this.setButtonState(false, "Download PDF")
      }
    },
  }

  // ─── UI Builder ──────────────────────────────────────────────────────────────

  const ui = {
    createButton() {
      const button = document.createElement("button")
      button.id = "pdfDownloadButton"
      button.textContent = "Download PDF"
      button.style.cssText = `
        padding: 8px 16px;
        background-color: ${COLORS.primary};
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        height: 36px;
        display: flex;
        align-items: center;
        transition: all 0.3s ease;
        opacity: 1;
      `
      button.addEventListener("mouseover", () => {
        if (!button.disabled) button.style.backgroundColor = COLORS.hover
      })
      button.addEventListener("mouseout", () => {
        if (!button.disabled) button.style.backgroundColor = COLORS.primary
      })
      button.addEventListener("click", () => downloadController.run())
      return button
    },

    createTooltip() {
      const tooltip = document.createElement("div")
      tooltip.id = "pdfDownloadTooltip"
      tooltip.style.cssText = `
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background-color: #333;
        color: white;
        padding: 16px;
        border-radius: 4px;
        font-size: 13px;
        width: 280px;
        display: none;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: opacity 0.3s ease;
      `

      const instructions = document.createElement("div")
      domUtils.setHTML(
        instructions,
        `
        <div style="margin-bottom: 10px; font-weight: bold;">How to get best results:</div>
        <ol style="margin: 0; padding-left: 18px; line-height: 1.9; font-size: 12px;">
          <li>Set Google Drive zoom to <strong>200%</strong></li>
          <li>Click <strong>Download PDF</strong> — the script will auto-scroll and load all pages automatically</li>
        </ol>
        <div style="margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 12px; line-height: 1.5;">
          Higher zoom = higher image resolution in the final PDF.
        </div>
      `,
      )

      const footer = document.createElement("div")
      footer.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,0.1);
      `

      const trackText = document.createElement("span")
      trackText.textContent = "Track Issues "
      trackText.style.marginRight = "8px"

      const githubLink = document.createElement("a")
      githubLink.href = "https://github.com/nathanredblur/nathanredblur/issues"
      githubLink.target = "_blank"
      githubLink.style.cssText = `
        color: white;
        text-decoration: none;
        display: flex;
        align-items: center;
        transition: opacity 0.3s ease;
      `
      domUtils.setHTML(
        githubLink,
        `<svg height="20" width="20" viewBox="0 0 16 16" style="fill: white;">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
            0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
            -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
            .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
            -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0
            1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82
            1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01
            1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>`,
      )

      footer.appendChild(trackText)
      footer.appendChild(githubLink)
      tooltip.appendChild(instructions)
      tooltip.appendChild(footer)

      return tooltip
    },

    createInfoIcon(tooltip) {
      const icon = document.createElement("div")
      icon.id = "pdfInfoIcon"
      icon.textContent = "i"
      icon.style.cssText = `
        cursor: help;
        font-size: 16px;
        position: relative;
        width: 36px;
        height: 36px;
        background-color: ${COLORS.primary};
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: background-color 0.3s ease;
      `
      icon.appendChild(tooltip)
      this._bindTooltipEvents(icon, tooltip)
      return icon
    },

    _bindTooltipEvents(icon, tooltip) {
      let timer = null
      let isHovered = false

      const startTimer = () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          if (!isHovered) {
            tooltip.style.opacity = "0"
            setTimeout(() => (tooltip.style.display = "none"), 300)
            icon.style.backgroundColor = COLORS.primary
          }
        }, 60000)
      }

      tooltip.addEventListener("mouseenter", () => {
        isHovered = true
        clearTimeout(timer)
      })
      tooltip.addEventListener("mouseleave", () => {
        isHovered = false
        startTimer()
      })
      icon.addEventListener("mouseenter", () => {
        tooltip.style.display = "block"
        tooltip.style.opacity = "0"
        setTimeout(() => (tooltip.style.opacity = "1"), 10)
        icon.style.backgroundColor = COLORS.hover
        startTimer()
      })
      icon.addEventListener("mouseleave", () => {
        if (!isHovered) startTimer()
      })
    },

    addDownloadButton() {
      const container = document.createElement("div")
      container.id = "pdfDownloadContainer"
      container.style.cssText = `
        position: fixed;
        top: 65px;
        right: 20px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: opacity 0.3s ease;
      `

      const button = this.createButton()
      const tooltip = this.createTooltip()
      const infoIcon = this.createInfoIcon(tooltip)

      container.appendChild(button)
      container.appendChild(infoIcon)
      document.body.appendChild(container)
    },
  }

  // ─── Click-Outside Handler ────────────────────────────────────────────────────

  function setupClickOutside() {
    document.addEventListener("click", (event) => {
      const tooltip = document.querySelector("#pdfDownloadTooltip")
      const icon = document.querySelector("#pdfInfoIcon")
      if (
        tooltip &&
        icon &&
        !tooltip.contains(event.target) &&
        !icon.contains(event.target)
      ) {
        tooltip.style.opacity = "0"
        setTimeout(() => (tooltip.style.display = "none"), 300)
        icon.style.backgroundColor = COLORS.primary
      }
    })
  }

  // ─── Initialization ───────────────────────────────────────────────────────────

  function initialize() {
    logger.log("Initializing PDF downloader...")
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        ui.addDownloadButton()
        setupClickOutside()
      })
    } else {
      ui.addDownloadButton()
      setupClickOutside()
    }
  }

  initialize()
})()
