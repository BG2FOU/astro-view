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

坐标获取：[坐标拾取器 | 高德地图API](https://lbs.amap.com/tools/picker)

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

**步骤：**

1. 进入 **Issues** → **New Issue**；
2. 选择 **"添加或更新观星地"** 模板；
4. 提交 Issue，系统自动处理。

### 方式3: 直接在页面下方填写✨提交观星地表单（推荐）⭐

直接在页面下方点击`✨提交观星地`，按要求填写表单即可。

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
- 点击图片可放大/切换

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
- 图片文件是否过大（建议适当压缩）
- 跨域问题（某些图床可能有限制）

### Q: 如何自动刷新地图？
编辑 `public/data/observatories.json` 并保存，30 秒内会自动检测更新并刷新地图。如需立即刷新，点击"🔄 刷新数据"按钮；或是刷新网页缓存。

## 版权
版权声明：本文为[[BG2FOU](https://github.com/BG2FOU)]()原创，依据 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 许可证[LICENSE](LICENSE)进行授权，转载请附上[出处链接](https://github.com/BG2FOU/astro-view)及本声明。
