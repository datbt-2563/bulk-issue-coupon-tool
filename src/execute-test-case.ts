import { generateTimestamp } from ".";
import * as path from "path";
import { pollExecutionStatus } from "./bulk_issue/state_machine";

export const testPattens = {
  "TC-001": {
    numberProcess: 1,
    couponPerProcess: 2000000,
  },
  "TC-002": {
    numberProcess: 2,
    couponPerProcess: 1000000,
  },
  "TC-003": {
    numberProcess: 3,
    couponPerProcess: 700000,
  },
  "TC-004": {
    numberProcess: 4,
    couponPerProcess: 500000,
  },
};

export const testCases: {
  no: number;
  barcodeType: string;
  testPattern: keyof typeof testPattens;
  status: "new" | "processing" | "pass" | "fail";
}[] = [
  // { no: 25, barcodeType: "Mos", testPattern: "TC-002", status: "new" },

  { no: 1, barcodeType: "Pos12", testPattern: "TC-001", status: "pass" },
  { no: 2, barcodeType: "Pos12", testPattern: "TC-001", status: "pass" },
  { no: 3, barcodeType: "Pos12", testPattern: "TC-001", status: "pass" },
  { no: 4, barcodeType: "Pos12", testPattern: "TC-002", status: "pass" },
  { no: 5, barcodeType: "Pos12", testPattern: "TC-002", status: "pass" },
  { no: 6, barcodeType: "Pos12", testPattern: "TC-002", status: "pass" },

  { no: 13, barcodeType: "Gen16", testPattern: "TC-001", status: "pass" },
  { no: 14, barcodeType: "Gen16", testPattern: "TC-001", status: "pass" },
  { no: 15, barcodeType: "Gen16", testPattern: "TC-001", status: "new" },
  { no: 16, barcodeType: "Gen16", testPattern: "TC-002", status: "pass" },
  { no: 17, barcodeType: "Gen16", testPattern: "TC-002", status: "new" },
  { no: 18, barcodeType: "Gen16", testPattern: "TC-002", status: "new" },

  { no: 19, barcodeType: "Gen16", testPattern: "TC-003", status: "new" },
  { no: 20, barcodeType: "Gen16", testPattern: "TC-003", status: "new" },
  { no: 21, barcodeType: "Gen16", testPattern: "TC-003", status: "new" },

  { no: 9, barcodeType: "Pos12", testPattern: "TC-003", status: "new" },
  { no: 10, barcodeType: "Pos12", testPattern: "TC-004", status: "new" },
  // { no: 11, barcodeType: "Pos12", testPattern: "TC-004", status: "new" }, // inprogress
  { no: 12, barcodeType: "Pos12", testPattern: "TC-004", status: "new" },

  { no: 22, barcodeType: "Gen16", testPattern: "TC-004", status: "new" },
  { no: 23, barcodeType: "Gen16", testPattern: "TC-004", status: "new" },
  { no: 24, barcodeType: "Gen16", testPattern: "TC-004", status: "new" }, // inprogress

  { no: 7, barcodeType: "Pos12", testPattern: "TC-003", status: "new" },
  { no: 8, barcodeType: "Pos12", testPattern: "TC-003", status: "new" },

  // { no: 26, barcodeType: "Mos", testPattern: "TC-002", status: "new" },
  // { no: 27, barcodeType: "Mos", testPattern: "TC-002", status: "new" },
  // { no: 28, barcodeType: "Mos", testPattern: "TC-003", status: "new" },
  // { no: 29, barcodeType: "Mos", testPattern: "TC-003", status: "new" },
  // { no: 30, barcodeType: "Mos", testPattern: "TC-003", status: "new" },
  // { no: 31, barcodeType: "Mos", testPattern: "TC-004", status: "new" },
  // { no: 32, barcodeType: "Mos", testPattern: "TC-004", status: "new" },
  // { no: 33, barcodeType: "Mos", testPattern: "TC-004", status: "new" },
];

export const log = (
  testCaseNo: number,
  stateMachineArns: string[],
  status: string
) => {
  // Get content from log.json and append new log
  const logFilePath = path.join(__dirname, "log.json");
  const fs = require("fs");
  let logData: {
    testCaseNo: number;
    stateMachineArns: string[];
    status: string;
  }[] = [];
  if (fs.existsSync(logFilePath)) {
    const fileContent = fs.readFileSync(logFilePath, "utf-8");
    logData = JSON.parse(fileContent);
  }
  logData.push({ testCaseNo, stateMachineArns, status });
  fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
  console.log(`Logged test case ${testCaseNo} with status ${status}`);
  console.log(`State Machine ARNs: ${stateMachineArns.join(", ")}`);
  console.log(`Log file updated: ${logFilePath}`);
  console.log(`Current log data: ${JSON.stringify(logData, null, 2)}`);
  console.log(`Log file path: ${logFilePath}`);
};

