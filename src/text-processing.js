import levelKeywordsPattern from './keywords.js';

/**
 * Remove noformat {noformat} formatting from text
 * @param {string} text 
 * @returns text without noformat formatting
 */
function removeNoFormat(text) {
  let noFormatPattern = /\{noformat\}/g;
  text = text.replace(noFormatPattern, '');
  return text;
}

/**
 * Remove images !image.png!
 * @param {string} text 
 * @returns text without images
 */
function removeImage(text) {
  let imagePattern = /!.*?!/g;
  text = text.replace(imagePattern, '');
  return text;
}

/**
 * Substitute file names with [file java] or [file txt]
 * @param {string} text 
 * @returns text without java and txt file names
 */
function removeFiles(text) {
  text = text.replace(/([\w-\/]+\.(java|txt))/g, '[file $2]');
  return text;
}

/**
 * Remove file indicators * (edit) [file java]
 * @param {string} text
 * @returns text without file indicators
 */
function removeFileIndicator(text) {
  text = text.replace(/^\* \(edit\) \[file java\]\s*$/gm, '');
  return text;
}

/**
 * Remove links as http://www.google.com
 * @param {string} text 
 * @returns text without links
 */
function removeLink(text) {
  let linkPattern2 = /http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/g;
  text = text.replace(linkPattern2, '[link]');
  return text;
}

/**
 * Remove links [link text|link location]
 * @param {string} text 
 * @returns text without confluency links
 */
function removeConfluencyLink(text) {
  let linkPattern = /\[.*?\|.*?\]|\[.*?\]/g;
  text = text.replace(linkPattern, '');
  return text;
}

/**
 * Remove macros with params like {align:right}
 * @param {string} text 
 * @returns text without macros
 */
function removeMacro(text) {
  let macroWithParamsPattern = /\{\w+:\w+\}|\{\w+:\w+\}/g;
  text = text.replace(macroWithParamsPattern, '');
  return text;
}

/**
 * Remove panels like {panel:title=My title}
 * @param {string} text 
 * @returns text without panels
 */
function removePanel(text) {
  let panelPattern = /\{panel.*\}|\{panel\}/g;
  text = text.replace(panelPattern, '');
  return text;
}

/**
 * Remove color formatting like {color:red}
 * @param {string} text 
 * @returns text without color formatting
 */
function removeColor(text) {
  let colorPattern = /\{color(:[\w#]+)?\}|\{color\}/g;
  text = text.replace(colorPattern, '');
  return text;
}

/**
 *  Remove empty lines
 * @param {string} text
 * @returns 
 */
function removeEmptyLines(text) {
  return text.replace(/^\s*[\r\n]/gm, '');
}
/**
 * Remove confluence formatting from text
 * @param {string} text 
 * @returns text without confluence formatting
 */
export function removeConfluenceSyntax(text) {
  
  text = removeNoFormat(text);
  text = removeColor(text);
  text = removePanel(text);
  text = removeMacro(text);
  text = removeConfluencyLink(text);
  text = removeLink(text);
  text = removeFiles(text);
  text = removeFileIndicator(text);
  text = removeImage(text);
  text = removeEmptyLines(text);

  return text;
}

/**
 * Filter text by keywords from keywords.js
 * If text contains any of the keywords, return text
 * Otherwise, return [Comment excluded]
 * @param {string} text 
 * @returns the text or [Comment excluded]
 */
export function filterText(text) {
  if (levelKeywordsPattern.test(text)) {
      return text;
  }
  return "[Comment excluded]";
}

/**
 * Format comment by removing confluence syntax and filtering by keywords
 * Each comment is separated by === Comment i ===
 * @param {string} comment 
 * @param {Number} i 
 * @returns the comment filtered and formatted
 */
export function formatComment(comment, i) {
  if (!comment || !comment.body) {
      return '';
  }

  let body = comment.body;
  body = removeConfluenceSyntax(body);
  body = filterText(body);
  
  body = "** Comment " + (i + 1) + " **\n" + body + "\n"
  
  return body;
}
