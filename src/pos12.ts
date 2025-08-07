import * as fs from "fs";

const total: number = 1000000; // Tổng số lượng mã cần tạo
const perFile: number = 1000; // Số lượng mã mỗi file
const fileCount: number = total / perFile;
const path: string = `./coupon_kfc_pos_number-e2e-${total}-rows`;

if (!fs.existsSync(path)) {
  fs.mkdirSync(path, { recursive: true });
  console.log(`📁 Đã tạo thư mục: ${path}`);
}

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

const allCodes: Set<string> = new Set();

for (let i = 1; i <= fileCount; i++) {
  const unitCodes: string[] = generateUniqueUnitCodes(perFile, allCodes);
  // create folder

  const fileName: string = `${path}/unit_codes_total_${total}_${i}.csv`;
  fs.writeFileSync(fileName, unitCodes.join("\n"), "utf8");
  console.log(
    `✅ Đã tạo xong file ${fileName} chứa ${perFile} mã không trùng.`
  );
}

console.log(
  `🎉 Đã tạo tổng cộng ${total} mã, chia thành ${fileCount} file CSV.`
);
