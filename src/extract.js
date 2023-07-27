import puppeteer from 'puppeteer';
import fs from 'fs';
import csvWriter from 'csv-writer';
import Papa from 'papaparse';
import pLimit from 'p-limit';

const CONCURRENCY_LIMIT = 1;  // Adjust this value according to your needs
const limit = pLimit(CONCURRENCY_LIMIT);

function createWriter(outputPathFile) {
  return csvWriter.createObjectCsvWriter({
    path: outputPathFile,  // Path to the output CSV file
    header: [
        {id: 'issue_id', title: 'Issue ID'},
        {id: 'issue_link', title: 'Issue Link'},
        {id: 'url', title: 'URL'},
    ],
  })
}

/**
 * This method extracts the Jira issue ID and link from a given URL.  
 */
async function extractJiraIssueFromFile(browser, url) {
  const page = await browser.newPage();

  await page.goto(url);

  let issueData = null;
  try {
      await page.waitForSelector('a.issue-link', { timeout: 3000 });

      issueData = await page.evaluate(() => {
          const link = document.querySelector('a.issue-link');
          return {
              link: link.href,
              id: link.textContent,
          };
      });
  } catch (error) {
      console.error("The 'a.issue-link' element doens't exist:", error);
      issueData = {
          link: "null",
          id: "null",
      }
  }

  await page.close();
  console.log(issueData);
  return issueData;
}

/**
 * This method processes a CSV file containing a list of URLs 
 * and extracts the Jira issue ID and link from each URL.
 * The extract data is written to a new CSV file.
 */
export async function processFileUrls(inputFilePath, outputPathFile) {
  const file = fs.createReadStream(inputFilePath);
  const browser = await puppeteer.launch();
  const tasks = [];
  const writer = createWriter(outputPathFile);

  Papa.parse(file, {
      header: true,
      step: function(results) {
          const row = results.data;
          const url = row.url;

          const task = limit(async () => {
            const issueData = await extractJiraIssueFromFile(browser, url);
            if (issueData) {
                return {
                    url: url,
                    issue_link: issueData.link,
                    issue_id: issueData.id,
                };
            }
            return null;
        });
        tasks.push(task);
      },
      complete: async function() {
          // Wait for all tasks to complete
          const data = await Promise.all(tasks);
          await writer.writeRecords(data.filter(item => item !== null));
          await browser.close();
      }
  });
}