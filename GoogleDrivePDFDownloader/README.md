# Enhanced Google Drive PDF Downloader

A userscript that lets you download PDF files from Google Drive that are otherwise protected against direct download. It captures the rendered page images and packages them into a single PDF file.

## How it works

Google Drive renders PDF pages as images in the browser. This script captures those images, stitches them together using [jsPDF](https://github.com/parallax/jsPDF), and saves the result as a downloadable PDF file. It automatically scrolls through the entire document to ensure every page is loaded before generating the PDF.

## Installation

You need a userscript manager installed in your browser. [Tampermonkey](https://www.tampermonkey.net/) is recommended and available for Chrome, Firefox, Edge, and Safari.

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or a compatible manager like Violentmonkey).
2. Open the raw script URL:
   ```
   https://github.com/nathanredblur/GreasyForkScripts/raw/main/GoogleDrivePDFDownloader/GoogleDrivePDFDownloader.user.js
   ```
3. Tampermonkey will detect the userscript and show an install prompt. Click **Install**.

The script activates automatically on any `drive.google.com` page.

## Usage

1. Open a PDF file in Google Drive (it must be open in the Drive viewer, not just listed in a folder).
2. **Set the zoom level to 200%** using the zoom controls at the bottom of the viewer. A higher zoom level results in higher image resolution in the final PDF.
3. Click the **Download PDF** button that appears in the top-right corner of the page.
4. The script will automatically scroll through the entire document to load all pages, then generate and download the PDF.

> The download button only appears when you are viewing a PDF in the Google Drive viewer.

## Notes

- The quality of the output PDF depends on the zoom level set in the viewer. **200% is recommended** for a good balance between file size and readability.
- Very long documents may take a minute or two to process. A progress indicator is shown throughout.
- The script uses the filename from the document metadata as the name for the downloaded PDF.
- Click the **i** button next to the download button to see usage tips at any time.

## Requirements

- A Chromium or Firefox based browser.
- Tampermonkey (or Violentmonkey / Greasemonkey).
- An active internet connection (the jsPDF library is loaded on demand from a CDN).

## License

MIT
