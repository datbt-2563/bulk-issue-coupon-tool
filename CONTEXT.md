# CONTEXT.md - Bulk Issue Coupon Tool

## Project Overview

The **Bulk Issue Coupon Tool** is a TypeScript-based CLI application for generating, managing, and issuing coupon codes at scale. It provides interactive barcode generation, AWS cloud integration, and bulk processing capabilities for enterprise coupon management systems.

## Primary Features

### Core Barcode Generation
- **Pos12**: POS unit codes with pattern `A[13digits]C`
- **Gen16**: 16-digit general codes
- **Mos**: MOS coupon codes with pattern `B[6digits]2[6digits]B`
- Generates up to 1M+ codes with duplicate prevention
- Outputs CSV files in organized folder structure

### AWS Cloud Integration
- **S3 Upload**: Automatic zip compression and upload to S3 bucket
- **Lambda Integration**: Redis/Valkey overview via Lambda functions
- **Step Functions**: Bulk coupon issuance via state machine execution

### Interactive CLI
- Menu-driven interface using Inquirer.js
- Input validation and error handling
- Upload confirmations and workflow controls
- CSV cleanup utilities

## Project Structure

```
src/
├── index.ts                    # Main CLI entrypoint
├── insert_barcode/            # Barcode generation modules
│   ├── coupon-mos.ts          # MOS barcode generation
│   ├── deleted-csv.ts         # CSV cleanup utility
│   ├── general_16.ts          # 16-digit code generation
│   ├── pos12.ts               # POS12 code generation
│   ├── upload-to-s3.ts        # S3 upload functionality
│   └── index.ts               # Barcode module exports
├── valkey/                    # Redis/Valkey integration
│   └── overview.ts            # Lambda-based Redis overview
└── bulk_issue/               # AWS Step Functions integration
    └── state_machine.ts       # Bulk issue state machine
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- TypeScript
- AWS CLI configured with appropriate credentials

### Dependencies Installation
```bash
npm install
```

### Key Dependencies
```json
{
  "@aws-sdk/client-lambda": "^3.862.0",
  "@aws-sdk/client-s3": "^3.862.0",
  "@aws-sdk/client-sfn": "^3.862.0",
  "archiver": "^7.0.1",
  "inquirer": "^12.9.0",
  "uuid": "^11.1.0"
}
```

## Core Commands & Scripts

### CLI Operations
```bash
# Start interactive CLI
npm start

# Development mode
npm run dev

