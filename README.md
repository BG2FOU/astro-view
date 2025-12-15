# 观星地导览网页

使用高德地图 API 展示东北地区观星地点。

## 项目结构
```
astro-view/
├── index.html              # 主页面 + 高德地图 SDK
├── src/
│   ├── app.js             # 核心逻辑：地图初始化、标记、信息展示
│   └── app.css            # 样式：响应式、暗黑模式支持
├── public/
│   └── data/
│       └── observatories.json  # 观星地数据（Git 管理）
├── README.md              # 本文件
└── .gitignore            # Git 忽略配置
```

## 技术栈
| 技术 | 用途 |
|------|------|
| HTML5 | 页面结构 |
| Vanilla JavaScript | 地图交互、数据加载 |
| CSS3 | 响应式设计、动画 |
| 高德地图 SDK | 地图展示、标记管理 |
| JSON | 观星地数据存储 |

## 数据流
```
observatories.json (数据源)
        ↓
app.js (fetch 加载)
        ↓
地图标记 (AMap.Marker)
        ↓
点击事件 → 信息面板展示
```

## 数据格式说明

### JSON 结构
编辑 `public/data/observatories.json` 来添加或修改观星地：

```json
{
  "observatories": [
    {
      "id": "unique_id",
      "name": "观星地名称",
      "latitude": 45.31119,
      "longitude": 127.588019,
      "coordinates": "127.588019°E,45.311199°N",
      "bortle": "3",
      "standardLight": "1",
      "sqm": "21.70",
      "climate": "晴朗率较高，能见度优秀",
      "accommodation": "周边民宿众多",
      "notes": "绝佳的观星地",
      "image": "https://example.com/photo.jpg"
    }
  ]
}
```

坐标获取：https://lbs.amap.com/tools/picker

### 字段说明
| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| id | 字符串 | ✅ | 唯一标识符 |
| name | 字符串 | ✅ | 观星地名称 |
| latitude | 数字 | ✅ | 纬度 |
| longitude | 数字 | ✅ | 经度 |
| coordinates | 字符串 | ✅ | 坐标展示（格式：E,N） |
| bortle | 字符串 | ✅ | 波特尔光害等级（1-9） |
| standardLight | 字符串 | ✅ | 中国暗夜环境等级（1-5） |
| sqm | 字符串 | ✅ | SQM值（天空亮度） |
| climate | 字符串 | ✅ | 气候情况 |
| accommodation | 字符串 | ✅ | 住宿情况 |
| notes | 字符串 | ✅ | 备注 |
| image | 字符串 | ❌ | 观星地图片URL（可选） |

## 数据更新方式

### 方式 1: Git Push（直接修改）
编辑 `public/data/observatories.json` 并 git push 到仓库：

```bash
git add public/data/observatories.json
git commit -m "添加新的观星地: 帽儿山"
git push origin main
```

### 方式 2: GitHub Issue（推荐）⭐
通过 GitHub Issue 自动提交数据，系统会自动处理。

**优势：**
- ✅ 不需要 git 知识
- ✅ 自动验证数据格式
- ✅ 自动提交更改并关闭 Issue
- ✅ 有记录可查

**步骤：**
1. 进入 **Issues** → **New Issue**
2. 选择 **"添加或更新观星地"** 模板
3. 填写观星地信息
4. 提交 Issue，系统自动处理

📖 **相关文档：**
- [Issue 自动更新完整指南](.github/ISSUE_AUTO_UPDATE.md)
- [快速参考卡片](.github/ISSUE_TEMPLATE/quick_reference.md)
- [GitHub Actions 部署设置](./docs/GITHUB_ACTIONS_SETUP.md)

---

### 光害等级说明
**波特尔光害等级（bortle）**
输入数字 1-9，会自动转换为完整标签：
- `1` → 1级 / 极限星等 7.6~8.0
- `2` → 2级 / 极限星等 7.1~7.5
- `3` → 3级 / 极限星等 6.6~7.0
- `4` → 4级 / 极限星等 6.1~6.5
- `5` → 5级 / 极限星等 5.6~6.0
- `6` → 6级 / 极限星等 5.1~5.5
- `7` → 7级 / 极限星等 4.6~5.0
- `8` → 8级 / 极限星等 4.1~4.5
- `9` → 9级 / 极限星等 4.0

