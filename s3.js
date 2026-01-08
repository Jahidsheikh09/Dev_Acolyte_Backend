const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");

dotenv.config();
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const mime = require("mime-types");

function getContentTypeFromKey(objectKey) {
  return mime.lookup(objectKey) || "application/octet-stream";
}

// Configure your S3 client
const s3Client = new S3Client({
  region: "auto", // e.g. "us-east-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generates a presigned URL for an S3 operation.
 * @param {string} bucketName
 * @param {string} objectKey
 * @param {'getObject' | 'putObject'} operation
 * @param {number} expiresIn - Expiration time in seconds (default 3600)
 * @param {string} [contentType]
 * @returns {Promise<string>}
 */

// getContentTypeFromKey(OBJECT_KEY);

async function generatePresignedUrl(
  bucketName,
  objectKey,
  operation,
  expiresIn = 3600,
  contentType
) {
  let command;

  if (operation === "getObject") {
    command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
  } else if (operation === "putObject") {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
    };

    if (contentType) {
      params.ContentType = contentType;
    }

    command = new PutObjectCommand(params);
  } else {
    throw new Error("Invalid operation. Use 'getObject' or 'putObject'.");
  }

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (err) {
    console.error("Failed to generate signed URL:", err);
    throw err;
  }
}

// -------- Example Usage --------
(async () => {
  const BUCKET_NAME = "your-bucket-name";
  const OBJECT_KEY = "new_images/ff7e8550b3c223ef76bd595b6fa9019baafebe.jpeg";
  const EXPIRATION_TIME = 1800; // 30 minutes

  // Generate download URL
  try {
    const downloadUrl = await generatePresignedUrl(
      BUCKET_NAME,
      OBJECT_KEY,
      "getObject",
      EXPIRATION_TIME
    );
    console.log("Download URL:", downloadUrl);
  } catch (error) {
    console.error("Download URL error:", error);
  }

  // Generate upload URL
  try {
    const uploadUrl = await generatePresignedUrl(
      BUCKET_NAME,
      OBJECT_KEY,
      "putObject",
      EXPIRATION_TIME,
      "image/jpeg"
    );
    console.log("Upload URL:", uploadUrl);
  } catch (error) {
    console.error("Upload URL error:", error);
  }
})();

// axios.put(signedUrl, file, {
//   headers: {
//     "Content-Type": file.type, // MUST MATCH
//   },
// });
