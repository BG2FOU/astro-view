# 🚀 Cloudflare Pages 部署完整指南

## 📋 问题诊断

您在 Cloudflare Pages 部署后遇到的错误：

```javascript
❌ Uncaught ReferenceError: process is not defined (index.html:114)
❌ Uncaught ReferenceError: CONFIG is not defined (app.js:313)
```

### 根本原因

**浏览器环境中无法访问 `process.env`**

| 环境 | 可用性 | 说明 |
|------|--------|------|
| Node.js | ✅ | `process` 是全局对象 |
| 浏览器 | ❌ | `process` 不存在 |

原代码试图在浏览器中使用 `process.env.AMAP_API_KEY`，这是不可能的。

## ✅ 解决方案

### 核心思想

```
环境变量 → 构建时读取 → 生成配置文件 → 浏览器加载 → 使用全局变量
```

### 已完成的修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `build-config.js` | ✨ 新建 | 构建时生成配置文件的脚本 |
| `package.json` | ✨ 新建 | 定义构建命令 |
| `index.html` | 📝 修改 | 改为加载生成的 config.js |
| `src/config.js` | 🔄 自动生成 | 由构建脚本在部署时生成 |
| `.gitignore` | ✅ 保持 | 继续忽略 config.js（防泄露） |

## 🎯 部署步骤

### 第一步：本地验证（可选但推荐）

```bash
# 进入项目目录
cd your-project

# 测试构建脚本
node test-build.js

# 输出应该显示：
# ✅ 所有测试通过！
# ✅ 构建脚本工作正常
# ✅ config.js 已正确生成
```

### 第二步：推送代码到 GitHub

```bash
# 添加新文件
git add build-config.js package.json index.html test-build.js

# 提交
git commit -m "修复：部署到 Cloudflare Pages 的构建配置

- 添加 build-config.js 脚本，在构建时从环境变量生成配置
- 更新 package.json 定义构建命令
- 修改 index.html 加载生成的 config.js
- 添加 test-build.js 用于本地验证"

# 推送
git push origin main
```

### 第三步：在 Cloudflare Pages 中配置

#### 3.1 设置环境变量

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入您的 Pages 项目
3. 点击 **Settings** → **Environment variables**
4. 在 **Production** 环境下添加变量：

```
变量 1：
Name:  AMAP_API_KEY
Value: (您的高德地图 API Key)

变量 2：
Name:  AMAP_SECURITY_JS_CODE
Value: (您的高德地图安全密钥)
```

⚠️ **重要：** 确保在 **Production** 环境中设置，不是 Preview

#### 3.2 配置构建设置

1. 点击 **Settings** → **Build and deployments**
2. 修改以下字段：

```
Framework preset:        [无] (保持不变)
Build command:           [npm run build] ← 改这里！
Build output directory:  [/] (保持不变)
Root directory:          [/] (保持不变)
```

3. 点击 **Save** 保存更改

#### 3.3 触发重新部署

两种方式：

**方式 A - 自动部署（推荐）**
```bash
git push origin main
# Cloudflare Pages 会自动检测并部署
```

**方式 B - 手动重新部署**
- 在 Cloudflare Dashboard → Deployments
- 点击最新部署旁的三个点 (...)
- 选择 "Retry deployment"

## 🔍 验证部署成功

### 检查 1：构建日志

1. 进入 Cloudflare Pages 项目
2. 进入 **Deployments** 页面
3. 点击最新的部署
4. 查看 **Build log**

应该看到：
```
✅ npm run build
✅ 配置文件已生成：src/config.js
   - AMAP_API_KEY: df877b1f...
   - AMAP_SECURITY_JS_CODE: f93d8688...
```

### 检查 2：浏览器控制台

1. 打开您的网站
2. 按 F12 打开开发者工具
3. 点击 **Console** 标签

应该看到：
```
✅ 高德地图 SDK 加载成功
✅ 地图初始化成功  
✅ 加载了 X 个观星地

❌ 不应该看到任何红色错误
```

### 检查 3：功能测试

- [ ] 地图正常显示
- [ ] 可以看到红色标记点
- [ ] 点击标记显示信息面板
- [ ] "刷新数据" 按钮可用

## 🛠️ 故障排除

### 问题 1: Build command 仍为空

**症状：** 部署后没有生成 config.js

**原因：** 构建命令未保存

**解决：**
1. 再次进入 Build and deployments
2. 确保填入 `npm run build`
3. 点击 [Save]（完整滚动页面）
4. 等待确认（通常有绿色提示）

### 问题 2: 环境变量找不到

**症状：** 构建日志中看不到 API Key

**原因：** 环境变量设置在 Preview 而不是 Production

**解决：**
1. 进入 Environment variables
2. 检查是否在 **Production** 标签中
3. 如果在 Preview，删除并在 Production 中重新添加
4. 重新部署

### 问题 3: CONFIG still undefined

**症状：** 浏览器控制台仍报 `CONFIG is not defined`

**原因：** config.js 文件未生成或加载

**检查：**
1. 打开浏览器开发工具
2. 进入 **Network** 标签
3. 刷新页面
4. 搜索 "config.js"
5. 如果看不到，说明文件未生成

