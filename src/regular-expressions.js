// Description: Regular to remove color formatting from Jira comments
export function removeColor(text) {
  let colorPattern = /\{color(:\w+)?\}/g;
  let noColorText = text.replace(colorPattern, '');
  return noColorText;
}

export function removeConfluenceSyntax(text) {
  // Remove {noformat}
  let noFormatPattern = /\{noformat\}/g;
  text = text.replace(noFormatPattern, '');
  
  // Remove {color}
  let colorPattern = /\{color(:[\w#]+)?\}|\{color\}/g;
  text = text.replace(colorPattern, '');
  
  // Remove {panel}
  let panelPattern = /\{panel.*\}|\{panel\}/g;
  text = text.replace(panelPattern, '');

  // Remove macros with params like {align:right}
  let macroWithParamsPattern = /\{\w+:\w+\}|\{\w+:\w+\}/g;
  text = text.replace(macroWithParamsPattern, '');
  
  // Remove links [link text|link location]
  let linkPattern = /\[.*?\|.*?\]|\[.*?\]/g;
  text = text.replace(linkPattern, '');

  let linkPattern2 = /http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/g;
  text = text.replace(linkPattern2, '[link]');

  //Substitute file names with [file java] or [file txt]
  text = text.replace(/([\w-\/]+\.(java|txt))/g, '[file $2]');

  // Remove images !image.png!
  let imagePattern = /!.*?!/g;
  text = text.replace(imagePattern, '');

  // // Remove tables ||header 1|header 2||-|cell 2.1|cell 2.2||
  // let tablePattern = /\|\|.*?\|\|/g;
  // text = text.replace(tablePattern, '');

  return text;
}