# Production build and run
npm run build && npm run start:prod
```

### Direct Module Execution
```bash
npm run pos12          # Generate Pos12 codes
npm run general-16     # Generate Gen16 codes
npm run coupon-mos     # Generate Mos codes
npm run deleted-csv    # Clean CSV files
npm run upload-s3      # Upload to S3
npm run valkey-overview # Redis overview
npm run bulk-issue     # Bulk issue via Step Functions
```

### Build Operations
```bash
npm run build          # TypeScript compilation
```

## AWS Configuration

### Required AWS Services
- **Region**: `ap-northeast-1`
- **S3 Bucket**: `softbank-pos-coupon-csv-bucket`
- **Lambda Function**: `dev-coupon-DebugRedisFn-function`
- **Step Functions**: `dev-coupon-bulkIssuedCoupon-machine`
- **Account ID**: `856562439801`

### AWS Credentials Setup
Configure via one of:
- AWS CLI: `aws configure`
- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- IAM roles (EC2 instances)
- AWS credentials file

### Required IAM Permissions
```json
{
  "S3": ["s3:PutObject", "s3:PutObjectAcl"],
  "Lambda": ["lambda:InvokeFunction"],
  "StepFunctions": ["states:StartExecution"]
}
```

## Key Architecture Components

### Barcode Generation Engine
- **File Output**: `output/` directory with timestamped folders
- **Format**: CSV files with configurable batch sizes
- **Scale**: Optimized for 1M+ code generation
- **Validation**: Built-in duplicate prevention

### S3 Upload System
- **Compression**: Maximum compression zip archives
- **Naming**: Timestamped S3 keys for versioning
- **Error Handling**: Automatic cleanup and retry logic
- **Integration**: Post-generation upload prompts

### AWS Lambda Integration
```typescript
// Valkey overview function
const overview = await getValkeyOverview();
// Returns: Redis statistics and connection info
```

### Step Functions Integration
```typescript
// Bulk issue examples
await bulkIssueGen16(quantity);
await bulkIssuePos12(quantity);
await bulkIssueMos(quantity, couponCode);
```

## Bulk Issue Configuration

### Coupon Type Configurations

#### Gen16 Payload
```typescript
{
  couponMasterId: "3812681c-5867-45cc-b62c-7df7a39b3a24",
  barcodeSource: "CouponGeneral16Barcode",
  batchSize: 10,
  publishedFrom: "admin",
  publishedOrganizationId: "5d121455-d98c-417d-88e4-7381f442e921"
}
```

#### Pos12 Payload
```typescript
{
  couponMasterId: "4945b79f-f311-4189-b75c-6b07776ab951",
  barcodeSource: "CouponPos12Barcode",
  batchSize: 10,
  publishedFrom: "admin",
  publishedOrganizationId: "5d121455-d98c-417d-88e4-7381f442e921"
}
```

#### Mos Payload
```typescript
{
  couponMasterId: "dd54ac3c-6f17-4be6-a35e-e6b5b9b06e4e",
  barcodeSource: "CouponMosBarcode",
  batchSize: 10,
  couponCode: "[user-provided]",
  publishedFrom: "admin",
  publishedOrganizationId: "5d121455-d98c-417d-88e4-7381f442e921"
}
```

## API Endpoints & Functions

### Core Exported Functions

#### Barcode Generation
```typescript
// Generate codes and return output path
pos12.default(quantity: number): string
general16.default(quantity: number): string
couponMos.default(quantity: number): string
```

#### AWS Operations
```typescript
// S3 upload with optional custom key
uploadToS3.default(folderName: string, customKey?: string): Promise<string>

// Lambda invocation for Valkey overview
getValkeyOverview(): Promise<any>

// Step Functions execution
invokeBulkIssueStateMachine(payload: Record<string, any>): Promise<any>
```

## Critical Notes & Warnings

### Security Considerations
- **AWS Credentials**: Never commit AWS credentials to version control
- **S3 Bucket**: Ensure proper bucket policies and access controls
- **Lambda Functions**: Validate input/output for production use

### Performance Notes
- **Large Scale Generation**: Memory usage scales with quantity
- **S3 Upload**: Large files may require timeout adjustments
- **Step Functions**: Executions are asynchronous, monitor via AWS console

### Development Warnings
- **Account ID**: Replace hardcoded account ID `856562439801` in production
- **Environment Config**: Use environment variables for production deployment
- **Error Handling**: All AWS operations include retry logic but may fail on network issues

### File System
- **Output Directory**: Auto-created at `./output/`
- **Temporary Files**: Cleaned up automatically after S3 upload
- **CSV Format**: Headers included, comma-separated values

## Troubleshooting

### Common Issues
1. **AWS Credentials**: Ensure proper AWS CLI configuration
2. **TypeScript Errors**: Run `npm run build` to check compilation
3. **Missing Dependencies**: Run `npm install` if modules missing
4. **S3 Upload Fails**: Check bucket permissions and region settings
5. **Lambda Timeout**: Increase timeout if Valkey operations take too long

### Debug Commands
```bash
# Check TypeScript compilation
npm run build

# Test CLI startup
timeout 3s npm start

# Verify AWS credentials
aws sts get-caller-identity
```

## Development Guidelines

### Code Structure
- **TypeScript**: Strict typing enforced
- **Modular Design**: Each feature in separate module
- **Error Handling**: Comprehensive try/catch blocks
- **Async Operations**: Modern async/await patterns

### Testing
- **Manual Testing**: Interactive CLI testing recommended
- **AWS Services**: Test with development credentials first
- **Scale Testing**: Verify performance with large quantities

### Extension Points
- **New Barcode Types**: Add to `src/insert_barcode/`
- **AWS Services**: Extend in respective service folders
- **CLI Options**: Add to main menu in `src/index.ts`

---

This context document provides the essential information for understanding, maintaining, and extending the Bulk Issue Coupon Tool. All features are production-ready with proper AWS credentials configuration.
