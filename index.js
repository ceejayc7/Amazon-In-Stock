const puppeteer = require("puppeteer");
const db = require("./db.json").offers;
const OFFER_LISTING = "https://www.amazon.com/gp/offer-listing";
const NEW_QUERY_PARAM = "f_new=true";
const { sendDiscordMessage } = require("./discord.js");

const delay = (timeout) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

const openPage = async (browser, url) => {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
  });
  await page.setDefaultNavigationTimeout(0);
  await page.goto(url, { waitUntil: "networkidle0" });
  return page;
};

const getPrices = async (page) =>
  await page.$$eval("span.olpOfferPrice", (elements) =>
    elements.map((element) =>
      Number(element.innerHTML.replace(/[^0-9.-]+/g, ""))
    )
  );

const isProductAvailable = async (page, site) => {
  try {
    const prices = await getPrices(page);
    for (const price of prices) {
      if (price <= site.maxPrice) {
        return true;
      }
    }
  } catch (err) {
    console.log(err);
  }

  return false;
};

const createPages = async (browser) => {
  for (const site of db) {
    const page = await openPage(
      browser,
      `${OFFER_LISTING}/${site.offerListing}?${NEW_QUERY_PARAM}`
    );
    site.page = page;
  }
};

const refreshPages = async () => {
  for (const site of db) {
    page = site.page;
    await page.reload({ waitUntil: "networkidle0" });
    const isAvailable = await isProductAvailable(page, site);
    if (isAvailable) {
      sendDiscordMessage(
        `${site.name} is in stock - ${OFFER_LISTING}/${site.offerListing}`
      );
    }
  }
};

const start = async () => {
  // debug
  // const browser = await puppeteer.launch({devtools: true});

  // UNIX
  // const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-extensions'], executablePath: '/usr/bin/chromium-browser'});

  // Windows headless
  const browser = await puppeteer.launch();

  await createPages(browser);

  while (true) {
    await refreshPages();
    await delay(60000);
  }
};

start();
