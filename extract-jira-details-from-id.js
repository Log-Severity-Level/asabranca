import { extractJiraIssuesDetailsFromIdsToCsv } from './src/extractor';

const inputFilePath = process.argv[2];
const outputFilePath = process.argv[3];
extractJiraIssuesDetailsFromIdsToCsv(inputFilePath, outputFilePath)
