const fs = require('fs');

const total = 1000000; // Tổng số mã cần tạo
const codesPerFile = 1000; // Số mã mỗi file
const filePrefix = 'coupon_mos_'; // Tên file
const allCodes = new Set(); // Tập hợp để lưu mã duy nhất
const path = `./coupon_mos_pos_number-e2e-${total}`;

if (!fs.existsSync(path)) {
  fs.mkdirSync(path, { recursive: true });
  console.log(`📁 Đã tạo thư mục: ${path}`);
}

// Hàm kiểm tra điều kiện coupon-mos: theo regex /^B[0-9]{6}2[0-9]{6}B$/
function isValidCoupon(code) {
  return /^B[0-9]{6}2[0-9]{6}B$/.test(code);
}

// Tạo mã coupon duy nhất
function generateCouponCode(first6, after2) {
  return `B${first6}2${after2}B`;
}

// Sinh số lượng mã yêu cầu, đảm bảo duy nhất
function generateUniqueCoupons(count) {
  const first6 = '777777';

  for (let i = 0; i <= 999999 && allCodes.size < count; i++) {
    const after2 = String(i).padStart(6, '0');
    const code = generateCouponCode(first6, after2);

    if (isValidCoupon(code)) {
      allCodes.add(code);
    }
  }

  if (allCodes.size < count) {
    console.warn(`⚠️ Không đủ mã hợp lệ để tạo ${count} mã.`);
  }

  return Array.from(allCodes);
}

// Ghi mã vào các file CSV
function writeCouponsToFiles(total, codesPerFile) {
  const allCoupons = generateUniqueCoupons(total);
  const fileCount = Math.ceil(allCoupons.length / codesPerFile);

  for (let i = 0; i < fileCount; i++) {
    const start = i * codesPerFile;
    const end = start + codesPerFile;
    const batch = allCoupons.slice(start, end);
    const fileName = `${path}/${filePrefix}${i + 1}.csv`;

    fs.writeFileSync(fileName, batch.join('\n'), 'utf8');
    console.log(`✅ Đã ghi ${batch.length} mã vào file ${fileName}`);
  }
}

writeCouponsToFiles(total, codesPerFile);
