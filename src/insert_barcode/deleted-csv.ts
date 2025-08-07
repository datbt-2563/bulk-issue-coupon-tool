import * as fs from "fs";
import * as path from "path";

// Function to recursively find and delete CSV files
function deleteCsvFiles(dirPath: string): number {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  let deletedCount = 0;
  const items: string[] = fs.readdirSync(dirPath);

  items.forEach((item: string): void => {
    const itemPath: string = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Recursively check subdirectories
      deletedCount += deleteCsvFiles(itemPath);
    } else if (item.endsWith(".csv")) {
      fs.unlinkSync(itemPath);
      console.log(`Đã xóa file: ${itemPath}`);
      deletedCount++;
    }
  });

  return deletedCount;
}

// Export function for CLI use
export default function clean(): string {
  const directories: string[] = [process.cwd(), "output"];
  let totalDeleted = 0;

  directories.forEach((dir: string): void => {
    const deleted = deleteCsvFiles(dir);
    totalDeleted += deleted;
  });

  const message =
    totalDeleted > 0
      ? `✅ Đã xóa tổng cộng ${totalDeleted} file .csv trong các thư mục.`
      : "✅ Không tìm thấy file .csv nào để xóa.";

  console.log(message);
  return message;
}

// Run directly if called as main module
if (require.main === module) {
  clean();
}
