import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

// Initialize Lambda client for ap-northeast-1 region
const lambdaClient = new LambdaClient({
  region: "ap-northeast-1",
});

/**
 * Invokes the Valkey debug Lambda function to get an overview
 * @returns Promise that resolves with the Lambda function response data
 */
export async function getValkeyOverview(): Promise<any> {
  try {
    // Prepare the invocation command
    const command = new InvokeCommand({
      FunctionName: "dev-coupon-DebugRedisFn-function",
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify({ code: "overview" })),
    });

    console.log("🔍 Invoking Valkey debug Lambda function...");

    // Invoke the Lambda function
    const response = await lambdaClient.send(command);

    // Check if the invocation was successful
    if (response.StatusCode !== 200) {
      throw new Error(
        `Lambda invocation failed with status code: ${response.StatusCode}`
      );
    }

    // Check if payload exists
    if (!response.Payload) {
      throw new Error("No payload received from Lambda function");
    }

    // Convert payload from Buffer to string and parse JSON
    const payloadString = Buffer.from(response.Payload).toString();
    const parsedResponse = JSON.parse(payloadString);

    console.log("✅ Successfully retrieved Valkey overview");

    return parsedResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error getting Valkey overview:", errorMessage);

    // Re-throw the error to allow caller to handle it
    throw new Error(`Failed to get Valkey overview: ${errorMessage}`);
  }
}

// Export as default for convenience
export default getValkeyOverview;

// Example usage when run directly
if (require.main === module) {
  getValkeyOverview()
    .then((overview) => {
      console.log("📊 Valkey Overview Result:");
      console.log(JSON.stringify(overview, null, 2));
    })
    .catch((error) => {
      console.error("💥 Failed to get overview:", error.message);
      process.exit(1);
    });
}
