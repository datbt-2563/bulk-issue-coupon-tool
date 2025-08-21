import * as fs from "fs";
import * as path from "path";

// Hàm kiểm tra điều kiện coupon-mos: theo regex /^B[0-9]{6}2[0-9]{6}B$/
function isValidCoupon(code: string): boolean {
  return /^B[0-9]{6}2[0-9]{6}B$/.test(code);
}

// Tạo mã coupon duy nhất
function generateCouponCode(first6CouponCode: string, after2: string): string {
  return `B${first6CouponCode}2${after2}B`;
}

// Sinh số lượng mã yêu cầu, đảm bảo duy nhất
function generateUniqueCoupons(count: number, couponCode?: string): string[] {
  const allCodes: Set<string> = new Set(); // Tập hợp để lưu mã duy nhất
  const first6CouponCode: string = couponCode || "777777"; // Coupon code ????

  for (let i = 0; i <= 999999 && allCodes.size < count; i++) {
    const after2: string = String(i).padStart(6, "0");
    const code: string = generateCouponCode(first6CouponCode, after2);

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
function writeCouponsToFiles(
  total: number,
  codesPerFile: number,
  couponCode?: string
): string {
  const allCoupons: string[] = generateUniqueCoupons(total, couponCode);
  const fileCount: number = Math.ceil(allCoupons.length / codesPerFile);

  // Ensure output directory exists
  const outputDir: string = "output";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const targetDir: string = path.join(
    outputDir,
    `coupon_mos_pos_number-e2e-${total}`
  );

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`📁 Đã tạo thư mục: ${targetDir}`);
  }

  const filePrefix: string = "coupon_mos_";

  for (let i = 0; i < fileCount; i++) {
    const start: number = i * codesPerFile;
    const end: number = start + codesPerFile;
    const batch: string[] = allCoupons.slice(start, end);
    const fileName: string = path.join(targetDir, `${filePrefix}${i + 1}.csv`);

    fs.writeFileSync(fileName, batch.join("\n") + "\n", "utf8");
    console.log(`✅ Đã ghi ${batch.length} mã vào file ${fileName}`);
  }

  return targetDir;
}

export default function generate(
  totalCodes: number = 1000000,
  couponCode?: string
): string {
  const codesPerFile: number = 1000;
  console.log(`🚀 Bắt đầu tạo ${totalCodes} mã MOS coupon...`);
  const outputPath = writeCouponsToFiles(totalCodes, codesPerFile, couponCode);
  console.log(`🎉 Hoàn thành! Files được lưu tại: ${outputPath}`);
  return outputPath;
}

// Run directly if this file is executed
if (require.main === module) {
  generate();
}