**中国暗夜环境等级（standardLight）**
输入 1-5 或 5+，会自动显示颜色标记：
- `1` → 🟢 1级 (优秀)
- `2` → 🟢 2级 (良好)
- `3` → 🟡 3级 (一般)
- `4` → 🟠 4级 (较差)
- `5` → 🔴 5级 (严重)
- `5+` → 🔴 5级+ (极度严重)

### 图片链接（image）
- 支持任何有效的图片 URL（HTTP/HTTPS）
- 图片会在信息面板底部显示，最大高度 200px
- 如果图片加载失败会显示"图片加载失败"
- 如果留空或不填会显示"暂无图片"

## 常见问题

### Q: 如何添加观星地图片？
1. 在 JSON 中添加 `"image"` 字段，填入图片 URL
2. 图片会在信息面板底部自动显示
3. 支持 JPEG、PNG 等常见格式

示例：
```json
{
  "name": "某观星地",
  "image": "https://example.com/starry-sky.jpg"
}
```

### Q: 图片加载失败怎么办？
检查以下几点：
- URL 是否正确（支持 HTTP 和 HTTPS）
- 图片是否还在线
- 图片文件是否过大（建议压缩至 1MB 以内）
- 跨域问题（某些图片床可能有限制）

### Q: 如何自动刷新地图？
编辑 `public/data/observatories.json` 并保存，30 秒内会自动检测更新并刷新地图。如需立即刷新，点击"🔄 刷新数据"按钮。

## 📚 文档导航

> **📚 [查看完整文档索引](./docs/INDEX.md)** | **快速导航**：[🚀 快速开始](./docs/GETTING_STARTED.md) | [☁️ Cloudflare 部署](./docs/CLOUDFLARE_DEPLOYMENT.md) | [⚡ 快速命令](./docs/QUICK_COMMANDS.md) | [📋 Issue 提交指南](.github/ISSUE_AUTO_UPDATE.md) | [⚙️ GitHub Actions 设置](./docs/GITHUB_ACTIONS_SETUP.md)./docs/

### 🔧 部署相关（最重要）
| 文档 | 说明 |
|------|------|
| [🚀 Cloudflare Pages 部署完整指南](docs/CLOUDFLARE_PAGES_DEPLOYMENT_GUIDE.md) | **最新**：完整的部署步骤、故障排除、工作原理详解 |
| [🎨 Cloudflare Pages 可视化指南](docs/CLOUDFLARE_PAGES_VISUAL_GUIDE.md) | 带截图的部署配置指南，一步步操作 |
| [✅ 快速修复清单](docs/QUICK_FIX_CHECKLIST.md) | 错误解决清单和常见问题排查 |
| [⚙️ Cloudflare Pages 部署配置](docs/CLOUDFLARE_PAGES_SETUP.md) | 技术细节和配置说明 |

### 📖 常规文档
| 文档 | 说明 |
|------|------|
| [🎉 完成总结](./docs/COMPLETION_SUMMARY.md) | 项目完成情况、统计数据、亮点功能 |
| [🎯 项目完成总结](./docs/PROJECT_COMPLETION_SUMMARY.md) | 功能清单、部署指南、后续计划 |
| [☁️ Cloudflare Pages 部署](./docs/CLOUDFLARE_DEPLOYMENT.md) | Cloudflare Workers 代理方案、API 密钥安全处理 |
| [📊 项目状态报告](./docs/PROJECT_STATUS_REPORT.md) | 完成度、技术栈、质量指标 |
| [📦 文件清单](./docs/FILES_MANIFEST.md) | 所有文件和目录列表 |
| [🚀 快速开始](./docs/GETTING_STARTED.md) | 5 分钟快速上手指南 |
| [快速参考](.github/ISSUE_TEMPLATE/quick_reference.md) | Issue 提交格式速查表 |
| [Issue 自动更新指南](.github/ISSUE_AUTO_UPDATE.md) | GitHub Issue 方式完整教程 |
| [GitHub Actions 部署设置](./docs/GITHUB_ACTIONS_SETUP.md) | 自动化系统配置指南 |
| [故障排查指南](.github/TROUBLESHOOTING.md) | 常见问题解决方案 |
| [部署检查清单](./docs/DEPLOYMENT_CHECKLIST.md) | 上线前检查清单 |
| [更新日志](./docs/CHANGELOG.md) | 版本历史和改进记录 |
| [文档索引](./docs/INDEX.md) | 所有文档的导航索引 |
| [⚡ 快速命令](./docs/QUICK_COMMANDS.md) | 常用命令和快速操作 |

## 许可证
MIT
