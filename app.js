const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

const getData = async (username, password) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://rcoem.in");
  await page.locator("#j_username").fill(username);
  await page.locator("#password-1").fill(password);
  await page.locator(".btn.btn-primary.btn-block.customB.mt-3").click();
  await page.waitForNavigation();

  const cookies = await page.cookies();

  const jSessionIdCookie = cookies.find(
    (cookie) => cookie.name === "JSESSIONID"
  );

  if (jSessionIdCookie) {
    console.log("JSESSIONID cookie found:", jSessionIdCookie.value);
  } else {
    console.log("JSESSIONID cookie not found.");
  }

  await page.setCookie({
    name: "JSESSIONID",
    value: jSessionIdCookie.value,
    domain: "rcoem.in",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
  await page.goto("https://rcoem.in/getSubjectOnChangeWithSemId1.json?", {
    headers: {
      accept: "application/json",
    },
  });
  const jsonResponse = await page.evaluate(() => {
    return JSON.parse(document.body.innerText);
  });

  await browser.close();

  return jsonResponse;
};

app.get("/data", async (request, response) => {
  try {
    const { username, password } = request.query;
    // if (!username || !password) {
    //   return response.status(400).send("Username and password are required");
    // }
    const status = await getData("hasansf_1@rknec.edu", "f@r@z)&07");
    response.send(status);
  } catch (error) {
    console.error("Error occurred:", error);
    response.status(500).send(error);
  }
});
