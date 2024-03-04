const express = require("express");
const puppeteer = require("puppeteer");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

const getData = async (username, password) => {
  const browser = await puppeteer.launch({
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

app.get("/data", async (request, response) => {
  try {
    const { username, password } = request.query;
    // if (!username || !password) {
    //   return response.status(400).send("Username and password are required");
    // }
    const jSessionId = await getData(username, password);
    response.send(jSessionId);
  } catch (error) {
    console.error("Error occurred:", error);
    response.status(500).send(error);
  }
});
