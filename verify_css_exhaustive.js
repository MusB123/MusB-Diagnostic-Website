const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

const cssFiles = getAllFiles('frontend/src').filter(file => file.endsWith('.css'));

const validPatterns = [
  /\/\*/, // Comment start
  /\*\//, // Comment end
  /grid-column/,
  /grid-row/,
  /linear-gradient/,
  /url\(/,
  /http/,
  /calc\(.*\//,
  /font:.*\/.*$/,
  /aspect-ratio:/
];

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('/')) {
      let isSus = true;
      for (const pattern of validPatterns) {
          if (pattern.test(line)) {
              isSus = false;
              break;
          }
      }
      if (isSus) {
        console.log(`SUSPICIOUS SLASH in ${file}:${index + 1}: ${line.trim()}`);
      }
    }
  });
});
