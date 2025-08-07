const fs = require('fs');

const totalCodes = 100000; // Tổng số mã cần tạo
const codesPerFile = 1000; // Số mã mỗi file
const fileCount = totalCodes / codesPerFile; // Tổng số file
const allCodes = new Set(); // Tập hợp để lưu mã duy nhất
const path = `./general_number-e2e-${totalCodes}-rows`; 

// Hàm kiểm tra điều kiện mã: phải là 16 chữ số
function isValidCode(code) {
  return /^[0-9]{16}$/.test(code);
}

// Hàm tạo mã ngẫu nhiên
function generateCode() {
  return String(Math.floor(Math.random() * 1e16)).padStart(16, '0');
}

// Tạo mã duy nhất
while (allCodes.size < totalCodes) {
  const code = generateCode();
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
const allCodesArray = Array.from(allCodes);
for (let i = 0; i < fileCount; i++) {
  const start = i * codesPerFile;
  const end = start + codesPerFile;
  const batch = allCodesArray.slice(start, end);
  const fileName = `${path}/codes_${i + 1}.csv`;

  fs.writeFileSync(fileName, batch.join('\n'), 'utf8');
  console.log(`✅ Đã tạo file ${fileName} với ${batch.length} mã.`);
}

console.log(`🎉 Đã tạo tổng cộng ${totalCodes} mã, chia thành ${fileCount} file CSV.`);