import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const port = process.argv[2] || 8080
const baseUrl = `http://localhost:${port}`
const screenshotDir = 'screenshots'

const pages = [
  { path: '#/', name: '01-home', label: 'Home' },
  { path: '#/about', name: '02-about', label: 'About' },
  { path: '#/post/anime-blog-redesign', name: '03-post', label: 'Post detail' },
  { path: '#/tag/设计', name: '04-tag-filter', label: 'Tag filter' }
]

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true, channel: 'msedge' })
  } catch {
    try {
      return await chromium.launch({ headless: true })
    } catch {
      throw new Error('No browser found. Run: npx playwright install chromium')
    }
  }
}

async function main() {
  mkdirSync(screenshotDir, { recursive: true })

  const browser = await launchBrowser()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    deviceScaleFactor: 2
  })

  for (const item of pages) {
    const page = await context.newPage()
    const url = `${baseUrl}/${item.path}`
    console.log(`Capturing ${item.label}: ${url}`)
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `${screenshotDir}/${item.name}.png`, fullPage: false })
    await page.close()
  }

  const mobile = await context.newPage()
  await mobile.setViewportSize({ width: 390, height: 844 })
  await mobile.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' })
  await mobile.waitForTimeout(1200)
  await mobile.screenshot({ path: `${screenshotDir}/05-mobile.png`, fullPage: true })
  await mobile.close()

  await browser.close()
  console.log('Screenshots saved.')
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
