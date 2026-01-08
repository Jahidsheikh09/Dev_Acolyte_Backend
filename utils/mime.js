const mime = require("mime-types");

function getContentTypeFromKey(objectKey) {
  return mime.lookup(objectKey) || "application/octet-stream";
}

function extractObjectKey(imageUrl) {
  const url = new URL(imageUrl);
  return decodeURIComponent(url.pathname.substring(1));
}

module.exports = { getContentTypeFromKey, extractObjectKey };