export const getLog = async (): Promise<
  { testCaseNo: number; stateMachineArns: string[]; status: string }[]
> => {
  const logFilePath = path.join(__dirname, "log.json");
  const fs = require("fs");
  // Get content from log.json
  let logData: {
    testCaseNo: number;
    stateMachineArns: string[];
    status: string;
  }[] = [];
  if (fs.existsSync(logFilePath)) {
    const fileContent = fs.readFileSync(logFilePath, "utf-8");
    logData = JSON.parse(fileContent);
  }
  return logData;
};

export const executeTestCase = async (params: {
  no: number;
  barcodeType: string;
  testPattern: keyof typeof testPattens;
  status: "new" | "processing" | "pass" | "fail";
}) => {
  const { no, barcodeType, testPattern, status } = params;

  // STAGE 1: Check if enough barcodes are available
  if (!["Pos12", "Gen16", "Mos"].includes(barcodeType)) {
    throw new Error(`Invalid barcode type: ${barcodeType}`);
  }

  if (barcodeType === "Mos") {
    return await executeTestCaseMos({
      no,
      testPattern,
    });
  }

  // Check if current barcode is enough
  const valkeyModule = await import("./valkey/overview");
  const overview = await valkeyModule.getValkeyOverview();

  const currentBarcodeCount =
    barcodeType === "Pos12" ? overview.availablePos12 : overview.availableGen16;
  console.log(`Current ${barcodeType} barcode count: ${currentBarcodeCount}`);

  const testCase = testPattens[testPattern];
  const totalBarcodeNeeded = testCase.numberProcess * testCase.couponPerProcess;

  if (currentBarcodeCount < totalBarcodeNeeded) {
    console.log(`Not enough ${barcodeType} barcodes available. Issue more`);

    const issueMoreNumber = totalBarcodeNeeded - currentBarcodeCount;

    let outputPath = "";
    if (barcodeType === "Pos12") {
      const pos12 = await import("./insert_barcode/pos12");
      outputPath = pos12.default(issueMoreNumber + 10000);
      console.log(`✅ POS12 codes generated successfully!`);
    } else if (barcodeType === "Gen16") {
      const gen16 = await import("./insert_barcode/general_16");
      outputPath = gen16.default(issueMoreNumber + 10000);
      console.log(`✅ General 16-digit codes generated successfully!`);
    }

    // else if (barcodeSubType === "Mos") {
    //   const mos = await import("./insert_barcode/coupon-mos");
    //   outputPath = mos.default(barcodeQuantity);
    //   console.log(`✅ MOS coupon codes generated successfully!`);
    // } else {
    //   throw new Error(`Unknown barcode sub-type: ${barcodeSubType}`);
    // }

    console.log(`📁 Output directory: ${outputPath}`);

    // Prompt for S3 upload
    const timestamp = generateTimestamp();
    const folderName = path.basename(outputPath);
    const customKey = `${folderName}-${timestamp}.zip`;
    const uploadToS3 = await import("./insert_barcode/upload-to-s3");
    const s3Url = await uploadToS3.default(folderName, customKey);
    console.log(`✅ Folder uploaded successfully to S3!`);
    console.log(`🌐 S3 URL: ${s3Url}`);

    const estimatedTimeInSecond = Math.ceil(issueMoreNumber / 200); // Assuming each process takes 10 seconds
    console.log(
      `⏳ Estimated time to process ${issueMoreNumber} barcodes: ${estimatedTimeInSecond} seconds`
    );
    // Log time will continue before sleep
    console.log(
      `⏳ Sleeping for ${estimatedTimeInSecond} seconds..., will continue at ${new Date(
        Date.now() + estimatedTimeInSecond * 1000
      ).toLocaleTimeString()}`
    );
    // sleep for the estimated time
    await new Promise((resolve) =>
      setTimeout(resolve, estimatedTimeInSecond * 1000)
    );

    while (true) {
      const overview = await valkeyModule.getValkeyOverview();

      // Sleep for 20 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 20000));

      const currentBarcodeCount =
        barcodeType === "Pos12"
          ? overview.availablePos12
          : overview.availableGen16;

      const time = new Date().toLocaleTimeString();
      console.log(
        ` [${time}]: Current ${barcodeType} barcode count: ${currentBarcodeCount}`
      );

      if (currentBarcodeCount >= totalBarcodeNeeded) {
        console.log(`✅ All required ${barcodeType} barcodes are available.`);
        break;
      }
    }
  }

  console.log(`Finished stage 1 for Test Case No: ${no}`);

  // STAGE 2: Execute the test case
  // Import bulk issue functions
  const bulkIssueModule = await import("./bulk_issue/state_machine");
  console.log(`Start stage 2 for Test Case No: ${no}`);
  //   if (barcodeType === "Mos") {
  // For MOS, also prompt for coupon code
  // const couponCode = await promptMosCouponCode();
  // const couponCode = "999999";
  // console.log(
  //   `\n🚀 Bulk issuing ${issuedNumber} MOS coupons with code: ${couponCode}...`
  // );
  // result = await bulkIssueModule.bulkIssueMos(issuedNumber, couponCode);
  //   } else if (barcodeType === "Pos12") {
  //     console.log(`\n🚀 Bulk issuing ${issuedNumber} Pos12 coupons...`);
  //     result = await bulkIssueModule.bulkIssuePos12(issuedNumber);
  //   } else if (barcodeType === "Gen16") {
  //     console.log(`\n🚀 Bulk issuing ${issuedNumber} Gen16 coupons...`);
  //     result = await bulkIssueModule.bulkIssueGen16(issuedNumber);
  //   }

  const results: {
    executionArn: string;
  }[] = [];
  for (let i = 0; i < testCase.numberProcess; i++) {
    console.log(
      `Processing test case ${i + 1} of ${testCase.numberProcess}...`
    );
    if (barcodeType === "Pos12") {
      console.log(
        `\n🚀 Bulk issuing ${testCase.couponPerProcess} Pos12 coupons...`
      );
      let result = await bulkIssueModule.bulkIssuePos12(
        testCase.couponPerProcess
      );
      results.push(result);
    } else if (barcodeType === "Gen16") {
      console.log(
        `\n🚀 Bulk issuing ${testCase.couponPerProcess} Gen16 coupons...`
      );
      let result = await bulkIssueModule.bulkIssueGen16(
        testCase.couponPerProcess
      );
      results.push(result);
    }
  }

  // Sleep 33 minutes to wait for the process to complete
  const sleepTime = 33 * 60 * 1000; // 33 minutes

  // Log sleep time and time to continue
  console.log(
    `⏳ Sleeping for ${
      sleepTime / 1000
    } seconds..., will continue at ${new Date(
      Date.now() + sleepTime
    ).toLocaleTimeString()}`
  );
  await new Promise((resolve) => setTimeout(resolve, sleepTime));

  const MAX_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hour

  for (const result of results) {
    await pollExecutionStatus(result.executionArn, 30000);
  }

  console.log(`Finished stage 2 for Test Case No: ${no}`);

  await log(
    no,
    results.map((r) => r.executionArn),
    "finished"
  );
};

