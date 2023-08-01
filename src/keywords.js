const keywords = [
  ' fine',
  'trace',
  'debug',
  'info',
  'warn',
  'warning',
  'error',
  'fatal',
  'logging',
  ' log ',
  ' logs ',
  ' logger ',
  'log level',
  'severity level',
  'change level',
  'change severity',
  'slf4j',
  'log4j',
  'commons logging',
  'commons-logging',
  'logback',
  'noisy',
  'verbose',
  'spammy',
  'overload',
  'fail',
 
  // Add more keywords as needed
]
;

const levelKeywordsPattern = new RegExp(`(${keywords.join('|')})`, 'i');

export default levelKeywordsPattern;