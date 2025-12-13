#!/usr/bin/env node

/**
 * 测试脚本：验证构建脚本是否正常工作
 * 用法：node test-build.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 开始测试构建脚本...\n');

// 1. 检查 build-config.js 是否存在
console.log('✓ 检查 build-config.js...');
const buildScriptPath = path.join(__dirname, 'build-config.js');
if (!fs.existsSync(buildScriptPath)) {
    console.error('❌ 错误：找不到 build-config.js');
    process.exit(1);
}
console.log('  ✅ build-config.js 存在\n');

// 2. 检查环境变量
console.log('✓ 检查环境变量...');
const apiKey = process.env.AMAP_API_KEY;
const securityCode = process.env.AMAP_SECURITY_JS_CODE;

if (!apiKey) {
    console.warn('  ⚠️  AMAP_API_KEY 未设置');
} else {
    console.log(`  ✅ AMAP_API_KEY: ${apiKey.substring(0, 8)}...`);
}

if (!securityCode) {
    console.warn('  ⚠️  AMAP_SECURITY_JS_CODE 未设置');
} else {
    console.log(`  ✅ AMAP_SECURITY_JS_CODE: ${securityCode.substring(0, 8)}...`);
}

if (!apiKey || !securityCode) {
    console.log('\n  💡 提示：使用测试值进行本地测试');
    process.env.AMAP_API_KEY = process.env.AMAP_API_KEY || 'test_api_key_123456789';
    process.env.AMAP_SECURITY_JS_CODE = process.env.AMAP_SECURITY_JS_CODE || 'test_security_code_123456';
    console.log('  设置测试环境变量\n');
}

// 3. 运行构建脚本
console.log('✓ 运行构建脚本...');
try {
    require('./build-config.js');
    console.log('  ✅ 构建脚本执行成功\n');
} catch (error) {
    console.error(`❌ 构建脚本执行失败：${error.message}`);
    process.exit(1);
}

// 4. 验证生成的文件
console.log('✓ 验证生成的 config.js...');
const configPath = path.join(__dirname, 'src', 'config.js');
if (!fs.existsSync(configPath)) {
    console.error('❌ 错误：config.js 未生成');
    process.exit(1);
}
console.log('  ✅ config.js 存在\n');

// 5. 读取并检查 config.js 内容
console.log('✓ 检查 config.js 内容...');
const configContent = fs.readFileSync(configPath, 'utf-8');

if (!configContent.includes('window.CONFIG')) {
    console.error('❌ 错误：config.js 不包含 window.CONFIG');
    process.exit(1);
}
console.log('  ✅ 包含 window.CONFIG 定义\n');

if (!configContent.includes('AMAP_API_KEY')) {
    console.error('❌ 错误：config.js 不包含 AMAP_API_KEY');
    process.exit(1);
}
console.log('  ✅ 包含 AMAP_API_KEY\n');

if (!configContent.includes('AMAP_SECURITY_JS_CODE')) {
    console.error('❌ 错误：config.js 不包含 AMAP_SECURITY_JS_CODE');
    process.exit(1);
}
console.log('  ✅ 包含 AMAP_SECURITY_JS_CODE\n');

// 6. 打印生成的内容（首行和末行）
console.log('✓ 生成的 config.js 内容预览：');
console.log('─'.repeat(60));
const lines = configContent.split('\n');
lines.forEach((line, index) => {
    if (index === 0 || index === lines.length - 2) {
        console.log(line);
    } else if (index === 1) {
        console.log('...');
    }
});
console.log('─'.repeat(60));
console.log();

// 7. 总结
console.log('🎉 所有测试通过！\n');
console.log('✅ 构建脚本工作正常');
console.log('✅ config.js 已正确生成');
console.log('✅ 可以安全地部署到 Cloudflare Pages\n');

console.log('📝 后续步骤：');
console.log('1. git add build-config.js package.json');
console.log('2. git commit -m "Add build script for Cloudflare Pages"');
console.log('3. git push origin main');
console.log('4. 在 Cloudflare Pages 中设置环境变量');
console.log('5. 设置 Build command 为：npm run build');
console.log('6. 等待自动部署完成\n');
