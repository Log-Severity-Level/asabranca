import puppeteer from 'puppeteer';
import fs from 'fs';
import Papa from 'papaparse';
import pLimit from 'p-limit';
import { extractJiraIssueFromFile, processIssue } from '../src/jira.js';
import levelKeywordsPattern from '../src/keywords.js';
import { createIssueWriter, createFullReportWriter } from '../src/csvOperations.js';

const CONCURRENCY_LIMIT = 1;  // Adjust this value according to your needs
const limit = pLimit(CONCURRENCY_LIMIT);

/**
 * This method processes a CSV file containing a list of URLs 
 * and extracts the Jira issue ID and link from each URL.
 * The extract data is written to a new CSV file.
 */
export async function processFileUrls(inputFilePath, outputPathFile) {
    const file = fs.createReadStream(inputFilePath);
    const browser = await puppeteer.launch();
    const tasks = [];
    const writer = createIssueWriter(outputPathFile);

    Papa.parse(file, {
        header: true,
        step: function (results) {
            const row = results.data;
            const url = row.git_url;

            const task = limit(async () => {
                const issueData = await extractJiraIssueFromFile(browser, url)
                                            .catch(error => { console.error(error); return null; })   
                if (issueData) {
                    return {
                        git_url: url,
                        issue_link: issueData.link,
                        issue_id: issueData.id,
                    };
                } else {
                    return {
                        git_url: url,
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
            console.log("Total git urls processed:" + data.length);
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
    const writer = createFullReportWriter(outputPathFile);

    Papa.parse(file, {
        header: true,
        step: function (results) {
            const row = results.data;
            const url = row.git_url;

            const task = limit(async () => {
                const issueData = await extractJiraIssueFromFile(browser, url)
                    .catch(error => { 
                        console.error(error); 
                        console.error("===> The header csv must be 'git_url'"); 
                        return null; })

                if (issueData.id !== "null") {
                    const issueDetails = await processIssue(issueData.id);

                    let issue_summary_relevance = "NO";

                    if (issueDetails) {
                        if (levelKeywordsPattern.test(issueDetails.summary)) {
                            issue_summary_relevance = "YES";
                        }

                        return {
                            git_url: url,
                            issue_link: issueData.link,
                            issue_id: issueData.id,
                            issue_summary: issueDetails.summary,
                            issue_summary_relevance: issue_summary_relevance,
                            issue_description: issueDetails.description,
                            issue_comments: issueDetails.comments,
                        };
                    } else {
                        return {
                            git_url: url,
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
                        git_url: url,
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