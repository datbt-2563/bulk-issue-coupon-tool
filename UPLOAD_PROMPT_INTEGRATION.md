# Upload Prompt Integration Summary

## Changes Made

### 1. Enhanced CLI Workflow
The interactive CLI now includes automatic upload prompts after code generation for `Pos12`, `Gen16`, and `Mos` modules.

### 2. New Functions Added to `src/insert_barcode/index.ts`

#### `promptUploadConfirmation(): Promise<boolean>`
- Presents a yes/no confirmation prompt asking if user wants to upload to S3
- Uses inquirer's `confirm` prompt type
- Returns boolean indicating user's choice

#### `generateTimestamp(): string`
- Creates timestamp in format `YYYYMMDD_HH_MM_SS`
- Uses zero-padded values for all components
- Example: `20250807_14_30_25`

### 3. Enhanced `uploadFolderToS3` Function in `src/insert_barcode/upload-to-s3.ts`

#### Updated Signature:
```typescript
export default async function uploadFolderToS3(
  folderName: string,
  customS3Key?: string
): Promise<string>
```

#### New Features:
- Optional `customS3Key` parameter for custom S3 object names
- When provided, uses custom key instead of default `${folderName}.zip`
- Maintains backward compatibility (default behavior unchanged)

### 4. Updated Code Generation Flow

#### For Each Generation Module (Pos12, Gen16, Mos):
1. **Generate codes** as normal
2. **Display success message** with output directory
3. **Prompt for upload** with "Do you want to upload the generated file to S3 now?"
4. **If YES**:
   - Generate timestamp (e.g., `20250807_14_30_25`)
   - Create custom S3 key (e.g., `pos12-20250807_14_30_25.zip`)
   - Upload folder with custom key
   - Display S3 URL
5. **If NO**:
   - Display "Upload skipped" message
   - Continue normally

### 5. Custom S3 Key Format
- Pattern: `{moduleType}-{timestamp}.zip`
- Examples:
  - `pos12-20250807_14_30_25.zip`
  - `gen16-20250807_14_35_12.zip`
  - `mos-20250807_14_40_58.zip`

### 6. Preserved Functionality
- ✅ All existing code generation logic unchanged
- ✅ Manual upload option still available via "Upload" menu choice
- ✅ Clean functionality unchanged
- ✅ All TypeScript types preserved
- ✅ Error handling maintained

## Example User Flow

```
🎫 Bulk Issue Coupon Tool
========================================
? Select a barcode type: Pos12 - Generate POS unit codes with pattern A[13digits]C
? Enter the quantity to generate: 1000

🚀 Running Pos12 with quantity 1000...
✅ POS12 codes generated successfully!
📁 Output directory: /path/to/output/pos12_codes_20250807_143025
? Do you want to upload the generated file to S3 now? Yes
📁 Preparing to zip folder: /path/to/output/pos12_codes_20250807_143025
📦 Archive created: 45231 total bytes
⬆️ Uploading pos12-20250807_14_30_25.zip to S3...
✅ Folder uploaded successfully to S3!
🌐 S3 URL: https://dev-coupon-code-source-bucket-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/pos12-20250807_14_30_25.zip
```

## Build & Testing
- ✅ TypeScript compilation successful
- ✅ CLI starts correctly
- ✅ All menu options available
- ✅ No breaking changes to existing functionality
