import * as fs from "fs";
import * as path from "path";

const dir: string = __dirname;

fs.readdirSync(dir).forEach((file: string): void => {
  if (file.endsWith(".csv")) {
    fs.unlinkSync(path.join(dir, file));
    console.log(`Đã xóa file: ${file}`);
  }
});
console.log("✅ Đã xóa hết các file .csv trong thư mục.");
