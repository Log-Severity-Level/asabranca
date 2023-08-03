import puppeteer from 'puppeteer';
import fs from 'fs';
import Papa from 'papaparse';
import pLimit from 'p-limit';
import { extractJiraIssueFromFile, processIssue } from './jira-issue-processor.js';
import levelKeywordsPattern from './keywords.js';
import { createIssueWriter, createIssueDetailsWriter, createFullReportWriter } from './csv-operations.js';
import { logger } from './logger-service.js';

const CONCURRENCY_LIMIT = 5;  // Adjust this value according to your needs
const limit = pLimit(CONCURRENCY_LIMIT);
const NULL_VALUE = "null";
const NULL_ISSUE = {
    id: NULL_VALUE,
    summary: NULL_VALUE,
    description: NULL_VALUE,
    comments: NULL_VALUE,
};

/**
 * This method builds a record containing the Jira issue ID and link from a given Git file URL.
 * @param {string} url - the Git file URL
 * @param {object} issueData - an object containing the Jira issue ID and link
 */
function buildIssueRecord(url, issueData) {
    if (issueData) {
        return {
            git_url: url,
            issue_link: issueData.link,
            issue_id: issueData.id,
        };
    } else {
        return {
            git_url: url,
            issue_link: NULL_VALUE,
            issue_id: NULL_VALUE,
        };
    }
}

/**
 * This method builds a record containing the Jira issue details from a given Jira issue ID.
 * @param {object} issueData - an object containing the Jira issue ID and link
 * @returns 
 */
function buildIssueDetailsRecord(issueData) {
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
}

/**
 * This method builds a record containing the Jira issue details from a given Jira issue ID.
 * @param {string} url - the Git file URL
 * @param {object} issueData - an object containing the Jira issue ID and link
 * @param {object} issueDetails - an object containing the Jira issue details
 * @returns - an object containing the Jira issue details from a given Jira issue ID.
 */
function buildFullIssueRecord(url, issueData, issueDetails) {
    let issue_summary_relevance = "NO";
    
    // Check if issueData and issueDetails are provided
    if (issueData && issueDetails) {
        if (levelKeywordsPattern.test(issueDetails.summary)) {
            issue_summary_relevance = "YES";
        }
        
        return {
            git_url: url,
            issue_link: issueData.link,
            issue_id: issueData.id,
            issue_summary: issueDetails.summary,
            issue_summary_relevance,
            issue_description: issueDetails.description,
            issue_comments: issueDetails.comments,
        };
    }
    
    // Default object if any data is missing
    return {
        git_url: url,
        issue_link: issueData?.link ?? NULL_VALUE,
        issue_id: issueData?.id ?? NULL_VALUE,
        issue_summary: NULL_VALUE,
        issue_summary_relevance,
        issue_description: NULL_VALUE,
        issue_comments: NULL_VALUE,
    };
}

/**
 * Step 1 - Extract Jira issue ID and link from a given URL
 * This method processes a CSV file containing a list of URLs 
 * and extract Jira issue ID and link from the given URLs.
 * The extract data is written to a new CSV file.
 * @param {string} inputFilePath
 * @param {string} outputPathFile
 */
export async function extractJiraIssuesFromGitUrlsToCsv(inputFilePath, outputPathFile) {
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
                try {
                    const issueData = await extractJiraIssueFromFile(browser, url);
                    return buildIssueRecord(url, issueData);
                } catch (error) {
                    logger.error(`Failed to process ${url}:`);
                    logger.error(error);
                    return buildIssueRecord(url, null);
                }
            });
            tasks.push(task);
        },
        complete: async function () {
            // Wait for all tasks to complete
            const data = await Promise.all(tasks);
            logger.info("Total git urls processed:" + data.length);
            await writer.writeRecords(data.filter(item => item !== null));
            await browser.close();
        }
    });
}

/**
 * Step 2 - Extract Jira issue details from a given Jira issue ID
 * This method processes a CSV file containing a list of JiRA issue IDs
 * and extract Jira issue details (summary, description, comments) 
 * from the given Jira issue IDs
 * The extract data is written to a new CSV file.
 * @param {string} inputFilePath
 * @param {string} outputPathFile
*/
export async function extractJiraIssuesDetailsFromIdsToCsv(inputFilePath, outputPathFile) {
    const file = fs.createReadStream(inputFilePath);
    const tasks = [];
    const writer = createIssueDetailsWriter(outputPathFile);

    Papa.parse(file, {
        header: true,
        step: function (results) {
            const row = results.data;
            const jira_id = row["Issue ID"];

            const task = limit(async () => {
                if (jira_id !== NULL_VALUE) {
                    const issueData = await processIssue(jira_id);
                    return buildIssueDetailsRecord(issueData);
                } else {
                    return NULL_ISSUE;
                }
            });
            tasks.push(task);
        },
        complete: async function () {
            // Wait for all tasks to complete
            const data = await Promise.all(tasks);
            logger.info("Total issues processed:" + data.length);
            await writer.writeRecords(data.filter(item => item !== null));
        }
    });
}

/**
 * Full extraction
 * This method processes a CSV file containing a list of git file URLs
 * and extracts the Jira issue ID, link and details (summary, description, comments) from each URL.
 * The extract adds a new column to the CSV file informing 
 * if the issue summary is relevant or not for level severity adjustment
 * The extract data is written to a new CSV file.
 * @param {string} inputFilePath
 * @param {string} outputPathFile
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
                        logger.error(error);
                        logger.error('An error occurred!', { errorDetails: "The header csv must be 'git_url'" });
                        return null;
                    })

                if (issueData.id !== NULL_VALUE) {
                    const issueDetails = await processIssue(issueData.id);
                    return buildFullIssueRecord(url, issueData, issueDetails); 
                } else {
                    return buildFullIssueRecord(url, issueData, null);
                }

            });
            tasks.push(task);
        },
        complete: async function () {
            // Wait for all tasks to complete
            const data = await Promise.all(tasks);
            logger.info("Total issues processed:" + data.length);
            
            await writer.writeRecords(data.filter(item => item !== null));
            await browser.close();
        }
    });
}