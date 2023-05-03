import puppeteer from 'puppeteer';

(async () => {
  // const browser = await puppeteer.launch();
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();

  await page.goto('https://issues.apache.org/jira/browse/HADOOP-10005');

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});

  // Type into search box
  // await page.type('.search-box__input', 'automate beyond recorder');

  // Wait and click on first result
  // const searchResultSelector = '.search-box__link';
  // await page.waitForSelector(searchResultSelector);
  // await page.click(searchResultSelector);

  // Locate the full title with a unique string
  const titleSelector = await page.waitForSelector(
    'h1#summary-val'
  );
  const fullTitle = await titleSelector.evaluate(el => el.textContent);

  // Locate the full title with a unique string
  const descriptionSelector = await page.waitForSelector(
    '#description-val .user-content-block p'
  );
  const fullDescription = await descriptionSelector.evaluate(el => el.textContent);

  
  
  // Print the full title
  console.log('The title of this jira issue is "%s".', fullTitle);
  console.log('The description of this jira issue is "%s".', fullDescription);

  await browser.close();
})();