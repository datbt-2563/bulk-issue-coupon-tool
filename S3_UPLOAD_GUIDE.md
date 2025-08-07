# S3 Upload Functionality

## Overview
The `src/upload-to-s3.ts` module provides functionality to upload generated coupon code folders to AWS S3 as zip archives.

## Features
- **Automatic Zipping**: Compresses entire output folders into zip archives
- **S3 Upload**: Uploads compressed files to the specified S3 bucket
- **Error Handling**: Comprehensive error handling and cleanup
- **CLI Integration**: Available through the interactive CLI
- **Direct Usage**: Can be run directly with folder names

## Configuration
- **Bucket**: `dev-coupon-code-source-bucket-ap-northeast-1`
- **Region**: `ap-northeast-1`
- **Compression**: Maximum compression (level 9)

## Usage

### Via Interactive CLI
```bash
npm start
# Select "Upload" from the menu
# Choose a folder from the available options
```

### Direct Command Line
```bash
npm run upload-s3 <folder-name>
# Example: npm run upload-s3 pos12_codes_20250807_143022
```

### Programmatic Usage
```typescript
import uploadFolderToS3 from './src/upload-to-s3';

const s3Url = await uploadFolderToS3('pos12_codes_20250807_143022');
console.log(`Uploaded to: ${s3Url}`);
```

## AWS Credentials
Make sure your AWS credentials are configured via:
- AWS CLI (`aws configure`)
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- IAM roles (if running on EC2)
- AWS credentials file

## S3 Permissions Required
- `s3:PutObject` on the target bucket
- `s3:PutObjectAcl` (if setting ACLs)

## File Structure
- Source folder: `output/<folder-name>/`
- Temporary zip: `output/temp/<folder-name>.zip`
- S3 object key: `<folder-name>.zip`
- S3 URL: `https://dev-coupon-code-source-bucket-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/<folder-name>.zip`

## Error Handling
- Validates folder existence
- Handles zipping errors
- Manages S3 upload failures
- Automatic cleanup of temporary files
- Descriptive error messages
