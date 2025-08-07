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

async function runModule(moduleName: string, quantity?: number): Promise<void> {
  try {
    let outputPath: string;

    switch (moduleName) {
      case "Pos12":
        const pos12 = await import("./pos12");
        outputPath = pos12.default(quantity!);
        console.log(`✅ POS12 codes generated successfully!`);
        console.log(`📁 Output directory: ${outputPath}`);
        break;

      case "Gen16":
        const gen16 = await import("./general_16");
        outputPath = gen16.default(quantity!);
        console.log(`✅ General 16-digit codes generated successfully!`);
        console.log(`📁 Output directory: ${outputPath}`);
        break;

      case "Mos":
        const mos = await import("./coupon-mos");
        outputPath = mos.default(quantity!);
        console.log(`✅ MOS coupon codes generated successfully!`);
        console.log(`📁 Output directory: ${outputPath}`);
        break;

      case "Clean":
        const clean = await import("./deleted-csv");
        clean.default();
        break;

      case "Upload":
        const folderName = await promptFolderSelection();
        const uploadToS3 = await import("./upload-to-s3");
        const s3Url = await uploadToS3.default(folderName);
        console.log(`✅ Folder uploaded successfully to S3!`);
        console.log(`🌐 S3 URL: ${s3Url}`);
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
  } catch (error) {
    console.error("❌ An error occurred:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
