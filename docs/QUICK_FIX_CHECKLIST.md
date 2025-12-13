# 快速修复清单 - Cloudflare Pages 部署错误

## 🔴 您遇到的错误
```
process is not defined (在 index.html:114)
CONFIG is not defined (在 app.js:313)
```

## ✅ 已完成的改动

### 1. 创建构建脚本 ✅
- **文件**: `build-config.js`
- **功能**: 在构建时从环境变量生成 `src/config.js`
- **原因**: 浏览器环境中无法访问 `process.env`

### 2. 修复 index.html ✅
```html
<!-- 改之前 (错误的方式) -->
<script>
window.CONFIG = {
    AMAP_API_KEY: process.env.AMAP_API_KEY,  // ❌ process 不存在
    AMAP_SECURITY_JS_CODE: process.env.AMAP_SECURITY_JS_CODE
};
</script>

<!-- 改之后 (正确的方式) -->
<script src="src/config.js"></script>  <!-- ✅ 加载生成的文件 -->
```

### 3. 创建 package.json ✅
```json
{
  "scripts": {
    "build": "node build-config.js"
  }
}
```

### 4. 创建部署文档 ✅
- `docs/CLOUDFLARE_PAGES_SETUP.md` - 详细部署指南

## 🚀 现在需要您在 Cloudflare Pages 中做的操作

### 步骤 1: 设置环境变量
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 找到您的项目 → **Settings** → **Environment variables**
3. 添加以下变量（必须是生产环境）：
   - `AMAP_API_KEY`: `e5b759a2a9a743ac99a07e48b1dbe23b` (您的密钥)
   - `AMAP_SECURITY_JS_CODE`: `f93d8688a469db5a5645503baba74a60` (您的密钥)

### 步骤 2: 配置构建命令
在 **Settings** → **Build and deployments** 中修改：

**改之前：**
```
Framework preset: 无
Build command: (空)
Build output directory: /
```

**改之后：**
```
Framework preset: 无
Build command: npm run build  ← 添加这行
Build output directory: /
```

### 步骤 3: 触发重新部署
1. 提交本次代码更新
2. Cloudflare Pages 会自动重新部署
3. 等待部署完成

## 🔍 如何验证修复成功

### 检查构建日志
进入 Pages 项目 → 最新部署 → 查看日志
- ✅ 应该看到：`✅ 配置文件已生成：src/config.js`

### 打开网站检查
1. 打开您的网站
2. 按 F12 打开开发者工具 → **Console** 标签
3. 验证：
   - ❌ 不应该有红色错误
   - ✅ 应该看到：`高德地图 SDK 加载成功`
   - ✅ 地图应该正常显示
   - ✅ 标记应该可见

## 📋 常见问题排查

### 问题 1: 构建仍然失败
**原因**: 环境变量未设置
**解决**: 
1. 再次检查 Cloudflare Dashboard 中的环境变量
2. 确保在**生产环境**中设置（不是预览环境）
3. 重新部署

### 问题 2: 还是看不到地图
**原因**: 构建命令未执行
**解决**:
1. 验证 Build command 设置为 `npm run build`
2. 强制重新部署：删除最新部署后重新推送代码

### 问题 3: CONFIG 仍然未定义
**原因**: config.js 未生成
**解决**:
1. 查看构建日志是否有错误
2. 检查环境变量是否为空
3. 使用浏览器开发工具检查 config.js 是否存在（Network 标签）

## 文件清单

```
astro-view/
├── build-config.js          ← 新建：构建脚本
├── package.json             ← 新建：npm 配置
├── index.html               ← 修改：移除 process.env 代码
├── src/
│   ├── config.js            ← 自动生成（不要提交）
│   ├── app.js
│   └── app.css
└── docs/
    └── CLOUDFLARE_PAGES_SETUP.md  ← 新建：详细指南
```

## 🎯 总结

| 问题 | 原因 | 解决 |
|------|------|------|
| `process is not defined` | 浏览器无法访问 process.env | 使用构建脚本生成 config.js |
| `CONFIG is not defined` | config.js 未加载 | 在 index.html 中引入生成的 config.js |
| API 密钥泄露 | 提交 config.js 到 GitHub | .gitignore 忽略，通过构建脚本生成 |

**一句话**: 从环境变量生成配置文件，而不是直接在浏览器代码中使用环境变量。
