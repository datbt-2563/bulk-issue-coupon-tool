import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
} from "@aws-sdk/client-sfn";
import * as fs from "fs/promises";
import * as path from "path";

// Initialize Step Functions client for ap-northeast-1 region
const sfnClient = new SFNClient({
  region: "ap-northeast-1",
});

// Note: Replace <accountId> with actual AWS account ID in production
const STATE_MACHINE_ARN =
  "arn:aws:states:ap-northeast-1:856562439801:stateMachine:dev-coupon-bulkIssuedCoupon-machine";

/**
 * Core function to invoke the bulk issue state machine
 * @param payload - The payload to send to the state machine
 * @returns Promise that resolves with the state machine execution result
 */
export async function invokeBulkIssueStateMachine(
  payload: Record<string, any>
): Promise<any> {
  try {
    console.log("🚀 Starting bulk issue state machine execution...");
    console.log("📦 Payload:", JSON.stringify(payload, null, 2));

    // Create the execution command
    const command = new StartExecutionCommand({
      stateMachineArn: STATE_MACHINE_ARN,
      input: JSON.stringify(payload),
      // Generate a unique execution name with timestamp
      name: `bulk-issue-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    });

    // Start the execution
    const response = await sfnClient.send(command);

    console.log("✅ State machine execution started successfully");
    console.log("🔗 Execution ARN:", response.executionArn);

    // Persist execution to process.json
    if (response.executionArn) {
      await persistExecution(response.executionArn);
    }

    // Note: StartExecutionCommand doesn't wait for completion or return payload
    // It only starts the execution and returns execution metadata
    // For synchronous execution, you would need to use DescribeExecutionCommand
    // and poll for completion, or use a different service pattern

    return {
      executionArn: response.executionArn,
      startDate: response.startDate,
      success: true,
      message: "State machine execution started successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error invoking bulk issue state machine:", errorMessage);

    throw new Error(
      `Failed to invoke bulk issue state machine: ${errorMessage}`
    );
  }
}

/**
 * Bulk issue Gen16 coupons
 * @param issuedNumber - Number of coupons to issue
 * @returns Promise that resolves with the execution result
 */
export async function bulkIssueGen16(issuedNumber: number): Promise<any> {
  const payload = {
    couponMasterId: "b5e04386-f446-4c5a-bce7-2b90900d2f5d",
    issuedNumber,
    barcodeSource: "CouponGeneral16Barcode",
    batchSize: 10000,
    publishedFrom: "admin",
    publishedOrganizationId: "5d121455-d98c-417d-88e4-7381f442e921",
    publishedOrganizationName: "e2e organization",
    fifo: false,
    description: "e2e test",
  };

  console.log(`📊 Bulk issuing ${issuedNumber} Gen16 coupons...`);
  return await invokeBulkIssueStateMachine(payload);
}

/**
 * Bulk issue Pos12 coupons
 * @param issuedNumber - Number of coupons to issue
 * @returns Promise that resolves with the execution result
 */
export async function bulkIssuePos12(issuedNumber: number): Promise<any> {
  const payload = {
    couponMasterId: "38a01c2f-32d0-4479-9446-0a505f64e099",
    issuedNumber,
    barcodeSource: "CouponPos12Barcode",
    batchSize: 10000,
    publishedFrom: "admin",
    publishedOrganizationId: "5d121455-d98c-417d-88e4-7381f442e921",
    publishedOrganizationName: "e2e organization",
    fifo: false,
    description: "e2e test",
  };

  console.log(`📊 Bulk issuing ${issuedNumber} Pos12 coupons...`);
  return await invokeBulkIssueStateMachine(payload);
}

/**
 * Bulk issue MOS coupons
 * @param issuedNumber - Number of coupons to issue
 * @param couponCode - The coupon code to use
 * @returns Promise that resolves with the execution result
 */
export async function bulkIssueMos(
  issuedNumber: number,
  couponCode: "123456" | "654321" | "777777" | "666666"
): Promise<any> {
  // const payload = {
  //   couponMasterId: "0448f6e7-f823-4721-abeb-80d6a70038a9",
  //   couponCode,
  //   issuedNumber,
  //   barcodeSource: "CouponMosBarcode",
  //   batchSize: 10000,
  //   publishedFrom: "admin",
  //   publishedOrganizationId: "11c67b7c-793e-41c9-8804-8f6c368afb81",
  //   publishedOrganizationName: "e2e",
  //   description: "e2e",
  // };

  // const couponCodes = ["123456", "654321", "777777", "666666"];

  const payloads = [
    {
      couponMasterId: "c68ec1c0-356d-41cb-bc81-0b299e4e27b3",
      couponCode: "123456",
      issuedNumber,
      barcodeSource: "CouponMosBarcode",
      batchSize: 10000,
      publishedFrom: "admin",
      publishedOrganizationId: "c6e4cd2e-a489-441e-ae94-edcf7b011146",
      publishedOrganizationName: "e2e",
      description: "e2e",
    },
    {
      couponMasterId: "83514e83-6566-4061-93cd-0b29bda855eb",
      couponCode: "654321",
      issuedNumber,
      barcodeSource: "CouponMosBarcode",
      batchSize: 10000,
      publishedFrom: "admin",
      publishedOrganizationId: "5edceeb6-5a5c-46ec-9f7f-8fd8e90aff84",
      publishedOrganizationName: "e2e",
      description: "e2e",
    },
    {
      couponMasterId: "8e9a189a-2f35-4ff0-952d-e7100f32aa2e",
      couponCode: "777777",
      issuedNumber,
      barcodeSource: "CouponMosBarcode",
      batchSize: 10000,
      publishedFrom: "admin",
      publishedOrganizationId: "e1cbfd52-94da-49d0-91a4-336b29424893",
      publishedOrganizationName: "e2e",
      description: "e2e",
    },
    {
      couponMasterId: "efe57b45-53e3-42a8-a506-2059f73a200a",
      couponCode: "666666",
      issuedNumber,
      barcodeSource: "CouponMosBarcode",
      batchSize: 10000,
      publishedFrom: "admin",
      publishedOrganizationId: "842ae95f-49b8-4a98-9a02-009183f38bd5",
      publishedOrganizationName: "e2e",
      description: "e2e",
    },
  ];

  const payload = payloads.find((p) => p.couponCode === couponCode);

  if (!payload) {
    throw new Error(
      `Invalid coupon code: ${couponCode}. Valid codes are: ${payloads
        .map((p) => p.couponCode)
        .join(", ")}`
    );
  }

  console.log(
    `📊 Bulk issuing ${issuedNumber} MOS coupons with code: ${couponCode}...`
  );
  return await invokeBulkIssueStateMachine(payload);
}

/**
 * Persist execution ARN to process.json file
 * @param executionArn - The execution ARN to persist
 */
async function persistExecution(executionArn: string): Promise<void> {
  try {
    const processFilePath = path.join(
      process.cwd(),
      "output",
      "sfn",
      "process.json"
    );

    // Ensure directory exists
    const processDir = path.dirname(processFilePath);
    await fs.mkdir(processDir, { recursive: true });

    let executions: Array<{ arn: string; timestamp: number }> = [];

    // Try to load existing file
    try {
      const existingData = await fs.readFile(processFilePath, "utf-8");
      executions = JSON.parse(existingData);

      // Ensure it's an array
      if (!Array.isArray(executions)) {
        executions = [];
      }
    } catch (error) {
      // File doesn't exist or is invalid, start with empty array
      executions = [];
    }

    // Add new execution
    executions.push({
      arn: executionArn,
      timestamp: Date.now(),
    });

    // Write back to file
    await fs.writeFile(processFilePath, JSON.stringify(executions, null, 2));
    console.log(`📝 Execution persisted to ${processFilePath}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error persisting execution:", errorMessage);
    // Don't throw here - this is not critical for the main functionality
  }
}

/**
 * Check the status of a Step Functions execution
 * @param executionArn - The execution ARN to check
 * @returns Promise that resolves with the execution status
 */
export async function checkExecutionStatus(
  executionArn: string
): Promise<string> {
  try {
    const command = new DescribeExecutionCommand({
      executionArn: executionArn,
    });

    const response = await sfnClient.send(command);

    return response.status || "UNKNOWN";
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `❌ Error checking execution status for ${executionArn}:`,
      errorMessage
    );
    throw new Error(`Failed to check execution status: ${errorMessage}`);
  }
}

/**
 * Poll execution status until completion
 * @param executionArn - The execution ARN to poll
 * @param intervalMs - Polling interval in milliseconds (default: 10000)
 */
export async function pollExecutionStatus(
  executionArn: string,
  intervalMs: number = 10000
): Promise<void> {
  try {
    console.log(`🔄 Starting to poll execution: ${executionArn}`);

    while (true) {
      const status = await checkExecutionStatus(executionArn);
      console.log(`[${executionArn}] status: ${status}`);

      // Break if execution is not running
      if (status !== "RUNNING") {
        console.log(`✅ Execution completed with status: ${status}`);
        break;
      }

      // Wait before next poll
      console.log(`⏳ Waiting ${intervalMs}ms before next status check...`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error polling execution status:`, errorMessage);
    throw error;
  }
}

// Export all functions
export { invokeBulkIssueStateMachine as default };

// Example usage when run directly
if (require.main === module) {
  async function testBulkIssue() {
    try {
      console.log("🧪 Testing bulk issue functions...");

      // Test Gen16
      console.log("\n--- Testing Gen16 Bulk Issue ---");
      const gen16Result = await bulkIssueGen16(5);
      console.log("Gen16 Result:", gen16Result);

      // Test Pos12
      console.log("\n--- Testing Pos12 Bulk Issue ---");
      const pos12Result = await bulkIssuePos12(3);
      console.log("Pos12 Result:", pos12Result);

      // Test MOS
      console.log("\n--- Testing MOS Bulk Issue ---");
      // const mosResult = await bulkIssueMos(2, "TEST-COUPON-001");
      // console.log("MOS Result:", mosResult);
    } catch (error) {
      console.error(
        "💥 Test failed:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  }

  testBulkIssue();
}
