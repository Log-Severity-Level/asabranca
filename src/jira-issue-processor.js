import axios from 'axios';
import { formatComment } from './text-processing.js';
import { jiraHost } from './config.js';
import { logger } from './logger-service.js';

/**
 * This method extracts the Jira issue ID and link from a given URL.  
 * @param {string} url
 * @returns an object containing the Jira issue ID and link
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
        logger.info(`[INFO] The 'a.issue-link' element for ${url} doens't exist:`);
        issueData = {
            link: "null",
            id: "null",
        }
    }

    await page.close();
    return issueData;
}
/**
 * This method extracts the Jira issue ID and link from a given URL.
 * @param {string} key 
 * @returns an object containing the Jira issue ID and link from a given URL.
 */
async function getIssueDetails(key) {
    logger.debug(`ISSUE ID: ${jiraHost}/${key}`)
    const response = await axios.get(`${jiraHost}/${key}`).catch((error) => {
        logger.error("Error on issue " + key);
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

/**
 * This method extracts the comments from a given Jira issue ID.
 * @param {string} key 
 * @returns an array containing the comments from a given Jira issue ID.
 */
async function getComments(key) {
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

/**
 * This method extracts the Jira issue details (summary, description, comments)
 * from a given Jira issue ID.
 * @param {string} key
 * @returns an object containing the Jira issue details (summary, description, comments)
 */
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
