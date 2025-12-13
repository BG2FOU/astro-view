# 故障排查指南

本指南帮助解决观星地导览网页的常见问题。

---

## 📍 地图不显示或显示空白

### 症状
- 网页打开但地图区域显示空白
- 浏览器控制台显示 API 错误

### 检查清单

#### 1. API Key 配置
```bash
# 检查是否存在 src/config.js
cat src/config.js

# 应该看到:
# window.CONFIG = {
#   AMAP_API_KEY: "e5b759a2a9a743ac99a07e48b1dbe23b",
#   AMAP_SECURITY_JS_CODE: "f93d8688a469db5a5645503baba74a60"
# };
```

**问题：** 找不到 `config.js`
- ✅ **解决方案**：在 `src/` 目录下创建 `config.js`
  ```javascript
  window.CONFIG = {
    AMAP_API_KEY: "你的API Key",
    AMAP_SECURITY_JS_CODE: "你的安全码"
  };
  ```

**问题：** API Key 无效或过期
- ✅ **解决方案**：
  1. 登录 [高德地图开发者平台](https://lbs.amap.com/dev/id/choose)
  2. 检查 Key 是否已启用 Web 平台
  3. 检查 Key 是否在有效期内
  4. 替换 `config.js` 中的 API Key

#### 2. 网络连接
```bash
# 开发环境：启动本地服务器
python -m http.server 8000

# 然后打开：http://localhost:8000
```

**问题：** 获取观星地数据失败
- ✅ **检查**：
  - `public/data/observatories.json` 文件是否存在
  - JSON 格式是否正确（使用 [JSON 验证工具](https://jsonlint.com/)）
  - 检查浏览器控制台的网络请求 (F12 → Network 选项卡)

#### 3. 浏览器兼容性
```javascript
// 检查控制台错误
// 打开 F12 → Console 选项卡，查看是否有错误信息
```

**问题：** 旧浏览器（IE11）显示错误
- ✅ **解决方案**：使用现代浏览器
  - Chrome 60+
  - Firefox 55+
  - Safari 11+
  - Edge 79+

---

## 🔄 自动刷新不工作

### 症状
- 更新 JSON 文件后，网页不能自动刷新显示新数据
- 需要手动刷新页面才能看到新数据

### 检查清单

#### 1. 浏览器缓存
```javascript
// 自动刷新使用了缓存清除机制（cache: 'no-store'）
// 但某些情况下可能不起作用

// 手动清除缓存：
// Ctrl+Shift+Delete 打开隐私清除窗口 → 清除所有数据
```

#### 2. 检查自动检测间隔
```javascript
// 打开浏览器控制台，检查间隔是否正在运行：
console.log(autoCheckInterval);

// 应该输出一个正整数（例如：123456）
```

**问题：** `autoCheckInterval` 为 null 或 undefined
- ✅ **解决方案**：
  1. 刷新页面
  2. 检查 `src/app.js` 中 `startAutoCheckForUpdates()` 是否被调用
  3. 查看控制台是否有 JavaScript 错误

#### 3. JSON 文件验证
```bash
# 检查 JSON 格式是否正确
python -m json.tool public/data/observatories.json

# 如果显示错误，说明 JSON 格式有问题
```

#### 4. 强制刷新
```javascript
// 在浏览器控制台手动触发刷新
refreshObservatories();
```

---

## 🚫 GitHub Issue 自动更新不工作

### 症状
- 提交 Issue 后，GitHub Actions 没有执行
- JSON 文件没有自动更新
- Issue 没有自动关闭

### 检查清单

#### 1. GitHub Actions 权限
```bash
# 检查 workflow 文件是否存在
ls -la .github/workflows/

# 应该看到：process-observatory-issue.yml
```

**问题：** Workflow 文件不存在或位置错误
- ✅ **解决方案**：
  1. 检查 `.github/workflows/process-observatory-issue.yml` 是否存在
  2. 文件权限：`-rw-r--r--` （644）
  3. 确保文件内容格式正确（YAML 格式）

#### 2. Actions 权限配置
**问题：** "Insufficient permissions to access repository"
- ✅ **解决方案**：
  1. 进入仓库 **Settings** → **Actions** → **General**
  2. 下拉到 "Workflow permissions"
  3. 选择 **"Read and write permissions"** ✅
  4. 勾选 **"Allow GitHub Actions to create and approve pull requests"**
  5. 保存设置

#### 3. Python 依赖
```bash
# 检查 Python 脚本是否有语法错误
python -m py_compile .github/scripts/process_issue.py

# 无输出表示成功
```

#### 4. Issue 模板格式
**问题：** 收到 "字段验证失败" 评论
- ✅ **检查**：
  1. 使用官方提供的 Issue 模板
  2. 不要删除或修改字段标签（如 `**ID:**`）
  3. 使用 [快速参考](.github/ISSUE_TEMPLATE/quick_reference.md) 确认格式

#### 5. 监控 Actions 执行
```bash
# 在网页上查看：
# GitHub 仓库 → Actions 选项卡 → process-observatory-issue workflow
```

**检查步骤：**
1. 点击最近的 workflow 运行
2. 查看每个步骤是否成功（绿色 ✓）
3. 点击 **"Run process_issue.py"** 查看详细日志

#### 6. 常见错误信息

| 错误信息 | 原因 | 解决方案 |
|---------|------|--------|
| `FileNotFoundError: observatories.json` | 文件路径错误 | 检查 Python 脚本中的路径 |
| `JSONDecodeError` | JSON 格式错误 | 使用 JSON 验证工具 |
| `ValueError: 纬度必须...` | 坐标范围错误 | 检查输入的纬度/经度 |
| `Permission denied` | Actions 权限不足 | 参考上面的权限配置步骤 |
| `fatal: not a git repository` | Git 配置错误 | 检查仓库设置 |

---

## 📋 Issue 提交常见错误

### 错误 1: "ID 已存在"

**症状**：收到评论："ID 'harbin-it' 已存在，如需更新请选择 'update' 模式"

**原因**：提交的 ID 已在数据库中存在

**解决方案**：
1. 修改 ID（使用唯一值）
2. 或选择 **"update"** 模式来更新现有条目
3. 重新提交 Issue

### 错误 2: "纬度必须在 -90 到 90 之间"

**症状**：收到验证错误

**原因**：输入的纬度超出有效范围

**解决方案**：
- 纬度范围：`-90` 到 `90`
- 经度范围：`-180` 到 `180`
- 示例：北京 (40.04, 116.27)

### 错误 3: "波特尔等级必须在 1 到 9 之间"

**症状**：Bortle 值无效

**原因**：输入的 Bortle 值超出范围

**解决方案**：
- 有效值：`1, 2, 3, 4, 5, 6, 7, 8, 9`
- 详见 [README - 光害等级说明](README.md#光害等级说明)

### 错误 4: "光污染等级必须是 1-5 或 5+"

**症状**：standardLight 值无效

**原因**：输入的中国暗夜环境等级值不正确

**解决方案**：
- 有效值：`1, 2, 3, 4, 5, 5+`
- 只能是数字或 "5+"
- 不要输入 "1-5"（这表示范围，不是值）

---

## 🗺️ 地图显示但标记不显示

### 症状
- 地图本身能显示，但没有观星地的标记
- 点击地图没有反应

### 检查清单

#### 1. JSON 数据有效性
```javascript
// 在浏览器控制台检查
console.log(observatories);

// 应该输出一个对象数组
```

**问题：** `observatories` 为空数组
- ✅ **解决方案**：
  1. 检查 `public/data/observatories.json` 格式
  2. 验证 JSON 格式正确
  3. 检查是否有数据条目

#### 2. 坐标有效性
```javascript
// 坐标应该在这个范围内：
// 纬度: -90 到 90
// 经度: -180 到 180

// 检查示例：
console.log(observatories[0]);  // 查看第一个观星地的坐标
```

#### 3. 浏览器控制台错误
- 打开 F12 → **Console** 选项卡
- 查看是否有红色错误信息
- 常见错误：
  - `Cannot read property 'latitude' of undefined`
  - `Invalid coordinates`

---

## 🎨 样式显示错误（按钮/颜色不正确）

### 症状
- 刷新按钮看不见或显示不对
- 颜色显示不正确
- 文本溢出或布局混乱

### 检查清单

#### 1. 检查 CSS 文件
```bash
# 验证 CSS 文件完整性
wc -l src/app.css

# 应该大于 200 行
```

#### 2. 清除浏览器缓存
```
Ctrl+Shift+Delete → 清除所有数据 → 重新加载页面
```

#### 3. 响应式设计检查
```javascript
// 检查视口宽度
console.log(window.innerWidth);

// 应该根据分辨率自适应
```

---

## 📱 移动设备显示问题

### 症状
- 地图在手机上显示不全
- 信息面板遮挡地图

### 解决方案

#### 1. 视口设置
```html
<!-- index.html 已包含正确的视口设置 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

#### 2. 响应式断点
- 平板及以上（768px+）：完整布局
- 手机（480-768px）：优化布局
- 小手机（<480px）：极致优化

#### 3. 强制横屏重新加载
```
旋转设备 → 页面应该自动重新适应
```

---

## 🔍 调试技巧

### 启用详细日志

在浏览器控制台执行：
```javascript
// 启用详细日志
localStorage.setItem('DEBUG_ASTRO_VIEW', 'true');

// 查看最后一次数据哈希
console.log('Last hash:', lastDataHash);

// 查看自动检查间隔
console.log('Auto-check interval:', autoCheckInterval);

// 禁用调试
localStorage.removeItem('DEBUG_ASTRO_VIEW');
```

### 网络请求监控
1. 打开 F12 → **Network** 选项卡
2. 刷新页面
3. 查看以下请求的状态：
   - `observatories.json` - 应该返回 200
   - `amap api` - 应该返回 200
   - 其他资源 - 应该返回 200 或 304 (缓存)

### JavaScript 执行监控
```javascript
// 在 app.js 关键位置添加调试输出
console.log('[DEBUG] 加载观星地数据...');
console.log('[DEBUG] 标记数量:', markers.length);
console.log('[DEBUG] 自动检查已启动');
```

---

## 📞 获取更多帮助

### 查看相关文档
- [项目 README](../README.md)
- [Issue 自动更新指南](.ISSUE_AUTO_UPDATE.md)
- [GitHub Actions 部署设置](../GITHUB_ACTIONS_SETUP.md)
- [快速参考](.ISSUE_TEMPLATE/quick_reference.md)

### 提交 Issue 报告
1. 检查上面的故障排查步骤
2. 收集信息：
   - 浏览器类型和版本
   - 错误信息（从控制台复制）
   - 复现步骤
3. 在 GitHub Issues 中提交新 Issue
4. 使用标签 `bug 🐛` 标记

### 查看 GitHub Actions 日志
1. 进入仓库 → **Actions** 选项卡
2. 选择最近的工作流运行
3. 点击失败的步骤查看详细日志

---

## 最后更新

文档最后更新于 2024 年
若有新的问题，请在 GitHub Issues 中提交。
