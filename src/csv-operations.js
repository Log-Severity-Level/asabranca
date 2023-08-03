import csvWriter from 'csv-writer';

/**
 * This method creates a CSV writer for the given header.
 * @param {string} outputPathFile 
 * @param {object} header
 * @returns a CSV writer for the given header.
 */
function createCsvWriter(outputPathFile, header) {
  return csvWriter.createObjectCsvWriter({
      path: outputPathFile,
      header: header
  });
}

const ISSUE_HEADER = [
  { id: 'issue_id', title: 'Issue ID' },
  { id: 'issue_link', title: 'Issue Link' },
  { id: 'git_url', title: 'Git URL' }
];
/**
 * This method creates a CSV writer for the issue.
 *  * @param {string} outputPathFile
 * @returns a CSV writer for the issue.
 */
export function createIssueWriter(outputPathFile) {
  return createCsvWriter(outputPathFile, ISSUE_HEADER);
}

const ISSUE_DETAILS_HEADER = [
  { id: 'id', title: 'ID' },
  { id: 'summary', title: 'Summary' },
  { id: 'description', title: 'Description' },
  { id: 'comments', title: 'Comments' }
];
/**
 * This method creates a CSV writer for the issue details.
 * @param {string} outputPathFile
 * @returns a CSV writer for the issue details.
 */
export function createIssueDetailsWriter(outputPathFile) {
  return createCsvWriter(outputPathFile, ISSUE_DETAILS_HEADER);
}

const FULL_HEADER = [
  ...ISSUE_HEADER,
  { id: 'issue_summary', title: 'Summary' },
  { id: 'issue_summary_relevance', title: 'Summary Relevance' },
  { id: 'issue_description', title: 'Description' },
  { id: 'issue_comments', title: 'Comments' },
];
/**
 * This method creates a CSV writer for the full report.
 * @param {string} outputPathFile 
 * @returns 
 */
export function createFullReportWriter(outputPathFile) {
  return createCsvWriter(outputPathFile, FULL_HEADER);
}





