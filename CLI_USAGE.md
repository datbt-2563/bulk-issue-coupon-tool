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

3. **Enter quantity (if applicable):**
   - For barcode generation types, you'll be prompted to enter the number of codes to generate
   - The Clean option doesn't require a quantity

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

### Example Session:
```
🎫 Bulk Issue Coupon Tool
========================================
? Select a barcode type: Pos12 - Generate POS unit codes with pattern A[13digits]C
? Enter the quantity to generate: 100000

🚀 Running Pos12 with quantity 100000...
✅ POS12 codes generated successfully!
📁 Output directory: /path/to/output/pos12_codes_20250807_143022
```

All generated files are organized in the `output/` directory with timestamped folders for easy management.
