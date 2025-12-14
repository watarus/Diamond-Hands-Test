const { chromium } = require("playwright");
const PptxGenJS = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

async function htmlToPptx() {
  const slideFiles = [
    "slide1-title.html",
    "slide2-overview.html",
    "slide3-onchain.html",
    "slide4-ai.html",
    "slide5-miniapp.html",
    "slide6-techstack.html",
    "slide7-demo.html",
  ];

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "16x9", width: 10, height: 5.625 });
  pptx.layout = "16x9";
  pptx.title = "Diamond Hands Test - Base Mini App Hackathon";
  pptx.author = "watarus";

  const WIDTH = 1920;
  const HEIGHT = 1080;

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  for (const slideFile of slideFiles) {
    const page = await context.newPage();
    const filePath = path.join(__dirname, slideFile);
    await page.goto(`file://${filePath}`);
    await page.waitForTimeout(500);

    const screenshotBuffer = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });

    const base64 = screenshotBuffer.toString("base64");
    const slide = pptx.addSlide();
    slide.addImage({
      data: `data:image/png;base64,${base64}`,
      x: 0,
      y: 0,
      w: 10,
      h: 5.625,
    });

    await page.close();
    console.log(`Converted: ${slideFile}`);
  }

  await browser.close();

  const outputPath = path.join(__dirname, "DiamondHandsTest.pptx");
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPPTX saved to: ${outputPath}`);
}

htmlToPptx().catch(console.error);
