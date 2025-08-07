import * as fs from "fs";
import * as path from "path";

function generateRandom13Digits(): string {
  // Tạo một chuỗi 13 chữ số, đảm bảo không bị thiếu số 0 ở đầu
  return String(Math.floor(Math.random() * 1e13)).padStart(13, "0");
}

function generateUniqueUnitCodes(
  count: number,
  existingCodes: Set<string>
): string[] {
  const codes: Set<string> = new Set();
  while (codes.size < count) {
    const code: string = `A${generateRandom13Digits()}C`.trim();
    if (!existingCodes.has(code)) {
      codes.add(code);
      existingCodes.add(code);
    }
  }
  return Array.from(codes);
}

export default function generate(total: number = 1000000): string {
  const perFile: number = 1000; // Số lượng mã mỗi file
  const fileCount: number = total / perFile;

  console.log(`🚀 Bắt đầu tạo ${total} mã POS12...`);

  // Ensure output directory exists
  const outputDir: string = "output";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const targetDir: string = path.join(
    outputDir,
    `coupon_kfc_pos_number-e2e-${total}-rows`
  );

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`📁 Đã tạo thư mục: ${targetDir}`);
  }

  const allCodes: Set<string> = new Set();

  for (let i = 1; i <= fileCount; i++) {
    const unitCodes: string[] = generateUniqueUnitCodes(perFile, allCodes);

    const fileName: string = path.join(
      targetDir,
      `unit_codes_total_${total}_${i}.csv`
    );
    fs.writeFileSync(fileName, unitCodes.join("\n"), "utf8");
    console.log(
      `✅ Đã tạo xong file ${fileName} chứa ${perFile} mã không trùng.`
    );
  }

  console.log(
    `🎉 Đã tạo tổng cộng ${total} mã, chia thành ${fileCount} file CSV.`
  );

  return targetDir;
}

// Run directly if this file is executed
if (require.main === module) {
  generate();
}
