import { extractJiraIssuesFromGitUrlsToCsv } from "./src/extractor.js";

const inputFilePath = process.argv[2];
const outputFilePath = process.argv[3];

extractJiraIssuesFromGitUrlsToCsv(inputFilePath, outputFilePath);