export const executeTestCaseMos = async (params: {
  no: number;
  testPattern: keyof typeof testPattens;
}) => {
  const { no, testPattern } = params;

  // STAGE 1: Check if enough barcodes are available

  // Check if current barcode is enough
  const valkeyModule = await import("./valkey/overview");
  const overview = await valkeyModule.getValkeyOverview();

  console.log(overview);

  const mosAvailableCountDetail = overview.availableMosDetail;
  const testCase = testPattens[testPattern];

  const allowCouponCodes = ["999999", "777777", "123456", "654321"];
  const availableMosCount: Record<string, number> = {};
  for (const couponCode of allowCouponCodes) {
    const key = "dev-coupon-BarcodeMos-table:available:" + couponCode;
    const count = mosAvailableCountDetail[key] || 0;
    availableMosCount[couponCode] = count;
  }

  // Sort availableMosCount by value in descending order
  const sortedAvailableMosCount = Object.entries(availableMosCount).sort(
    ([, a], [, b]) => b - a
  );

  // Each process require a coupon code, check if enough codes are available
  for (let i = 0; i < testCase.numberProcess; i++) {
    const couponCode = sortedAvailableMosCount[i]?.[0] || 0;
    const available = sortedAvailableMosCount[i]?.[1] || 0;

    if (available < testCase.couponPerProcess) {
      console.log(`Not enough MOS barcodes available for process ${i + 1}.`);

      // TODO: Bulk issue more MOS barcodes
      // bulk issue couponPerProcess for couponCode
      const issueMoreNumber = testCase.couponPerProcess; // Because chance of duplicate is high, we issue the same number as required
      let outputPath = "";

      const mos = await import("./insert_barcode/coupon-mos");
      outputPath = mos.default(issueMoreNumber, couponCode.toString());
      console.log(`✅ MOS coupon codes generated successfully!`);
      console.log(`📁 Output directory: ${outputPath}`);

      // Prompt for S3 upload
      const timestamp = generateTimestamp();
      const folderName = path.basename(outputPath);
      const customKey = `${folderName}-${timestamp}.zip`;
      const uploadToS3 = await import("./insert_barcode/upload-to-s3");
      const s3Url = await uploadToS3.default(folderName, customKey);
      console.log(`✅ Folder uploaded successfully to S3!`);
      console.log(`🌐 S3 URL: ${s3Url}`);

      const estimatedTimeInSecond = Math.ceil(issueMoreNumber / 200); // Assuming each process takes 10 seconds
      console.log(
        `⏳ Estimated time to process ${issueMoreNumber} barcodes: ${estimatedTimeInSecond} seconds`
      );
      // Log time will continue before sleep
      console.log(
        `⏳ Sleeping for ${estimatedTimeInSecond} seconds..., will continue at ${new Date(
          Date.now() + estimatedTimeInSecond * 1000
        ).toLocaleTimeString()}`
      );
      // sleep for the estimated time
      await new Promise((resolve) =>
        setTimeout(resolve, estimatedTimeInSecond * 1000)
      );

      while (true) {
        const overview = await valkeyModule.getValkeyOverview();
        const targetCount =
          overview.availableMosDetail[
            `dev-coupon-BarcodeMos-table:available:${couponCode}`
          ] || 0;

        if (targetCount >= testCase.couponPerProcess) {
          console.log(
            `✅ All required MOS barcodes for coupon code ${couponCode} are available.`
          );
          break;
        }

        // Sleep for 20 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 20000));
      }
    }
  }
  console.log(`All required MOS barcodes are available.`);
  console.log(`Finished stage 1 for Test Case No: ${no}`);

  // STAGE 2: Execute the test case

  const bulkIssueModule = await import("./bulk_issue/state_machine");

  const results: {
    executionArn: string;
  }[] = [];

  for (let i = 0; i < testCase.numberProcess; i++) {
    const couponCode = sortedAvailableMosCount[i]?.[0];
    const issuedNumber = testCase.couponPerProcess;
    console.log(
      `\n🚀 Bulk issuing ${issuedNumber} MOS coupons with code: ${couponCode}...`
    );
    let result = await bulkIssueModule.bulkIssueMos(
      issuedNumber,
      couponCode as any
    );
    results.push(result);
  }

  // Sleep 33 minutes to wait for the process to complete
  const sleepTime = 33 * 60 * 1000; // 33 minutes

  // Log sleep time and time to continue
  console.log(
    `⏳ Sleeping for ${
      sleepTime / 1000
    } seconds..., will continue at ${new Date(
      Date.now() + sleepTime
    ).toLocaleTimeString()}`
  );
  await new Promise((resolve) => setTimeout(resolve, sleepTime));

  for (const result of results) {
    await pollExecutionStatus(result.executionArn, 30000);
  }

  console.log(`Finished stage 2 for Test Case No: ${no}`);

  await log(
    no,
    results.map((r) => r.executionArn),
    "finished"
  );
};

export const executeTestCases = async () => {
  const logData = await getLog();
  const executedTestCases = logData
    .filter((entry) => entry.status === "finished")
    .map((entry) => entry.testCaseNo);

  const newTestCases = testCases
    .filter((testCase) => testCase.status === "new")
    .filter((testCase) => !executedTestCases.includes(testCase.no));

  console.log("Executing test cases...");

  for (const testCase of newTestCases) {
    console.log(
      `************** Test Case No: ${testCase.no}, Barcode Type: ${testCase.barcodeType}, Test Pattern: ${testCase.testPattern}, Status: ${testCase.status}`
    );

    await executeTestCase(testCase);

    // break; // Remove this line to execute all test cases
  }

  console.log("All test cases executed.");
};
