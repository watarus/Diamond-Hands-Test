const { chromium } = require("playwright");
const { google } = require("googleapis");
const { put, del } = require("@vercel/blob");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

// Configuration
const PRESENTATION_ID = "1Q3ixP0sp9yPqF6uIggMa6dfyovZqmZJUfjGPSVCLp0w";
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || "./google-credentials.json";

// HTMLファイル → Google Slideの位置（1-indexed）
// スライド5は動画なのでスキップ
const slideMapping = [
  { file: "slide1-title.html", googleSlideIndex: 1 },
  { file: "slide8-author.html", googleSlideIndex: 2 },
  { file: "slide2-overview.html", googleSlideIndex: 3 },
  { file: "slide-demo.html", googleSlideIndex: 4 },
  // Google Slide 5 = 動画（手動追加、スキップ）
  { file: "slide3-onchain.html", googleSlideIndex: 6 },
  { file: "slide4-ai.html", googleSlideIndex: 7 },
  { file: "slide5-miniapp.html", googleSlideIndex: 8 },
  { file: "slide6-techstack.html", googleSlideIndex: 9 },
  { file: "slide7-demo.html", googleSlideIndex: 10 },
];

async function getAuthClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/presentations",
      "https://www.googleapis.com/auth/drive",
    ],
  });
  return auth.getClient();
}

async function captureSlides() {
  console.log("Capturing HTML slides...");
  const WIDTH = 1920;
  const HEIGHT = 1080;

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  const images = [];
  for (const mapping of slideMapping) {
    const page = await context.newPage();
    const filePath = path.join(__dirname, mapping.file);
    await page.goto(`file://${filePath}`);
    await page.waitForTimeout(500);

    const buffer = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });

    images.push({ buffer, googleSlideIndex: mapping.googleSlideIndex });
    await page.close();
    console.log(`  Captured: ${mapping.file} -> Slide ${mapping.googleSlideIndex}`);
  }

  await browser.close();
  return images;
}

async function uploadToBlob(buffer, filename) {
  // Upload to Vercel Blob
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: "image/png",
  });

  console.log(`  Uploaded: ${filename} -> ${blob.url}`);
  return { url: blob.url };
}

async function getSlideIds(authClient) {
  const slides = google.slides({ version: "v1", auth: authClient });
  const presentation = await slides.presentations.get({
    presentationId: PRESENTATION_ID,
  });

  return presentation.data.slides.map((slide) => ({
    slideId: slide.objectId,
    // Find the image element on each slide
    imageId: slide.pageElements?.find(
      (el) => el.image || el.shape
    )?.objectId,
  }));
}

async function createSlideAtIndex(authClient, insertionIndex) {
  const slides = google.slides({ version: "v1", auth: authClient });
  const newSlideId = `new_slide_${Date.now()}`;

  const requests = [{
    createSlide: {
      objectId: newSlideId,
      insertionIndex: insertionIndex, // 0-indexed
    },
  }];

  await slides.presentations.batchUpdate({
    presentationId: PRESENTATION_ID,
    requestBody: { requests },
  });

  console.log(`  Created new slide at position ${insertionIndex + 1}`);
  return newSlideId;
}

async function updateSlideImage(authClient, slideId, imageUrl) {
  const slides = google.slides({ version: "v1", auth: authClient });

  // Delete all existing elements and add new image
  const presentation = await slides.presentations.get({
    presentationId: PRESENTATION_ID,
  });

  const slide = presentation.data.slides.find((s) => s.objectId === slideId);
  const elementsToDelete = slide.pageElements?.map((el) => el.objectId) || [];

  const requests = [];

  // Delete existing elements
  for (const elementId of elementsToDelete) {
    requests.push({
      deleteObject: { objectId: elementId },
    });
  }

  // Add new image covering the full slide
  const newImageId = `image_${slideId}_${Date.now()}`;
  requests.push({
    createImage: {
      objectId: newImageId,
      url: imageUrl,
      elementProperties: {
        pageObjectId: slideId,
        size: {
          width: { magnitude: 720, unit: "PT" },
          height: { magnitude: 405, unit: "PT" },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 0,
          translateY: 0,
          unit: "PT",
        },
      },
    },
  });

  await slides.presentations.batchUpdate({
    presentationId: PRESENTATION_ID,
    requestBody: { requests },
  });
}

async function main() {
  try {
    // Check credentials
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error(`
Error: Google credentials not found at ${CREDENTIALS_PATH}

Setup instructions:
1. Go to https://console.cloud.google.com/
2. Create a project (or select existing)
3. Enable "Google Slides API" and "Google Drive API"
4. Go to "Credentials" -> "Create Credentials" -> "Service Account"
5. Create key (JSON) and download
6. Save as ./google-credentials.json (or set GOOGLE_CREDENTIALS_PATH env var)
7. Share the Google Slides with the service account email (edit permission)
`);
      process.exit(1);
    }

    console.log("Authenticating with Google...");
    const authClient = await getAuthClient();

    // Capture slides
    const images = await captureSlides();

    // Get existing slide IDs
    console.log("\nGetting slide structure...");
    let slideInfo = await getSlideIds(authClient);
    console.log(`  Found ${slideInfo.length} slides`);

    // Find max required slide index
    const maxRequired = Math.max(...images.map(img => img.googleSlideIndex));

    // Create missing slides if needed
    if (slideInfo.length < maxRequired) {
      const needed = maxRequired - slideInfo.length;
      console.log(`\nCreating ${needed} new slide(s)...`);
      for (let i = 0; i < needed; i++) {
        await createSlideAtIndex(authClient, slideInfo.length + i);
      }
      // Refresh slide info
      slideInfo = await getSlideIds(authClient);
      console.log(`  Now have ${slideInfo.length} slides`);
    }

    // Upload images to Vercel Blob
    console.log("\nUploading images to Vercel Blob...");
    const uploadedImages = [];
    for (let i = 0; i < images.length; i++) {
      const uploaded = await uploadToBlob(
        images[i].buffer,
        `slides/slide${images[i].googleSlideIndex}_${Date.now()}.png`
      );
      uploadedImages.push({ ...uploaded, googleSlideIndex: images[i].googleSlideIndex });
    }

    // Update each slide (using googleSlideIndex mapping)
    console.log("\nUpdating Google Slides...");
    for (const uploaded of uploadedImages) {
      const slideIndex = uploaded.googleSlideIndex - 1; // 0-indexed
      if (slideIndex < slideInfo.length) {
        await updateSlideImage(
          authClient,
          slideInfo[slideIndex].slideId,
          uploaded.url
        );
        console.log(`  Updated slide ${uploaded.googleSlideIndex}`);
      } else {
        console.log(`  Skipped slide ${uploaded.googleSlideIndex} (not found)`);
      }
    }

    // Cleanup: Delete uploaded blobs
    console.log("\nCleaning up Vercel Blob storage...");
    for (const uploaded of uploadedImages) {
      await del(uploaded.url);
    }
    console.log(`  Deleted ${uploadedImages.length} images`);

    console.log("\nDone! Google Slides updated.");
    console.log(`View at: https://docs.google.com/presentation/d/${PRESENTATION_ID}/edit`);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response?.data) {
      console.error("Details:", JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
