var fs = require('fs');

function readHTML(htmlfile) {
  try {
    var htmltext = fs.readFileSync(htmlfile, 'utf-8')
    {
      return htmltext;
    }
  } catch (err) {
    console.error(err);
  }
  return htmltext;
}

module.exports = readHTML;