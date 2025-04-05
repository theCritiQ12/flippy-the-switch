const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

const CACHE_FILE = path.join("/tmp", "meme-cache.json");
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function isCacheFresh() {
  try {
    const stats = await fs.stat(CACHE_FILE);
    return Date.now() - stats.mtimeMs < CACHE_DURATION;
  } catch (error) {
    return false;
  }
}

async function readCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

async function writeCache(data) {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(data), "utf8");
  } catch (error) {
    console.error("Error writing cache:", error);
  }
}

exports.handler = async (event, context) => {
  const folderId = "1GHKyxFZ2B-OK5glkfgF0z9H9d4DijHW0"; // Replace with your folder ID
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;

  if (await isCacheFresh()) {
    const cachedImages = await readCache();
    if (cachedImages) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cachedImages),
      };
    }
  }

  try {
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType)&key=${apiKey}`
    );
    const images = response.data.files
      .filter((file) => file.mimeType.startsWith("image/"))
      .map((file) => ({
        url: `https://drive.google.com/uc?export=view&id=${file.id}`,
        name: file.name,
      }));

    await writeCache(images);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(images),
    };
  } catch (error) {
    console.error("Error fetching images:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch memes" }),
    };
  }
};
