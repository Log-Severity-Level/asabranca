# Asa Branca

A crawler to grab Jira data from a GitHub file url.

## Usage

### GitHub File URL to Jira ID, Summary, Description and Comments

Use the command *npm-start* with two arguments:

- *inputPathFile*: a csv file with the github file urls.
  - format: *url*,*branch_name*
- *outputPathFile*: the file with the Jira details
  - format: *Issue ID,Issue Link,Summary,Summary Relevance,Description,Comments,File URL*

**Example**

```
  npm start data/input/hadoop-files.csv data/output/jira-details.csv
```

This operation comprises 2 steps:

- Step 1: Extract issue ID and link from a from a GitHub file URL
- Step 2: Using the Jira issue ID, extract Jira summary, description and comments

You have the option of using the steps separately, as follows.

### Only Step 1 - Issue ID and link

Use the command *npm run step1* with two arguments:

- *inputPathFile*: a csv file with the github file urls.
  - format: *url*,*branch_name*
- *outputPathFile*: the file path to record the jira issue data.
  - format: *Issue ID,Issue Link,URL*

**Example**

```
  npm run step1 data/input/hadoop-files.csv data/output/issues.csv
```

### Only Step 2 - Issue summary, description and comments

- *inputPathFile*: a csv file with the Jira IDs
  - format: *url*,*branch_name*
- *outputPathFile*: the file path to record the jira issue data.
  - format: *ID,Summary,Description,Comments*

**Example**
```
  npm run step2 data/input/hadoop-files.csv data/output/jira-details.csv
```
