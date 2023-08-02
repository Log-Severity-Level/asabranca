import { processFileUrls } from "./src/extract.js";

const inputFilePath = process.argv[2];
const outputFilePath = process.argv[3];

processFileUrls(inputFilePath, outputFilePath);
