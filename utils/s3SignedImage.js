const { GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = require("../config/s3Client");
const dotenv = require("dotenv");
const { Bucket } = require("@google-cloud/storage");
dotenv.config();
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const EXPIRES_IN = Number(process.env.AWS_SIGNED_URL_EXPIRY);

const signedUrlCache = new Map();

// Check if object Exists in S3
async function s3ObjectExists(BUCKET_NAME, key) {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

async function getSignedImageUrl(objectKey) {
  const key = objectKey.split("/").slice(1).join("/");

  const cached = signedUrlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  // Existence Check in S3
  // const exists = await s3ObjectExists(BUCKET_NAME, key);
  // if (!exists) {
  //   return null;
  // }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: EXPIRES_IN,
  });

  signedUrlCache.set(key, {
    url: signedUrl,
    expiresAt: Date.now() + (EXPIRES_IN - 30) * 1000,
  });

  return signedUrl;
}

module.exports = { getSignedImageUrl };
