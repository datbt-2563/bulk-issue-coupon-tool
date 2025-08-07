import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";
import inquirer from "inquirer";

interface BarcodeModule {
  name: string;
  description: string;
  requiresQuantity: boolean;
}

const barcodeModules: BarcodeModule[] = [
  {
    name: "Redis Overview",
    description: "Get Redis/Valkey overview and statistics",
    requiresQuantity: false,
  },
  {
    name: "Bulk issue",
    description: "Issue coupons via AWS Step Functions state machine",
    requiresQuantity: false,
  },
  {
    name: "Poll Execution Status",
    description: "Monitor Step Functions execution status in real-time",
    requiresQuantity: false,
  },
  {
    name: "Generate barcode (CSV file)",
    description: "Generate POS, Gen16, or MOS barcode codes",
    requiresQuantity: false,
  },
  {
    name: "Clean CSV file",
    description: "Delete all CSV files in current and output directories",
    requiresQuantity: false,
  },
  {
    name: "Upload CSV file",
    description: "Upload a generated folder to S3 as a zip archive",
    requiresQuantity: false,
  },
  {
    name: "Exit",
    description: "Exit the application",
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

async function promptBarcodeSubType(): Promise<string> {
  const { barcodeSubType } = await inquirer.prompt([
    {
      type: "list",
      name: "barcodeSubType",
      message: "Select a barcode type to generate:",
      choices: [
        {
          name: "Pos12 - Generate POS unit codes with pattern A[13digits]C",
          value: "Pos12",
        },
        {
          name: "Gen16 - Generate 16-digit general codes",
          value: "Gen16",
        },
        {
          name: "Mos - Generate MOS coupon codes with pattern B[6digits]2[6digits]B",
          value: "Mos",
        },
      ],
    },
  ]);
  return barcodeSubType;
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
      case "Exit":
        console.log("👋 Goodbye!");
        process.exit(0);
        break;
      case "Generate barcode":
        // Prompt for barcode sub-type
        const barcodeSubType = await promptBarcodeSubType();

        // Prompt for quantity
        const barcodeQuantity = await promptQuantity();

        console.log(
          `\n🚀 Generating ${barcodeSubType} codes with quantity ${barcodeQuantity}...`
        );

        // Generate codes based on sub-type
        if (barcodeSubType === "Pos12") {
          const pos12 = await import("./insert_barcode/pos12");
          outputPath = pos12.default(barcodeQuantity);
          console.log(`✅ POS12 codes generated successfully!`);
        } else if (barcodeSubType === "Gen16") {
          const gen16 = await import("./insert_barcode/general_16");
          outputPath = gen16.default(barcodeQuantity);
          console.log(`✅ General 16-digit codes generated successfully!`);
        } else if (barcodeSubType === "Mos") {
          const mos = await import("./insert_barcode/coupon-mos");
          outputPath = mos.default(barcodeQuantity);
          console.log(`✅ MOS coupon codes generated successfully!`);
        } else {
          throw new Error(`Unknown barcode sub-type: ${barcodeSubType}`);
        }

        console.log(`📁 Output directory: ${outputPath}`);

        // Prompt for S3 upload
        const shouldUploadBarcode = await promptUploadConfirmation();
        if (shouldUploadBarcode) {
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

      case "Bulk issue":
        try {
          console.log("🏭 Starting bulk issue process...");

          // Prompt for bulk issue type
          const bulkIssueType = await promptBulkIssueType();

          // Prompt for quantity
          const issuedNumber = await promptBulkIssueQuantity();

          // Import bulk issue functions
          const bulkIssueModule = await import("./bulk_issue/state_machine");

          let result: any;

          if (bulkIssueType === "Mos") {
            // For MOS, also prompt for coupon code
            // const couponCode = await promptMosCouponCode();
            const couponCode = "999999";
            console.log(
              `\n🚀 Bulk issuing ${issuedNumber} MOS coupons with code: ${couponCode}...`
            );
            result = await bulkIssueModule.bulkIssueMos(
              issuedNumber,
              couponCode
            );
          } else if (bulkIssueType === "Pos12") {
            console.log(`\n🚀 Bulk issuing ${issuedNumber} Pos12 coupons...`);
            result = await bulkIssueModule.bulkIssuePos12(issuedNumber);
          } else if (bulkIssueType === "Gen16") {
            console.log(`\n🚀 Bulk issuing ${issuedNumber} Gen16 coupons...`);
            result = await bulkIssueModule.bulkIssueGen16(issuedNumber);
          }

          // Display success message
          console.log("\n✅ Bulk issue started successfully!");
          console.log("🔗 Execution ARN:", result.executionArn);
          console.log("📅 Start Date:", result.startDate);
          console.log("📄 Status:", result.message);

          // Prompt to continue or exit
          const shouldContinue = await promptContinueOrExit();
          if (shouldContinue) {
            await main();
            return;
          } else {
            console.log("👋 Goodbye!");
            process.exit(0);
          }
        } catch (error) {
          console.error(
            "❌ Failed to start bulk issue:",
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

      case "Poll Execution Status":
        try {
          console.log("📊 Loading execution history...");

          // Read and parse process.json
          const executions = await loadExecutionHistory();

          if (executions.length === 0) {
            console.log("ℹ️ No executions found in history.");
            console.log(
              "💡 Try running 'Bulk issue' first to create some executions."
            );

            const shouldContinue = await promptContinueOrExit();
            if (shouldContinue) {
              await main();
              return;
            } else {
              console.log("👋 Goodbye!");
              process.exit(0);
            }
            break;
          }

          // Prompt user to select an execution
          const selectedArn = await promptExecutionSelection(executions);

          console.log(`\n🔄 Starting to monitor execution...`);
          console.log(`🔗 ARN: ${selectedArn}`);
          console.log("💡 Press Ctrl+C to return to main menu\n");

          // Import polling function and start monitoring
          const { pollExecutionStatus } = await import(
            "./bulk_issue/state_machine"
          );

          // Set up polling with enhanced status display
          await pollExecutionStatusWithHotkey(selectedArn, pollExecutionStatus);

          // Return to main menu
          const shouldContinue = await promptContinueOrExit();
          if (shouldContinue) {
            await main();
            return;
          } else {
            console.log("👋 Goodbye!");
            process.exit(0);
          }
        } catch (error) {
          console.error(
            "❌ Failed to poll execution status:",
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
      `\n🚀 Starting ${selectedType}${
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

async function loadExecutionHistory(): Promise<
  Array<{ arn: string; timestamp: number }>
> {
  try {
    const processFilePath = path.join(
      process.cwd(),
      "output",
      "sfn",
      "process.json"
    );

    // Check if file exists
    if (!fs.existsSync(processFilePath)) {
      return [];
    }

    const data = await fsPromises.readFile(processFilePath, "utf-8");
    const executions = JSON.parse(data);

    // Ensure it's an array and has valid structure
    if (!Array.isArray(executions)) {
      return [];
    }

    // Filter out invalid entries and sort by timestamp (newest first)
    return executions
      .filter((exec) => exec && exec.arn && exec.timestamp)
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("❌ Error loading execution history:", error);
    return [];
  }
}

async function promptExecutionSelection(
  executions: Array<{ arn: string; timestamp: number }>
): Promise<string> {
  // Create user-friendly choices
  const choices = executions.map((exec, index) => {
    const date = new Date(exec.timestamp);
    const formattedDate = date.toLocaleString();
    const shortArn = exec.arn.split(":").pop() || exec.arn; // Get execution name part

    return {
      name: `${index + 1}. ${shortArn} (${formattedDate})`,
      value: exec.arn,
    };
  });

  const { selectedArn } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedArn",
      message: "Select an execution to monitor:",
      choices: choices,
      pageSize: 10,
    },
  ]);

  return selectedArn;
}

async function pollExecutionStatusWithHotkey(
  executionArn: string,
  pollFunction: (arn: string, intervalMs?: number) => Promise<void>
): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    let pollingStopped = false;

    // Set up keyboard input handling
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const onKeyPress = (key: string) => {
      if (
        key === "\u0003" ||
        key.toLowerCase() === "q" ||
        key.toLowerCase() === "b"
      ) {
        // Ctrl+C, q, or b
        pollingStopped = true;
        console.log("\n🛑 Polling stopped by user");
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onKeyPress);
        resolve();
      }
    };

    process.stdin.on("data", onKeyPress);

    try {
      // Enhanced polling with timestamps and hotkey support
      console.log(`🔄 Starting to poll execution: ${executionArn}`);
      console.log(
        "💡 Press 'q', 'b', or Ctrl+C to stop polling and return to menu\n"
      );

      const startTime = Date.now();
      let pollCount = 0;

      while (!pollingStopped) {
        pollCount++;
        const timestamp = new Date().toLocaleString();

        try {
          // Import and use checkExecutionStatus directly for better control
          const { checkExecutionStatus } = await import(
            "./bulk_issue/state_machine"
          );
          const status = await checkExecutionStatus(executionArn);

          const shortArn = executionArn.split(":").pop() || executionArn;
          console.log(`[${timestamp}] [${shortArn}] status: ${status}`);

          // Break if execution is not running
          if (status !== "RUNNING") {
            console.log(
              `\n✅ Execution completed with final status: ${status}`
            );
            const duration = Math.round((Date.now() - startTime) / 1000);
            console.log(
              `📊 Polling completed - ${pollCount} checks over ${duration} seconds`
            );
            break;
          }

          // Wait before next poll (10 seconds)
          if (!pollingStopped) {
            console.log(`⏳ Next check in 10 seconds... (Press 'q' to stop)`);
            await new Promise<void>((resolve) => {
              const timeout = setTimeout(() => resolve(), 10000);
              const originalListener = process.stdin.listeners("data")[0];

              const quickExit = () => {
                clearTimeout(timeout);
                resolve();
              };

              process.stdin.once("data", quickExit);

              setTimeout(() => {
                process.stdin.removeListener("data", quickExit);
              }, 10000);
            });
          }
        } catch (statusError) {
          console.error(`❌ Error checking status: ${statusError}`);
          await new Promise<void>((resolve) =>
            setTimeout(() => resolve(), 10000)
          ); // Wait before retry
        }
      }
    } catch (error) {
      reject(error);
    } finally {
      // Clean up
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onKeyPress);
      resolve();
    }
  });
}

async function promptBulkIssueType(): Promise<string> {
  const { bulkIssueType } = await inquirer.prompt([
    {
      type: "list",
      name: "bulkIssueType",
      message: "Select bulk issue type:",
      choices: [
        { name: "Mos", value: "Mos" },
        { name: "Pos12", value: "Pos12" },
        { name: "Gen16", value: "Gen16" },
      ],
    },
  ]);
  return bulkIssueType;
}

async function promptBulkIssueQuantity(): Promise<number> {
  const { quantity } = await inquirer.prompt([
    {
      type: "input",
      name: "quantity",
      message: "Enter number of codes to issue:",
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

async function promptMosCouponCode(): Promise<string> {
  const { couponCode } = await inquirer.prompt([
    {
      type: "input",
      name: "couponCode",
      message: "Enter coupon code for Mos:",
      validate: (input: string): boolean | string => {
        if (!input || input.trim() === "") {
          return "Please enter a valid coupon code";
        }
        return true;
      },
    },
  ]);
  return couponCode.trim();
}

if (require.main === module) {
  main();
}
