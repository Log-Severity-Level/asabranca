import axios from 'axios';
import csvWriter from 'csv-writer';
import Papa from 'papaparse';
import fs from 'fs'
import { removeConfluenceSyntax } from '../src/regular-expressions.js';
import levelKeywordsPattern from '../src/keywords.js';

import pLimit from 'p-limit';

const CONCURRENCY_LIMIT = 5;  // Adjust this value according to your needs
const limit = pLimit(CONCURRENCY_LIMIT);

const jiraHost = 'https://issues.apache.org/jira/rest/api/2/issue';  // Substitua pela URL da sua instância do JIRA

function createWriter(outputPathFile) {
    return csvWriter.createObjectCsvWriter({
        path: outputPathFile,  // Path to the output CSV file
        header: [
            { id: 'id', title: 'ID' },
            { id: 'summary', title: 'Summary' },
            { id: 'description', title: 'Description' },
            { id: 'comments', title: 'Comments' }
        ],
    })
}

function filterText(text) {
    if (levelKeywordsPattern.test(text)) {
        return text;
    }
    return "[Comment excluded]";
}

function formatComment(comment, i) {
    if (!comment || !comment.body) {
        return '';
    }

    let body = comment.body;
    body = removeConfluenceSyntax(body);
    body = filterText(body);
    if (i == 0) {
        body = "\n=== Comment " + (i + 1) + " ====\n" + body + "\n"
    } else {
        body = "=== Comment " + (i + 1) + " ====\n" + body + "\n"
    }

    return body;
}

async function getIssueDetails(key) {
    console.log(`${jiraHost}/${key}`);
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

export async function processIssue(key) {
    const issueDetails = await getIssueDetails(key);
    const comments = await getComments(key);

    return {
        ...issueDetails,
        comments: comments.join('\n'),
    };
}

async function processIssues(keys) {
    const data = [];
    for (const key of keys) {
        const issueData = await processIssue(key);
        data.push(issueData);
    }
    return data;
}

/**
 * This method processes a CSV file containing a list of URLs 
 * and extracts the Jira issue ID and link from each URL.
 * The extract data is written to a new CSV file.
*/
export async function processJiraUrls(inputFilePath, outputPathFile) {
    const file = fs.createReadStream(inputFilePath);
    const tasks = [];
    const writer = createWriter(outputPathFile);

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