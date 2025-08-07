import * as fs from "fs";
import * as path from "path";
import inquirer from "inquirer";

interface BarcodeModule {
  name: string;
  description: string;
  requiresQuantity: boolean;
}

const barcodeModules: BarcodeModule[] = [
  {
    name: "Pos12",
    description: "Generate POS unit codes with pattern A[13digits]C",
    requiresQuantity: true,
  },
  {
    name: "Gen16",
    description: "Generate 16-digit general codes",
    requiresQuantity: true,
  },
  {
    name: "Mos",
    description: "Generate MOS coupon codes with pattern B[6digits]2[6digits]B",
    requiresQuantity: true,
  },
  {
    name: "Clean",
    description: "Delete all CSV files in current and output directories",
    requiresQuantity: false,
  },
  {
    name: "Upload",
    description: "Upload a generated folder to S3 as a zip archive",
    requiresQuantity: false,
  },
  {
    name: "Redis Overview",
    description: "Get Redis/Valkey overview and statistics",
    requiresQuantity: false,
  },
];

async function promptBarcodeType(): Promise<string> {
  const { barcodeType } = await inquirer.prompt([
    {
      type: "list",
      name: "barcodeType",
      message: "Select a barcode type:",
      choices: barcodeModules.map((module) => ({
        name: `${module.name} - ${module.description}`,
        value: module.name,
      })),
    },
  ]);
  return barcodeType;
}

async function promptQuantity(): Promise<number> {
  const { quantity } = await inquirer.prompt([
    {
      type: "input",
      name: "quantity",
      message: "Enter the quantity to generate:",
      validate: (input: string): boolean | string => {
        const num = parseInt(input);
        if (isNaN(num) || num <= 0) {
          return "Please enter a valid positive number";
        }
        return true;
      },
      filter: (input: string): number => parseInt(input),
    },
  ]);
  return quantity;
}

async function promptFolderSelection(): Promise<string> {
  const outputDir = path.join(process.cwd(), "output");

  // Check if output directory exists
  if (!fs.existsSync(outputDir)) {
    throw new Error(
      "Output directory not found. Please generate some codes first."
    );
  }

  // Get list of folders in output directory
  const items = fs.readdirSync(outputDir, { withFileTypes: true });
  const folders = items
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .sort((a, b) => b.localeCompare(a)); // Sort newest first

  if (folders.length === 0) {
    throw new Error(
      "No folders found in output directory. Please generate some codes first."
    );
  }

  const { folderName } = await inquirer.prompt([
    {
      type: "list",
      name: "folderName",
      message: "Select a folder to upload:",
      choices: folders.map((folder) => ({
        name: folder,
        value: folder,
      })),
    },
  ]);

  return folderName;
}

async function promptUploadConfirmation(): Promise<boolean> {
  const { shouldUpload } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldUpload",
      message: "Do you want to upload the generated file to S3 now?",
      default: false,
    },
  ]);
  return shouldUpload;
}

