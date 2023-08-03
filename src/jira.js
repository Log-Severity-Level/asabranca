import axios from 'axios';
import csvWriter from 'csv-writer';
import Papa from 'papaparse';
import fs from 'fs'
import { formatComment } from './text-processing.js';
import levelKeywordsPattern from '../src/keywords.js';
import { jiraHost } from '../src/config.js';
import { createIssueDetailsWriter } from '../src/csvOperations.js';

import pLimit from 'p-limit';

const CONCURRENCY_LIMIT = 5;  // Adjust this value according to your needs
const limit = pLimit(CONCURRENCY_LIMIT);

/**
 * This method extracts the Jira issue ID and link from a given URL.  
 */
export async function extractJiraIssueFromFile(browser, url) {
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
        console.error(`[INFO] The 'a.issue-link' element for ${url} doens't exist:`);
        issueData = {
            link: "null",
            id: "null",
        }
    }

    await page.close();
    // console.log(issueData);
    return issueData;
}

async function getIssueDetails(key) {
    console.log(`${jiraHost}/${key}`)
    const response = await axios.get(`${jiraHost}/${key}`).catch((error) => {
        console.log("===== ERROR ===== on issue " + key);
        return {
            id: key,
            summary: "ERROR",
            description: "ERROR getting issue details",
        };
    });

    return {
        id: key,
        summary: response.data.fields.summary,
        description: response.data.fields.description,
    };
}

async function getComments(key) {
    // console.log(`${jiraHost}/${key}`)
    const response = await axios.get(`${jiraHost}/${key}/comment`);

    return response.data.comments.map(formatComment);
}

/**
 * Verify if the key is a valid Jira issue ID
 * @param {string} key 
 * @returns true if the key is an invalid Jira issue ID
 */
function invalidId(key) {
    return key.substring(0, 1) == "#";
}

export async function processIssue(key) {
    if (invalidId(key)) {
        return {
            id: key,
            summary: "null",
            description: "null",
            comments: "null",
        };
    }
    const issueDetails = await getIssueDetails(key);
    const comments = await getComments(key);

    return {
        ...issueDetails,
        comments: comments.join('\n'),
    };
}

/**
 * This method processes a CSV file containing a list of URLs 
 * and extracts the Jira issue ID and link from each URL.
 * The extract data is written to a new CSV file.
*/
export async function processJiraUrls(inputFilePath, outputPathFile) {
    const file = fs.createReadStream(inputFilePath);
    const tasks = [];
    const writer = createIssueDetailsWriter(outputPathFile);

    Papa.parse(file, {
        header: true,
        step: function (results) {
            const row = results.data;
            const jira_id = row["Issue ID"];

            const task = limit(async () => {
                if (jira_id !== "null") {
                    const issueData = await processIssue(jira_id);
                    if (issueData) {
                        if (levelKeywordsPattern.test(issueData.summary)) {
                            return {
                                id: issueData.id,
                                summary: issueData.summary,
                                description: issueData.description,
                                comments: issueData.comments,
                            };
                        } else {
                            return {
                                id: issueData.id,
                                summary: "Excluded issue",
                                description: "",
                                comments: "",
                            };
                        }
                    }
                } else {
                    return {
                        id: "null",
                        summary: "null",
                        description: "null",
                        comments: "null",
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
        }
    });
}