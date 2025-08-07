#!/bin/bash
echo "Testing CLI functionality..."
cd /home/bui.thanh.dat/Desktop/poem/softbank/bulk-issue-coupon-tool
echo "Directory contents:"
ls -la src/
echo "Building project..."
npm run build
echo "CLI is ready to use with 'npm start' or 'npm run dev'"
