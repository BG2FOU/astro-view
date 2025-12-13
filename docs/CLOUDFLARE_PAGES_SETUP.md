# Cloudflare Pages 部署配置指南

## 问题解决

您遇到的错误：
- `process is not defined` - 浏览器环境中没有 Node.js 的 process 对象
- `CONFIG is not defined` - config.js 文件未正确加载

## 解决方案

本项目使用**构建脚本**在部署时从环境变量自动生成 config.js，无需提交敏感信息到代码库。

## 部署步骤

### 1️⃣ 在 Cloudflare Pages 中配置环境变量

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 找到您的 Pages 项目
3. 点击 **Settings** → **Environment variables**
4. 添加以下环境变量（生产环境）：

| 变量名 | 值 |
|-------|-----|
| `AMAP_API_KEY` | 您的高德地图 Web API Key |
| `AMAP_SECURITY_JS_CODE` | 您的高德地图安全密钥 |

### 2️⃣ 配置构建设置

在 **Settings** → **Build and deployments** 中配置：

```
框架预设: 无
构建命令: npm run build
构建输出目录: /
根目录: /
```

**重要**：如果您已有现有部署，必须重新触发构建以应用新的构建命令。

### 3️⃣ 重新部署

1. 提交本次更新到 GitHub
2. Cloudflare Pages 会自动触发构建和部署
3. 构建命令会执行 `npm run build`，生成 config.js
4. 检查部署是否成功 ✅

## 验证部署

部署完成后，检查以下步骤：

### 检查构建日志
在 Pages Dashboard 中查看构建日志：
- 应该看到 `✅ 配置文件已生成：src/config.js`
- 应该看到 API Key 和密钥已正确加载

### 检查浏览器控制台
打开网站后按 F12 打开开发者工具：
- 控制台中不应该有 `process is not defined` 错误
- 不应该有 `CONFIG is not defined` 错误
- 应该看到 `高德地图 SDK 加载成功` 的日志

### 验证地图功能
- 地图应该正常显示
- 观星地标记应该可见
- 点击标记可以显示详细信息

## 技术细节

### build-config.js 脚本做什么？

```javascript
// 从环境变量读取 API 密钥
const AMAP_API_KEY = process.env.AMAP_API_KEY;
const AMAP_SECURITY_JS_CODE = process.env.AMAP_SECURITY_JS_CODE;

// 生成 src/config.js 文件内容
const configContent = `window.CONFIG = {
    AMAP_API_KEY: '${AMAP_API_KEY}',
    AMAP_SECURITY_JS_CODE: '${AMAP_SECURITY_JS_CODE}'
};`;

// 将内容写入文件
fs.writeFileSync('src/config.js', configContent);
```

### 为什么这样做？

1. **安全性** ✅ - API 密钥不会提交到 GitHub
2. **灵活性** ✅ - 不同环境可用不同的密钥
3. **自动化** ✅ - 部署时自动生成，无需手动操作

## 常见问题

### Q: 我能否直接提交 config.js？
❌ **不建议** - 这会暴露您的 API 密钥。使用本方案避免这个问题。

### Q: 如果构建失败怎么办？
1. 检查环境变量是否正确设置
2. 查看 Cloudflare Pages 的构建日志寻找错误信息
3. 确保 `AMAP_API_KEY` 和 `AMAP_SECURITY_JS_CODE` 都已设置

### Q: 本地开发如何使用？
创建 `.env.local` 文件（已在 .gitignore 中）：

```env
AMAP_API_KEY=your_api_key_here
AMAP_SECURITY_JS_CODE=your_security_code_here
```

然后运行：
```bash
npm run build
```

这样会生成本地的 `src/config.js`，用于开发测试。

### Q: 如何更换 API 密钥？
直接在 Cloudflare Pages Dashboard 中更新环境变量，然后重新部署。

## 相关文件

- `build-config.js` - 构建脚本
- `package.json` - npm 配置
- `index.html` - 加载 config.js
- `src/app.js` - 使用 CONFIG 全局变量
