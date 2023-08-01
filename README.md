# Asa Branca

A crawler to grab Jira data (issue id and issue link) from a GitHub file url.

## Usage - Issue id and link

Use the command *npm-start* with two arguments:

- *inputPathFile*: a csv file with the github file urls.
- *outputPathFile*: the file path to record the jira issue data.

### Example

```
  npm start data/input/hadoop-files-temp.csv data/output/issues-temp.csv
```

## Usage - Issue summary, description and comments

```
  npm run jira data/input/hadoop-files-temp.csv data/output/issues-temp.csv
```
