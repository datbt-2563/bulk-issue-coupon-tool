import * as fs from "fs";

const totalCodes: number = 100000; // Tổng số mã cần tạo
const codesPerFile: number = 1000; // Số mã mỗi file
const fileCount: number = totalCodes / codesPerFile; // Tổng số file
const allCodes: Set<string> = new Set(); // Tập hợp để lưu mã duy nhất
const path: string = `./general_number-e2e-${totalCodes}-rows`;

// Hàm kiểm tra điều kiện mã: phải là 16 chữ số
function isValidCode(code: string): boolean {
  return /^[0-9]{16}$/.test(code);
}

// Hàm tạo mã ngẫu nhiên
function generateCode(): string {
  return String(Math.floor(Math.random() * 1e16)).padStart(16, "0");
}

// Tạo mã duy nhất
while (allCodes.size < totalCodes) {
  const code: string = generateCode();
  if (isValidCode(code) && !allCodes.has(code)) {
    allCodes.add(code);
  }
}

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(path)) {
  fs.mkdirSync(path, { recursive: true });
  console.log(`📁 Đã tạo thư mục: ${path}`);
}

// Ghi mã vào các file CSV
const allCodesArray: string[] = Array.from(allCodes);
for (let i = 0; i < fileCount; i++) {
  const start: number = i * codesPerFile;
  const end: number = start + codesPerFile;
  const batch: string[] = allCodesArray.slice(start, end);
  const fileName: string = `${path}/codes_${i + 1}.csv`;

  fs.writeFileSync(fileName, batch.join("\n"), "utf8");
  console.log(`✅ Đã tạo file ${fileName} với ${batch.length} mã.`);
}

console.log(
  `🎉 Đã tạo tổng cộng ${totalCodes} mã, chia thành ${fileCount} file CSV.`
);
