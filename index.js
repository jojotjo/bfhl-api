import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const EMAIL = process.env.OFFICIAL_EMAIL;

// -- Utility functions --
const fibonacci = (n) => {
  if (typeof n !== "number" || n < 1 || !Number.isInteger(n)) {
    throw new Error("Invalid input: fibonacci requires a positive integer");
  }
  let res = [0, 1];
  for (let i = 2; i < n; i++) res.push(res[i - 1] + res[i - 2]);
  return n === 1 ? [0] : res.slice(0, n);
};

const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const hcfArray = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("Invalid input: hcf requires a non-empty array");
  }
  return arr.reduce((a, b) => gcd(a, b));
};

const lcm = (a, b) => (a * b) / gcd(a, b);
const lcmArray = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("Invalid input: lcm requires a non-empty array");
  }
  return arr.reduce((a, b) => lcm(a, b));
};

// -- Routes --
app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL,
  });
});

app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({
        is_success: false,
        error: "Request body is required",
      });
    }

    if ("fibonacci" in body) {
      return res.status(200).json({
        is_success: true,
        official_email: EMAIL,
        data: fibonacci(body.fibonacci),
      });
    }

    if ("prime" in body) {
      if (!Array.isArray(body.prime)) {
        return res.status(400).json({
          is_success: false,
          error: "prime must be an array",
        });
      }
      return res.status(200).json({
        is_success: true,
        official_email: EMAIL,
        data: body.prime.filter(isPrime),
      });
    }

    if ("lcm" in body) {
      return res.status(200).json({
        is_success: true,
        official_email: EMAIL,
        data: lcmArray(body.lcm),
      });
    }

    if ("hcf" in body) {
      return res.status(200).json({
        is_success: true,
        official_email: EMAIL,
        data: hcfArray(body.hcf),
      });
    }

    // -- Gemini AI --
    // if ("AI" in body) {
    //   if (typeof body.AI !== 'string' || body.AI.trim() === '') {
    //     return res.status(400).json({
    //       is_success: false,
    //       error: "AI must be a non-empty string"
    //     });
    //   }

    //   const apiKey = process.env.AI_API_KEY;

    //   // Use the working model directly
    //   const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    //   const response = await axios.post(url, {
    //     contents: [{
    //       parts: [{ text: body.AI }]
    //     }]
    //   });

    //   let answer = "Unknown";

    //   if (
    //     response.data &&
    //     response.data.candidates &&
    //     response.data.candidates.length > 0 &&
    //     response.data.candidates[0].content &&
    //     response.data.candidates[0].content.parts &&
    //     response.data.candidates[0].content.parts.length > 0
    //   ) {
    //     answer = response.data.candidates[0].content.parts[0].text
    //       .trim()
    //       .split(/\s+/)[0];
    //   }

    //   return res.status(200).json({
    //     is_success: true,
    //     official_email: EMAIL,
    //     data: answer,
    //   });
    // }

    // -- Gemini AI --
    if ("AI" in body) {
      if (typeof body.AI !== "string" || body.AI.trim() === "") {
        return res.status(400).json({
          is_success: false,
          error: "AI must be a non-empty string",
        });
      }

      const apiKey = process.env.AI_API_KEY;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      // Add instruction to get single-word answer
      const promptText = `${body.AI}\n\nProvide ONLY a single-word answer with no explanation, no punctuation, and no additional text.`;

      const response = await axios.post(url, {
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
      });

      let answer = "Unknown";

      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates.length > 0 &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts.length > 0
      ) {
        const fullText =
          response.data.candidates[0].content.parts[0].text.trim();
        console.log("Full AI Response:", fullText);

        // Remove any punctuation and get the first word
        answer = fullText.replace(/[.,!?;:\n]/g, "").split(/\s+/)[0];
      }

      return res.status(200).json({
        is_success: true,
        official_email: EMAIL,
        data: answer,
      });
    }

    return res.status(400).json({
      is_success: false,
      error: "Request must contain one of: fibonacci, prime, lcm, hcf, AI",
    });
  } catch (err) {
    console.error("Error:", err.response?.data?.error || err.message);
    return res.status(500).json({
      is_success: false,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));