**解决：**
1. 检查构建日志是否有错误
2. 确认环境变量已正确设置
3. 强制清除浏览器缓存（Ctrl+Shift+Delete）
4. 重新部署

### 问题 4: process is not defined

**症状：** 浏览器报错 `process is not defined`

**检查：**
1. 打开 index.html 源代码
2. 确保没有 `process.env` 代码
3. 确保有 `<script src="src/config.js"></script>`

**解决：**
1. 检查 index.html 是否被正确修改
2. 确保没有多个脚本定义 CONFIG
3. 清除浏览器缓存并刷新

## 📚 相关文件

```
astro-view/
├── build-config.js                    # 构建脚本
├── package.json                       # npm 配置
├── test-build.js                      # 本地测试脚本
├── index.html                         # 修改：加载 config.js
├── src/
│   ├── app.js                         # 使用 CONFIG 全局变量
│   ├── app.css
│   ├── config.js                      # 自动生成（不提交）
│   └── data/
└── docs/
    ├── CLOUDFLARE_PAGES_SETUP.md      # 详细配置指南
    ├── CLOUDFLARE_PAGES_VISUAL_GUIDE.md  # 可视化指南
    └── QUICK_FIX_CHECKLIST.md         # 快速清单
```

## 🎓 工作原理详解

### 旧的错误方式

```javascript
// ❌ 不工作：
// index.html
<script>
  window.CONFIG = {
    AMAP_API_KEY: process.env.AMAP_API_KEY  // 浏览器中 process 不存在
  };
</script>
```

### 新的正确方式

**第 1 步：环境变量（Cloudflare Dashboard 中设置）**
```
Production
├── AMAP_API_KEY = e5b759a2a9a743ac99a07e48b1dbe23b
└── AMAP_SECURITY_JS_CODE = f93d8688a469db5a5645503baba74a60
```

**第 2 步：构建时读取（build-config.js）**
```javascript
const AMAP_API_KEY = process.env.AMAP_API_KEY; // ✅ Node.js 中可用
const CONFIG_CONTENT = `
  window.CONFIG = {
    AMAP_API_KEY: '${AMAP_API_KEY}',
    ...
  };
`;
fs.writeFileSync('src/config.js', CONFIG_CONTENT);
```

**第 3 步：运行时使用（index.html + app.js）**
```javascript
// index.html
<script src="src/config.js"></script>

// app.js
AMapLoader.load({
  key: CONFIG.AMAP_API_KEY  // ✅ 全局变量
})
```

## 📊 部署流程图

```
┌─────────────────────────────────────────────────────────────┐
│ 您的计算机                                                   │
├─────────────────────────────────────────────────────────────┤
│ 1. git push origin main                                     │
│    └─> 推送代码到 GitHub                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Pages                                            │
├─────────────────────────────────────────────────────────────┤
│ 2. 检测到新推送                                              │
│    └─> 触发自动构建                                          │
│                                                             │
│ 3. 读取环境变量                                              │
│    ├─> AMAP_API_KEY = e5b759a2...                          │
│    └─> AMAP_SECURITY_JS_CODE = f93d8688...                │
│                                                             │
│ 4. 运行构建命令                                              │
│    └─> npm run build                                        │
│         └─> node build-config.js                           │
│              └─> 生成 src/config.js                         │
│                                                             │
│ 5. 部署到 CDN                                               │
│    ├─> index.html                                          │
│    ├─> src/app.js                                          │
│    ├─> src/config.js (已生成)                              │
│    └─> 其他资源                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 用户的浏览器                                                  │
├─────────────────────────────────────────────────────────────┤
│ 6. 加载 index.html                                          │
│                                                             │
│ 7. 加载 src/config.js                                       │
│    └─> window.CONFIG = { AMAP_API_KEY: ... }               │
│                                                             │
│ 8. 加载 src/app.js                                          │
│    └─> 使用 CONFIG.AMAP_API_KEY                            │
│                                                             │
│ 9. 初始化高德地图                                            │
│    └─> AMapLoader.load({ key: CONFIG.AMAP_API_KEY })       │
│                                                             │
│ 10. ✅ 地图显示！                                            │
│     ├─> 加载观星地数据                                       │
│     ├─> 显示标记点                                           │
│     └─> 支持交互                                             │
└─────────────────────────────────────────────────────────────┘
```

## ✨ 最终检查清单

在部署前，确保完成：

- [ ] 本地测试：`node test-build.js` 通过
- [ ] GitHub 推送：所有文件已提交
- [ ] 环境变量：在 Cloudflare Dashboard 中设置
  - [ ] AMAP_API_KEY
  - [ ] AMAP_SECURITY_JS_CODE
- [ ] 构建命令：设置为 `npm run build`
- [ ] 部署：成功完成
- [ ] 验证：浏览器中没有错误，地图正常显示

## 🎉 完成！

如果您看到了地图并能点击标记查看详细信息，说明部署成功！

## 📞 需要帮助？

如果仍有问题：

1. **检查构建日志** - Cloudflare Dashboard → Deployments → Build log
2. **查看浏览器控制台** - F12 → Console 标签
3. **查看网络请求** - F12 → Network 标签，搜索 "config.js"
4. **查看文档** - docs/CLOUDFLARE_PAGES_VISUAL_GUIDE.md（详细图文指南）

祝您部署顺利！🚀
