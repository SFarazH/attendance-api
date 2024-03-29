const express = require("express");
const puppeteer = require("puppeteer");
const serverless = require("serverless-http");
require("dotenv").config();
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});
app.get("/", (req, res) => {
  res.json({ message: "Welocome to Attendance API!" });
});

module.exports.handler = serverless(app);

const getCookies = async (username, password) => {
  const browser = await puppeteer.launch({
    // headless: false,
    args: [
      "--disable-setuid-sandox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executeablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTEABLE_PATH
        : puppeteer.executablePath(),
  });

  const page = await browser.newPage();
  await page.goto("https://rcoem.in");
  await page.locator("#j_username").fill(username);
  await page.locator("#password-1").fill(password);
  await page.locator(".btn.btn-primary.btn-block.customB.mt-3").click();
  await page.waitForNavigation();

  // error handling
  if (page.url().includes("failure=true")) {
    await browser.close();
    return "error";
  } else {
    const cookies = await page.cookies();
    const jSessionIdCookie = cookies.find(
      (cookie) => cookie.name === "JSESSIONID"
    );
    await browser.close();
    return jSessionIdCookie.value;
  }
};

const getData = async (cookies) => {
  const response = await axios.get(
    "https://rcoem.in/getSubjectOnChangeWithSemId1.json",
    {
      headers: {
        accept: "application/json",
        Cookie: `JSESSIONID=${cookies}`,
      },
    }
  );

  const jsonData = response.data;

  // console.log(jsonData);
  return jsonData;
};

app.get("/data", async (request, response) => {
  try {
    const { username, password } = request.query;
    if (!username || !password) {
      return response.status(400).send("Username and password are required");
    }
    const cookie = await getCookies(username, password);
    if (cookie === "error") {
      response.send("error");
    } else {
      data = await getData(cookie);
      response.send(data);
    }
  } catch (error) {
    console.error("Error occurred:", error);
    response.status(500).send("error is" + error);
  }
});
