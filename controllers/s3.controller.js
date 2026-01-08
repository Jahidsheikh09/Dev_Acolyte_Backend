const { GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const dotenv = require("dotenv");
dotenv.config();

const s3Client = require("../config/s3Client");
const { getContentTypeFromKey } = require("../utils/mime");

/**
 * Generate presigned URL API
 * GET /api/s3/presigned-url
 */
exports.generatePresignedUrl = async (req, res) => {
  try {
    const {
      // bucketName,
      objectKey,
      operation, // getObject | putObject
      // expiresIn = 3600,
    } = req.query;

    if (!objectKey || !operation) {
      return res.status(400).json({
        success: false,
        message: "objectKey and operation are required",
      });
    }

    let command;

    if (operation === "getObject") {
      command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: objectKey,
      });
    } else if (operation === "putObject") {
      const contentType = getContentTypeFromKey(objectKey);

      command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: objectKey,
        ContentType: contentType,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid operation. Use getObject or putObject",
      });
    }
    const expiresIn = Number(process.env.AWS_SIGNED_URL_EXPIRY);
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    return res.status(200).json({
      success: true,
      signedUrl,
      expiresIn,
      operation,
    });
  } catch (error) {
    console.error("Presigned URL Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate presigned URL",
    });
  }
};
