import csvWriter from 'csv-writer';

export function createIssueDetailssWriter(outputPathFile) {
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

export function createIssueWritser(outputPathFile) {
  return csvWriter.createObjectCsvWriter({
      path: outputPathFile,  // Path to the output CSV file
      header: [
          { id: 'issue_id', title: 'Issue ID' },
          { id: 'issue_link', title: 'Issue Link' },
          { id: 'url', title: 'URL' },
      ],
  })
}

export function createFullReportWritesr(outputPathFile) {
  return csvWriter.createObjectCsvWriter({
      path: outputPathFile,  // Path to the output CSV file
      header: [
          { id: 'issue_id', title: 'Issue ID' },
          { id: 'issue_link', title: 'Issue Link' },
          { id: 'issue_summary', title: 'Summary' },
          { id: 'issue_summary_relevance', title: 'Summary Relevance' },
          { id: 'issue_description', title: 'Description' },
          { id: 'issue_comments', title: 'Comments' },
          { id: 'file_url', title: 'File URL' }
      ],
  })
}

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
export function createIssueWriter(outputPathFile) {
  return createCsvWriter(outputPathFile, ISSUE_HEADER);
}

const ISSUE_DETAILS_HEADER = [
  { id: 'id', title: 'ID' },
  { id: 'summary', title: 'Summary' },
  { id: 'description', title: 'Description' },
  { id: 'comments', title: 'Comments' }
];
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

export function createFullReportWriter(outputPathFile) {
  return createCsvWriter(outputPathFile, FULL_HEADER);
}





