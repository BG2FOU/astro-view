#!/usr/bin/env node

/**
 * 构建脚本：在 index.html 中内联配置
 * 将环境变量直接注入到 HTML，避免 MIME type 问题
 */

const fs = require('fs');
const path = require('path');

// 获取环境变量
const AMAP_API_KEY = process.env.AMAP_API_KEY || '';
const AMAP_SECURITY_JS_CODE = process.env.AMAP_SECURITY_JS_CODE || '';

// 验证必要的环境变量
if (!AMAP_API_KEY || !AMAP_SECURITY_JS_CODE) {
    console.error('❌ 错误：缺少必要的环境变量');
    console.error('   请设置以下环境变量：');
    console.error('   - AMAP_API_KEY');
    console.error('   - AMAP_SECURITY_JS_CODE');
    process.exit(1);
}

// 读取 index.html
const indexPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf-8');

// 生成配置脚本
const configScript = `        // 自动生成的配置（由 build-config.js 脚本生成）
        window.CONFIG = {
            AMAP_API_KEY: '${AMAP_API_KEY}',
            AMAP_SECURITY_JS_CODE: '${AMAP_SECURITY_JS_CODE}'
        };`;

// 替换占位符
const updatedContent = htmlContent
    .replace(/AMAP_API_KEY: '\$\{AMAP_API_KEY\}'/g, `AMAP_API_KEY: '${AMAP_API_KEY}'`)
    .replace(/AMAP_SECURITY_JS_CODE: '\$\{AMAP_SECURITY_JS_CODE\}'/g, `AMAP_SECURITY_JS_CODE: '${AMAP_SECURITY_JS_CODE}'`);

// 写回文件
try {
    fs.writeFileSync(indexPath, updatedContent, 'utf-8');
    console.log(`✅ 配置已内联到 index.html`);
    console.log(`   - AMAP_API_KEY: ${AMAP_API_KEY.substring(0, 8)}...`);
    console.log(`   - AMAP_SECURITY_JS_CODE: ${AMAP_SECURITY_JS_CODE.substring(0, 8)}...`);
} catch (error) {
    console.error(`❌ 更新 index.html 失败：${error.message}`);
    process.exit(1);
}
