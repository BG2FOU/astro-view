#!/usr/bin/env node

/**
 * 构建脚本：从环境变量生成 config.js
 * 在 Cloudflare Pages 中执行此脚本，将环境变量注入到客户端代码中
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

// 生成 config.js 内容
const configContent = `// 自动生成的配置文件（由 build-config.js 脚本生成）
// ⚠️ 不要手动编辑此文件

window.CONFIG = {
    AMAP_API_KEY: '${AMAP_API_KEY}',
    AMAP_SECURITY_JS_CODE: '${AMAP_SECURITY_JS_CODE}'
};
`;

// 确保 src 目录存在
const srcDir = path.join(__dirname, 'src');
if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
}

// 写入 config.js 文件
const configPath = path.join(srcDir, 'config.js');
try {
    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log(`✅ 配置文件已生成：${configPath}`);
    console.log(`   - AMAP_API_KEY: ${AMAP_API_KEY.substring(0, 8)}...`);
    console.log(`   - AMAP_SECURITY_JS_CODE: ${AMAP_SECURITY_JS_CODE.substring(0, 8)}...`);
} catch (error) {
    console.error(`❌ 生成配置文件失败：${error.message}`);
    process.exit(1);
}
