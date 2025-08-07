import * as fs from "fs";

const total: number = 1000000; // Tổng số mã cần tạo
const codesPerFile: number = 1000; // Số mã mỗi file
const filePrefix: string = "coupon_mos_"; // Tên file
const allCodes: Set<string> = new Set(); // Tập hợp để lưu mã duy nhất
const path: string = `./coupon_mos_pos_number-e2e-${total}`;

if (!fs.existsSync(path)) {
  fs.mkdirSync(path, { recursive: true });
  console.log(`📁 Đã tạo thư mục: ${path}`);
}

// Hàm kiểm tra điều kiện coupon-mos: theo regex /^B[0-9]{6}2[0-9]{6}B$/
function isValidCoupon(code: string): boolean {
  return /^B[0-9]{6}2[0-9]{6}B$/.test(code);
}

// Tạo mã coupon duy nhất
function generateCouponCode(first6: string, after2: string): string {
  return `B${first6}2${after2}B`;
}

// Sinh số lượng mã yêu cầu, đảm bảo duy nhất
function generateUniqueCoupons(count: number): string[] {
  const first6: string = "777777";

  for (let i = 0; i <= 999999 && allCodes.size < count; i++) {
    const after2: string = String(i).padStart(6, "0");
    const code: string = generateCouponCode(first6, after2);

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
function writeCouponsToFiles(total: number, codesPerFile: number): void {
  const allCoupons: string[] = generateUniqueCoupons(total);
  const fileCount: number = Math.ceil(allCoupons.length / codesPerFile);

  for (let i = 0; i < fileCount; i++) {
    const start: number = i * codesPerFile;
    const end: number = start + codesPerFile;
    const batch: string[] = allCoupons.slice(start, end);
    const fileName: string = `${path}/${filePrefix}${i + 1}.csv`;

    fs.writeFileSync(fileName, batch.join("\n"), "utf8");
    console.log(`✅ Đã ghi ${batch.length} mã vào file ${fileName}`);
  }
}

writeCouponsToFiles(total, codesPerFile);
