const axios = require("axios");

exports.handler = async (event, context) => {
  const fileId = event.path.split("/").pop();
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return {
      statusCode: 200,
      headers: { "Content-Type": response.headers["content-type"] },
      body: response.data.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("Proxy error:", error);
    return { statusCode: 500, body: "Failed to proxy image" };
  }
};