async function promptContinueOrExit(): Promise<boolean> {
  const { shouldContinue } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldContinue",
      message: "Return to main menu?",
      default: true,
    },
  ]);
  return shouldContinue;
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hour}_${minute}_${second}`;
}

async function runModule(moduleName: string, quantity?: number): Promise<void> {
  try {
    let outputPath: string;

    switch (moduleName) {
      case "Pos12":
        const pos12 = await import("./insert_barcode/pos12");
        outputPath = pos12.default(quantity!);
        console.log(`✅ POS12 codes generated successfully!`);
        console.log(`📁 Output directory: ${outputPath}`);

        // Prompt for S3 upload
        const shouldUploadPos12 = await promptUploadConfirmation();
        if (shouldUploadPos12) {
          const timestamp = generateTimestamp();
          const folderName = path.basename(outputPath);
          const customKey = `${folderName}-${timestamp}.zip`;
          const uploadToS3 = await import("./insert_barcode/upload-to-s3");
          const s3Url = await uploadToS3.default(folderName, customKey);
          console.log(`✅ Folder uploaded successfully to S3!`);
          console.log(`🌐 S3 URL: ${s3Url}`);
        } else {
          console.log(`⏭️ Upload skipped.`);
        }
        break;

      case "Gen16":
        const gen16 = await import("./insert_barcode/general_16");
        outputPath = gen16.default(quantity!);
        console.log(`✅ General 16-digit codes generated successfully!`);
        console.log(`📁 Output directory: ${outputPath}`);

        // Prompt for S3 upload
        const shouldUploadGen16 = await promptUploadConfirmation();
        if (shouldUploadGen16) {
          const timestamp = generateTimestamp();
          const folderName = path.basename(outputPath);
          const customKey = `${folderName}-${timestamp}.zip`;

          const uploadToS3 = await import("./insert_barcode/upload-to-s3");
          const s3Url = await uploadToS3.default(folderName, customKey);
          console.log(`✅ Folder uploaded successfully to S3!`);
          console.log(`🌐 S3 URL: ${s3Url}`);
        } else {
          console.log(`⏭️ Upload skipped.`);
        }
        break;

      case "Mos":
        const mos = await import("./insert_barcode/coupon-mos");
        outputPath = mos.default(quantity!);
        console.log(`✅ MOS coupon codes generated successfully!`);
        console.log(`📁 Output directory: ${outputPath}`);

        // Prompt for S3 upload
        const shouldUploadMos = await promptUploadConfirmation();
        if (shouldUploadMos) {
          const timestamp = generateTimestamp();
          const folderName = path.basename(outputPath);
          const customKey = `${folderName}-${timestamp}.zip`;

          const uploadToS3 = await import("./insert_barcode/upload-to-s3");
          const s3Url = await uploadToS3.default(folderName, customKey);
          console.log(`✅ Folder uploaded successfully to S3!`);
          console.log(`🌐 S3 URL: ${s3Url}`);
        } else {
          console.log(`⏭️ Upload skipped.`);
        }
        break;

      case "Clean":
        const clean = await import("./insert_barcode/deleted-csv");
        clean.default();
        break;

      case "Upload":
        const folderName = await promptFolderSelection();
        const shouldUpload = await promptUploadConfirmation();

        if (shouldUpload) {
          const uploadToS3 = await import("./insert_barcode/upload-to-s3");
          const s3Url = await uploadToS3.default(folderName);
          console.log(`✅ Folder uploaded successfully to S3!`);
          console.log(`🌐 S3 URL: ${s3Url}`);
        } else {
          console.log(`⏭ Upload skipped by the user.`);
        }
        break;

      case "Redis Overview":
        try {
          console.log("🔍 Fetching Redis/Valkey overview...");
          const valkeyModule = await import("./valkey/overview");
          const overview = await valkeyModule.getValkeyOverview();

          console.log("\n📊 Redis/Valkey Overview:");
          console.log("=".repeat(50));

          // Pretty-print the stats
          if (typeof overview === "object" && overview !== null) {
            // If it's an object, try to display it nicely
            if (Array.isArray(overview)) {
              console.table(overview);
            } else {
              // Display object properties in a formatted way
              Object.entries(overview).forEach(([key, value]) => {
                if (typeof value === "object" && value !== null) {
                  console.log(`${key}:`);
                  console.table(value);
                } else {
                  console.log(`${key}: ${value}`);
                }
              });
            }
          } else {
            // Fallback to JSON stringify
            console.log(JSON.stringify(overview, null, 2));
          }

          console.log("=".repeat(50));

          // Prompt to continue or exit
          const shouldContinue = await promptContinueOrExit();
          if (shouldContinue) {
            // Return to main menu by calling main() again
            await main();
            return;
          } else {
            console.log("👋 Goodbye!");
            process.exit(0);
          }
        } catch (error) {
          console.error(
            "❌ Failed to get Redis overview:",
            error instanceof Error ? error.message : String(error)
          );

          const shouldContinue = await promptContinueOrExit();
          if (shouldContinue) {
            await main();
            return;
          } else {
            process.exit(1);
          }
        }
        break;

      default:
        throw new Error(`Unknown module: ${moduleName}`);
    }
  } catch (error) {
    console.error(`❌ Error running ${moduleName}:`, error);
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    console.log("\n🎫 Bulk Issue Coupon Tool");
    console.log("=".repeat(40));

    const selectedType = await promptBarcodeType();
    const moduleInfo = barcodeModules.find((m) => m.name === selectedType);

    if (!moduleInfo) {
      throw new Error(`Module not found: ${selectedType}`);
    }

    let quantity: number | undefined;
    if (moduleInfo.requiresQuantity) {
      quantity = await promptQuantity();
    }

    console.log(
      `\n🚀 Running ${selectedType}${
        quantity ? ` with quantity ${quantity}` : ""
      }...`
    );
    await runModule(selectedType, quantity);

    const shouldContinue = await promptContinueOrExit();
    if (shouldContinue) {
      await main(); // Restart the process
    } else {
      console.log("👋 Goodbye!");
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ An error occurred:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
