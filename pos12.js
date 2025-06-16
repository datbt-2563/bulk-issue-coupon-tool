const fs = require('fs');
const total = 1000000; // Tổng số lượng mã cần tạo
const perFile = 1000; // Số lượng mã mỗi file
const fileCount = total / perFile;
const path = `./coupon_kfc_pos_number-e2e-${total}-rows`;

if (!fs.existsSync(path)) {
  fs.mkdirSync(path, { recursive: true });
  console.log(`📁 Đã tạo thư mục: ${path}`);
}

function generateRandom13Digits() {
  // Tạo một chuỗi 13 chữ số, đảm bảo không bị thiếu số 0 ở đầu
  return String(Math.floor(Math.random() * 1e13)).padStart(13, '0');
}

function generateUniqueUnitCodes(count, existingCodes) {
  const codes = new Set();
  while (codes.size < count) {
    const code = `A${generateRandom13Digits()}C`.trim();
    if (!existingCodes.has(code)) {
      codes.add(code);
      existingCodes.add(code);
    }
  }
  return Array.from(codes);
}

const allCodes = new Set();

for (let i = 1; i <= fileCount; i++) {
  const unitCodes = generateUniqueUnitCodes(perFile, allCodes);
  // create folder 
  
  const fileName = `${path}/unit_codes_total_${total}_${i}.csv`;
  fs.writeFileSync(fileName, unitCodes.join('\n'), 'utf8');
  console.log(`✅ Đã tạo xong file ${fileName} chứa ${perFile} mã không trùng.`);
}

console.log(`🎉 Đã tạo tổng cộng ${total} mã, chia thành ${fileCount} file CSV.`);