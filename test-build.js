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
let apiKey = process.env.AMAP_API_KEY;
let securityCode = process.env.AMAP_SECURITY_JS_CODE;

if (!apiKey) {
    console.warn('  ⚠️  AMAP_API_KEY 未设置');
    apiKey = 'test_api_key_123456789';
} else {
    console.log(`  ✅ AMAP_API_KEY: ${apiKey.substring(0, 8)}...`);
}

if (!securityCode) {
    console.warn('  ⚠️  AMAP_SECURITY_JS_CODE 未设置');
    securityCode = 'test_security_code_123456';
} else {
    console.log(`  ✅ AMAP_SECURITY_JS_CODE: ${securityCode.substring(0, 8)}...`);
}

if (!process.env.AMAP_API_KEY || !process.env.AMAP_SECURITY_JS_CODE) {
    console.log('\n  💡 提示：使用测试值进行本地测试\n');
    process.env.AMAP_API_KEY = apiKey;
    process.env.AMAP_SECURITY_JS_CODE = securityCode;
}

// 3. 备份原始 index.html
console.log('✓ 备份 index.html...');
const indexPath = path.join(__dirname, 'index.html');
const backupPath = path.join(__dirname, 'index.html.backup');
if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(indexPath, backupPath);
    console.log('  ✅ 备份完成\n');
} else {
    console.log('  ✅ 备份已存在\n');
}

// 4. 运行构建脚本
console.log('✓ 运行构建脚本...');
try {
    require('./build-config.js');
    console.log('  ✅ 构建脚本执行成功\n');
} catch (error) {
    console.error(`❌ 构建脚本执行失败：${error.message}`);
    process.exit(1);
}

// 5. 验证生成的内容
console.log('✓ 验证 index.html 内容...');
const updatedContent = fs.readFileSync(indexPath, 'utf-8');

if (!updatedContent.includes('window.CONFIG')) {
    console.error('❌ 错误：index.html 不包含 window.CONFIG');
    process.exit(1);
}
console.log('  ✅ 包含 window.CONFIG 定义\n');

if (!updatedContent.includes(apiKey)) {
    console.error('❌ 错误：API Key 未正确注入');
    process.exit(1);
}
console.log(`  ✅ API Key 已注入：${apiKey.substring(0, 8)}...\n`);

if (!updatedContent.includes(securityCode)) {
    console.error('❌ 错误：Security Code 未正确注入');
    process.exit(1);
}
console.log(`  ✅ Security Code 已注入：${securityCode.substring(0, 8)}...\n`);

// 6. 显示相关部分
console.log('✓ 生成的 index.html 配置部分：');
console.log('─'.repeat(60));
const configStart = updatedContent.indexOf('window.CONFIG');
const configEnd = updatedContent.indexOf('};', configStart) + 2;
const configSection = updatedContent.substring(configStart, configEnd);
console.log(configSection);
console.log('─'.repeat(60));
console.log();

// 7. 总结
console.log('🎉 所有测试通过！\n');
console.log('✅ 构建脚本工作正常');
console.log('✅ 配置已正确内联到 index.html');
console.log('✅ 可以安全地部署到 Cloudflare Pages\n');

console.log('📝 后续步骤：');
console.log('1. git add build-config.js index.html package.json');
console.log('2. git commit -m "Fix: Inline config in HTML to fix MIME type issue"');
console.log('3. git push origin main');
console.log('4. 在 Cloudflare Pages 中设置环境变量');
console.log('5. 设置 Build command 为：npm run build');
console.log('6. 等待自动部署完成\n');
console.log('💡 提示：构建完成后，请手动恢复 index.html 原始状态：');
console.log('  git checkout index.html  或  cp index.html.backup index.html');
