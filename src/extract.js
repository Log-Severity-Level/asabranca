import puppeteer from 'puppeteer';
import fs from 'fs';
import csvWriter from 'csv-writer';
import Papa from 'papaparse';
import pLimit from 'p-limit';
import { processIssue } from '../src/jira.js';
import levelKeywordsPattern from '../src/keywords.js';

const CONCURRENCY_LIMIT = 1;  // Adjust this value according to your needs
const limit = pLimit(CONCURRENCY_LIMIT);

function createWriter(outputPathFile) {
    return csvWriter.createObjectCsvWriter({
        path: outputPathFile,  // Path to the output CSV file
        header: [
            { id: 'issue_id', title: 'Issue ID' },
            { id: 'issue_link', title: 'Issue Link' },
            { id: 'url', title: 'URL' },
        ],
    })
}

function createWriterAll(outputPathFile) {
    return csvWriter.createObjectCsvWriter({
        path: outputPathFile,  // Path to the output CSV file
        header: [
            { id: 'issue_id', title: 'Issue ID' },
            { id: 'issue_link', title: 'Issue Link' },
            { id: 'issue_summary', title: 'Summary' },
            { id: 'issue_summary_relevance', title: 'Summary Relevance' },
            { id: 'issue_description', title: 'Description' },
            { id: 'issue_comments', title: 'Comments' },
            { id: 'file_url', title: 'File URL' }
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
        console.error(`The 'a.issue-link' element for ${url} doens't exist:`, error);
        issueData = {
            link: "null",
            id: "null",
        }
    }

    await page.close();
    // console.log(issueData);
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
        step: function (results) {
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
                } else {
                    return {
                        url: url,
                        issue_link: "null",
                        issue_id: "null",
                    };

                }
            });
            tasks.push(task);
        },
        complete: async function () {
            // Wait for all tasks to complete
            const data = await Promise.all(tasks);
            await writer.writeRecords(data.filter(item => item !== null));
            await browser.close();
        }
    });
}

/**
 * This method processes a CSV file containing a list of URLs 
 * and extracts the Jira issue ID and link from each URL.
 * The extract data is written to a new CSV file.
 */
export async function processAll(inputFilePath, outputPathFile) {
    const file = fs.createReadStream(inputFilePath);
    const browser = await puppeteer.launch();
    const tasks = [];
    const writer = createWriterAll(outputPathFile);

    Papa.parse(file, {
        header: true,
        step: function (results) {
            const row = results.data;
            const url = row.url;

            const task = limit(async () => {
                const issueData = await extractJiraIssueFromFile(browser, url);

                if (issueData.id !== "null") {
                    const issueDetails = await processIssue(issueData.id);
                    
                    let issue_summary_relevance = "NO";
                    
                    if (issueDetails) {
                        if (levelKeywordsPattern.test(issueDetails.summary)) {
                            issue_summary_relevance = "YES";
                        }
    
                        return {
                            file_url: url,
                            issue_link: issueData.link,
                            issue_id: issueData.id,
                            issue_summary: issueDetails.summary,
                            issue_summary_relevance: issue_summary_relevance,
                            issue_description: issueDetails.description,
                            issue_comments: issueDetails.comments,
                        };
                    } else {
                        return {
                            file_url: url,
                            issue_link: issueData.link,
                            issue_id: issueData.id,
                            issue_summary: "null",
                            issue_summary_relevance: "null",
                            issue_description: "null",
                            issue_comments: "null",
                        };
                    }
                } else {
                    return {
                        file_url: url,
                        issue_link: "null",
                        issue_id: "null",
                        issue_summary: "null",
                        issue_summary_relevance: "null",
                        issue_description: "null",
                        issue_comments: "null",
                    };
                }

            });
            tasks.push(task);
        },
        complete: async function () {
            // Wait for all tasks to complete
            const data = await Promise.all(tasks);
            console.log("Total issues processed:" + data.length);
            await writer.writeRecords(data.filter(item => item !== null));
            await browser.close();
        }
    });
}