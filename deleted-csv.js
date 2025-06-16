const fs = require('fs');
const path = require('path');

const dir = __dirname;

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.csv')) {
    fs.unlinkSync(path.join(dir, file));
    console.log(`Đã xóa file: ${file}`);
  }
});
console.log('✅ Đã xóa hết các file .csv trong thư mục.');