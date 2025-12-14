const { chromium } = require("playwright");
const { google } = require("googleapis");
const { put, del } = require("@vercel/blob");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

// Configuration
const PRESENTATION_ID = "1Q3ixP0sp9yPqF6uIggMa6dfyovZqmZJUfjGPSVCLp0w";
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || "./google-credentials.json";

const slideFiles = [
  "slide1-title.html",
  "slide8-author.html",
  "slide2-overview.html",
  "slide3-onchain.html",
  "slide4-ai.html",
  "slide5-miniapp.html",
  "slide6-techstack.html",
  "slide7-demo.html",
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
  for (const slideFile of slideFiles) {
    const page = await context.newPage();
    const filePath = path.join(__dirname, slideFile);
    await page.goto(`file://${filePath}`);
    await page.waitForTimeout(500);

    const buffer = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });

    images.push(buffer);
    await page.close();
    console.log(`  Captured: ${slideFile}`);
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

async function createNewSlides(authClient, count, afterSlideId) {
  const slides = google.slides({ version: "v1", auth: authClient });
  const newSlideIds = [];

  for (let i = 0; i < count; i++) {
    const newSlideId = `new_slide_${Date.now()}_${i}`;
    const requests = [{
      createSlide: {
        objectId: newSlideId,
        insertionIndex: afterSlideId ? undefined : i,
      },
    }];

    await slides.presentations.batchUpdate({
      presentationId: PRESENTATION_ID,
      requestBody: { requests },
    });

    newSlideIds.push(newSlideId);
    console.log(`  Created new slide ${i + 1}`);
  }

  return newSlideIds;
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

    // Create new slides if needed
    if (slideInfo.length < images.length) {
      const needed = images.length - slideInfo.length;
      console.log(`\nCreating ${needed} new slide(s)...`);
      await createNewSlides(authClient, needed);
      // Refresh slide info
      slideInfo = await getSlideIds(authClient);
    }

    // Upload images to Vercel Blob
    console.log("\nUploading images to Vercel Blob...");
    const uploadedImages = [];
    for (let i = 0; i < images.length; i++) {
      const uploaded = await uploadToBlob(
        images[i],
        `slides/slide${i + 1}_${Date.now()}.png`
      );
      uploadedImages.push(uploaded);
    }

    // Update each slide
    console.log("\nUpdating Google Slides...");
    for (let i = 0; i < images.length; i++) {
      await updateSlideImage(
        authClient,
        slideInfo[i].slideId,
        uploadedImages[i].url
      );
      console.log(`  Updated slide ${i + 1}`);
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
