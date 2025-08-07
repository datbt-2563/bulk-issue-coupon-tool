# Valkey Integration

## Overview
The `src/valkey/overview.ts` module provides functionality to interact with Valkey (Redis-compatible) services through AWS Lambda functions.

## Features
- **Lambda Integration**: Invokes AWS Lambda functions to interact with Valkey
- **Error Handling**: Comprehensive error handling with descriptive messages
- **TypeScript Support**: Full TypeScript typing and modern async/await patterns
- **Direct Usage**: Can be run directly or imported for programmatic use

## Configuration
- **Lambda Function**: `dev-coupon-DebugRedisFn-function`
- **Region**: `ap-northeast-1`
- **Invocation Type**: `RequestResponse` (synchronous)

## Functions

### `getValkeyOverview(): Promise<any>`
Invokes the Valkey debug Lambda function to retrieve an overview of the Redis/Valkey state.

**Parameters**: None

**Returns**: `Promise<any>` - The parsed JSON response from the Lambda function

**Usage**:
```typescript
import { getValkeyOverview } from './src/valkey/overview';

// Get Valkey overview
const overview = await getValkeyOverview();
console.log(overview);
```

## Usage Examples

### Command Line
```bash
# Run the overview function directly
npm run valkey-overview
```

### Programmatic Usage
```typescript
import getValkeyOverview from './src/valkey/overview';

async function checkValkeyStatus() {
  try {
    const overview = await getValkeyOverview();
    console.log('Valkey Status:', overview);
  } catch (error) {
    console.error('Failed to get Valkey overview:', error.message);
  }
}
```

### Integration with Main CLI
The function can be easily integrated into the main CLI by adding a new module option.

## Error Handling
The function includes comprehensive error handling for:
- Lambda invocation failures
- Network connectivity issues
- Payload parsing errors
- Missing or invalid responses

## AWS Credentials
Ensure AWS credentials are configured via:
- AWS CLI (`aws configure`)
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- IAM roles (if running on EC2)
- AWS credentials file

## Required Permissions
- `lambda:InvokeFunction` on the target Lambda function
- Appropriate VPC/networking permissions if Lambda is in a VPC

## Lambda Function Payload
The function sends the following payload to the Lambda:
```json
{
  "code": "overview"
}
```

## Response Format
The Lambda function should return a JSON response that will be parsed and returned by `getValkeyOverview()`.

## Development
- Source: `src/valkey/overview.ts`
- Build output: `dist/valkey/overview.js`
- Dependencies: `@aws-sdk/client-lambda`
