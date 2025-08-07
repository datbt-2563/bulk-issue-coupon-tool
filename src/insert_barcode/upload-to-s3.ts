import * as fs from "fs";
import * as path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as archiver from "archiver";

// Configuration constants
const BUCKET_NAME = "dev-coupon-code-source-bucket-ap-northeast-1";

// Initialize S3 client for ap-northeast-1 region
const s3Client = new S3Client({
  region: "ap-northeast-1",
});

/**
 * Creates a zip archive of the specified folder
 * @param folderPath - Full path to the folder to zip
 * @param zipFilePath - Full path where the zip file will be created
 * @returns Promise that resolves when zipping is complete
 */
function createZipArchive(
  folderPath: string,
  zipFilePath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create write stream for the zip file
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver.create("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    // Handle stream events
    output.on("close", () => {
      console.log(`📦 Archive created: ${archive.pointer()} total bytes`);
      resolve();
    });

    output.on("error", (err: Error) => {
      reject(err);
    });

    archive.on("error", (err: Error) => {
      reject(err);
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      reject(new Error(`Folder not found: ${folderPath}`));
      return;
    }

    // Add the entire folder to the archive
    archive.directory(folderPath, false);

    // Finalize the archive
    archive.finalize();
  });
}

/**
 * Uploads a file to S3
 * @param filePath - Local path to the file to upload
 * @param s3Key - S3 object key (filename in S3)
 * @returns Promise that resolves with the S3 object URL
 */
async function uploadFileToS3(
  filePath: string,
  s3Key: string
): Promise<string> {
  try {
    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Create upload command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: "application/zip",
    });

    // Upload to S3
    const response = await s3Client.send(command);

    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(
        `S3 upload failed with status: ${response.$metadata.httpStatusCode}`
      );
    }

    // Return S3 object URL
    const s3Url = `https://${BUCKET_NAME}.s3.ap-northeast-1.amazonaws.com/${s3Key}`;
    return s3Url;
  } catch (error) {
    throw new Error(
      `Failed to upload to S3: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Uploads a folder to S3 as a zip archive
 * @param folderName - Name of the folder in the output directory to upload
 * @returns Promise that resolves with the S3 object URL
 */
export default async function uploadFolderToS3(
  folderName: string
): Promise<string> {
  const outputDir = path.join(process.cwd(), "output");
  const folderPath = path.join(outputDir, folderName);
  const tempDir = path.join(outputDir, "temp");
  const zipFileName = `${folderName}.zip`;
  const zipFilePath = path.join(tempDir, zipFileName);

  try {
    // Validate input
    if (!folderName || folderName.trim() === "") {
      throw new Error("Folder name cannot be empty");
    }

    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    console.log(`📁 Preparing to zip folder: ${folderPath}`);

    // Create zip archive
    await createZipArchive(folderPath, zipFilePath);

    console.log(`⬆️ Uploading ${zipFileName} to S3...`);

    // Upload to S3
    const s3Url = await uploadFileToS3(zipFilePath, zipFileName);

    console.log(`✅ Successfully uploaded to S3: ${s3Url}`);

    // Clean up: delete local zip file
    try {
      fs.unlinkSync(zipFilePath);
      console.log(`🗑️ Cleaned up temporary zip file: ${zipFilePath}`);
    } catch (cleanupError) {
      console.warn(
        `⚠️ Warning: Could not delete temporary zip file: ${cleanupError}`
      );
    }

    return s3Url;
  } catch (error) {
    // Clean up zip file if it exists and upload failed
    if (fs.existsSync(zipFilePath)) {
      try {
        fs.unlinkSync(zipFilePath);
      } catch (cleanupError) {
        console.warn(
          `⚠️ Warning: Could not delete temporary zip file after error: ${cleanupError}`
        );
      }
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Upload failed: ${errorMessage}`);
    throw new Error(`Failed to upload folder to S3: ${errorMessage}`);
  }
}

// Example usage when run directly
if (require.main === module) {
  // Example: upload a test folder
  const testFolderName = process.argv[2];
  if (!testFolderName) {
    console.log("Usage: ts-node src/upload-to-s3.ts <folder-name>");
    console.log(
      "Example: ts-node src/upload-to-s3.ts pos12_codes_20250807_143022"
    );
    process.exit(1);
  }

  uploadFolderToS3(testFolderName)
    .then((url) => {
      console.log(`🎉 Upload completed successfully: ${url}`);
    })
    .catch((error) => {
      console.error(`💥 Upload failed: ${error.message}`);
      process.exit(1);
    });
}
