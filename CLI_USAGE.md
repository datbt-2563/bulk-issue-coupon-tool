# CLI Usage Guide

## Interactive CLI

The bulk coupon tool now includes an interactive CLI that makes it easy to generate different types of barcodes.

### How to use:

1. **Start the CLI:**
   ```bash
   npm start
   ```

2. **Follow the prompts:**
   - Select a barcode type from the menu:
     - **Pos12**: Generate POS unit codes with pattern A[13digits]C
     - **Gen16**: Generate 16-digit general codes  
     - **Mos**: Generate MOS coupon codes with pattern B[6digits]2[6digits]B
     - **Clean**: Delete all CSV files in current and output directories
     - **Upload**: Upload a generated folder to S3 as a zip archive

3. **Enter quantity or select folder:**
   - For barcode generation types, you'll be prompted to enter the number of codes to generate
   - For the Upload option, you'll be shown a list of available folders to upload
   - The Clean option doesn't require additional input

4. **View results:**
   - Generated files will be saved in the `output/` directory
   - The CLI will display the output location when complete

### Alternative commands:

- **Development mode:** `npm run dev` (same as npm start)
- **Production mode:** `npm run build && npm run start:prod`
- **Direct module execution:** 
  - `npm run pos12`
  - `npm run general-16` 
  - `npm run coupon-mos`
  - `npm run deleted-csv`
  - `npm run upload-s3 <folder-name>`

### Example Sessions:

**Generating codes:**
```
🎫 Bulk Issue Coupon Tool
========================================
? Select a barcode type: Pos12 - Generate POS unit codes with pattern A[13digits]C
? Enter the quantity to generate: 100000

🚀 Running Pos12 with quantity 100000...
✅ POS12 codes generated successfully!
📁 Output directory: /path/to/output/pos12_codes_20250807_143022
```

**Uploading to S3:**
```
🎫 Bulk Issue Coupon Tool
========================================
? Select a barcode type: Upload - Upload a generated folder to S3 as a zip archive
? Select a folder to upload: pos12_codes_20250807_143022

🚀 Running Upload...
📁 Preparing to zip folder: /path/to/output/pos12_codes_20250807_143022
📦 Archive created: 45231 total bytes
⬆️ Uploading pos12_codes_20250807_143022.zip to S3...
✅ Folder uploaded successfully to S3!
🌐 S3 URL: https://dev-coupon-code-source-bucket-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/pos12_codes_20250807_143022.zip
```

All generated files are organized in the `output/` directory with timestamped folders for easy management.
