#!/usr/bin/env node

/**
 * 构建脚本：在 index.html 中内联配置
 * 将环境变量直接注入到 HTML，避免 MIME type 问题
 */

const fs = require('fs');
const path = require('path');

// 获取环境变量
const AMAP_API_KEY = process.env.AMAP_API_KEY || '';
// 注意：AMAP_SECURITY_JS_CODE 不应在前端暴露，只在 Cloudflare Worker 中设置

// 验证必要的环境变量
if (!AMAP_API_KEY) {
    console.error('❌ 错误：缺少必要的环境变量');
    console.error('   请设置以下环境变量：');
    console.error('   - AMAP_API_KEY');
    console.error('');
    console.error('   注意：AMAP_SECURITY_JS_CODE 不应在前端暴露，');
    console.error('   应在 Cloudflare Worker 环境变量中配置');
    process.exit(1);
}

// 读取 index.html
const indexPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf-8');

// 替换占位符（只注入 API Key，安全密钥在 Worker 端处理）
const updatedContent = htmlContent
    .replace(/AMAP_API_KEY: '\$\{AMAP_API_KEY\}'/g, `AMAP_API_KEY: '${AMAP_API_KEY}'`);

// 写回文件
try {
    fs.writeFileSync(indexPath, updatedContent, 'utf-8');
    console.log(`✅ 配置已内联到 index.html`);
    console.log(`   - AMAP_API_KEY: ${AMAP_API_KEY.substring(0, 8)}...`);
    console.log(`   ✓ 安全密钥已排除（在 Cloudflare Worker 端处理）`);
} catch (error) {
    console.error(`❌ 更新 index.html 失败：${error.message}`);
    process.exit(1);
}
