# Bulk Issue State Machine Integration

## Overview
The `src/bulk_issue/state_machine.ts` module provides functionality to invoke AWS Step Functions state machine for bulk coupon issuance operations.

## Features
- **State Machine Integration**: Invokes AWS Step Functions for bulk operations
- **Multiple Coupon Types**: Supports Gen16, Pos12, and MOS coupon types
- **Configurable Payloads**: Pre-configured payloads for different coupon types
- **Error Handling**: Comprehensive error handling with descriptive messages
- **TypeScript Support**: Full TypeScript typing and modern async/await patterns

## Configuration
- **State Machine**: `dev-coupon-bulkIssuedCoupon-machine`
- **Region**: `ap-northeast-1`
- **ARN Pattern**: `arn:aws:states:ap-northeast-1:<accountId>:stateMachine:dev-coupon-bulkIssuedCoupon-machine`

**Important**: Replace `<accountId>` with your actual AWS account ID in production.

## Core Functions

### `invokeBulkIssueStateMachine(payload: Record<string, any>): Promise<any>`
Core function that starts state machine execution.

**Parameters**:
- `payload`: Object containing the state machine input data

**Returns**: Promise resolving to execution metadata:
```typescript
{
  executionArn: string,
  startDate: Date,
  success: boolean,
  message: string
}
```

## Wrapper Functions

### `bulkIssueGen16(issuedNumber: number): Promise<any>`
Issues Gen16 (16-digit general) coupons.

**Payload Configuration**:
```typescript
{
  couponMasterId: "3812681c-5867-45cc-b62c-7df7a39b3a24",
  issuedNumber,
  barcodeSource: "CouponGeneral16Barcode",
  batchSize: 10,
  publishedFrom: "admin",
  publishedOrganizationId: "5d121455-d98c-417d-88e4-7381f442e921",
  publishedOrganizationName: "e2e organization",
  fifo: false,
  description: "e2e test"
}
```

### `bulkIssuePos12(issuedNumber: number): Promise<any>`
Issues Pos12 (POS unit codes) coupons.

**Payload Configuration**:
```typescript
{
  couponMasterId: "4945b79f-f311-4189-b75c-6b07776ab951",
  issuedNumber,
  barcodeSource: "CouponPos12Barcode",
  batchSize: 10,
  publishedFrom: "admin",
  publishedOrganizationId: "5d121455-d98c-417d-88e4-7381f442e921",
  publishedOrganizationName: "e2e organization",
  fifo: false,
  description: "e2e test"
}
```

### `bulkIssueMos(issuedNumber: number, couponCode: string): Promise<any>`
Issues MOS coupons with specific coupon code.

**Parameters**:
- `issuedNumber`: Number of coupons to issue
- `couponCode`: The specific coupon code to use

**Payload Configuration**:
```typescript
{
  couponMasterId: "a5f2ffaf-8d28-466f-a57a-1dd0100f09bc",
  couponCode,
  issuedNumber,
  barcodeSource: "CouponMosBarcode",
  batchSize: 10,
  publishedFrom: "admin",
  publishedOrganizationId: "11c67b7c-793e-41c9-8804-8f6c368afb81",
  publishedOrganizationName: "e2e",
  description: "e2e"
}
```

## Usage Examples

### Command Line Testing
```bash
# Test all bulk issue functions
npm run bulk-issue
```

### Programmatic Usage

#### Gen16 Bulk Issue
```typescript
import { bulkIssueGen16 } from './src/bulk_issue/state_machine';

const result = await bulkIssueGen16(100);
console.log('Execution ARN:', result.executionArn);
```

#### Pos12 Bulk Issue
```typescript
import { bulkIssuePos12 } from './src/bulk_issue/state_machine';

const result = await bulkIssuePos12(50);
console.log('Started at:', result.startDate);
```

#### MOS Bulk Issue
```typescript
import { bulkIssueMos } from './src/bulk_issue/state_machine';

const result = await bulkIssueMos(25, "SUMMER2025");
console.log('Success:', result.success);
```

#### Core Function Usage
```typescript
import { invokeBulkIssueStateMachine } from './src/bulk_issue/state_machine';

const customPayload = {
  couponMasterId: "custom-id",
  issuedNumber: 10,
  // ... other properties
};

const result = await invokeBulkIssueStateMachine(customPayload);
```

## State Machine Execution Flow

1. **Function Call**: User calls one of the wrapper functions
2. **Payload Construction**: Function builds appropriate payload
3. **Execution Start**: `StartExecutionCommand` initiates state machine
4. **Return Metadata**: Returns execution ARN and start time
5. **Async Processing**: State machine processes in background

**Note**: The functions start execution but don't wait for completion. For synchronous operations, additional polling logic would be needed.

## Error Handling

### Common Error Scenarios
- **Invalid Credentials**: AWS credentials not configured
- **Permission Denied**: Insufficient IAM permissions
- **Invalid State Machine ARN**: Incorrect account ID or region
- **Malformed Payload**: Invalid input data structure
- **Network Issues**: AWS API connectivity problems

### Error Response Format
```typescript
throw new Error(`Failed to invoke bulk issue state machine: ${errorMessage}`);
```

## AWS Requirements

### Credentials
Configure AWS credentials via:
- AWS CLI (`aws configure`)
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- IAM roles (if running on EC2)
- AWS credentials file

### IAM Permissions
Required permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "states:StartExecution",
        "states:DescribeExecution"
      ],
      "Resource": "arn:aws:states:ap-northeast-1:<accountId>:stateMachine:dev-coupon-bulkIssuedCoupon-machine"
    }
  ]
}
```

## Configuration Notes

### Account ID
Update the `STATE_MACHINE_ARN` constant with your actual AWS account ID:
```typescript
const STATE_MACHINE_ARN = "arn:aws:states:ap-northeast-1:123456789012:stateMachine:dev-coupon-bulkIssuedCoupon-machine";
```

### Batch Processing
- Default batch size: 10 coupons per batch
- Configurable via payload `batchSize` property
- Larger batches may improve throughput but consume more resources

### Organization IDs
The module uses pre-configured organization IDs:
- Gen16/Pos12: `5d121455-d98c-417d-88e4-7381f442e921`
- MOS: `11c67b7c-793e-41c9-8804-8f6c368afb81`

## Development
- Source: `src/bulk_issue/state_machine.ts`
- Build output: `dist/bulk_issue/state_machine.js`
- Dependencies: `@aws-sdk/client-sfn`
- Test script: `npm run bulk-issue`
