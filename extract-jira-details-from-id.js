import { processJiraUrls } from './src/jira.js';

const inputFilePath = process.argv[2];
const outputFilePath = process.argv[3];
processJiraUrls(inputFilePath, outputFilePath)
