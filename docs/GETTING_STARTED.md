# 👋 快速开始指南

欢迎贡献观星地数据！本指南只需 5 分钟完成。

---

## 📌 最简单的方式：GitHub Issue（推荐 ⭐）

### 第 1 步：打开 Issue 提交页面
1. 进入 GitHub 仓库
2. 点击 **Issues** 选项卡
3. 点击 **New Issue** 按钮

### 第 2 步：选择模板
- 选择 **"添加或更新观星地"** 模板
- 或直接点击 [Create Issue with Template](../../issues/new?template=add-observatory.md)

### 第 3 步：填写信息

按照以下格式填写（复制粘贴模板中的字段）：

```
**操作类型（Operation Type）：**
add

**ID（自动生成，可留空）：**
anjihai-observatory

**名称（Name）：**
安吉海观星地

**纬度（Latitude）：**
30.6231

**经度（Longitude）：**
120.5954

**波特尔等级（Bortle）：**
3

**中国暗夜环境等级（Standard Light）：**
2

**天空质量测定仪读数（SQM）：**
20.5

**气候条件（Climate）：**
春秋季云层较少，冬季常见冰雪

**住宿条件（Accommodation）：**
附近有多家民宿和酒店

**其他说明（Notes）：**
靠近浙北高速，交通便利。观星点海拔约 800 米

**图片 URL（Image URL，可留空）：**
https://example.com/image.jpg
```

### 第 4 步：提交
- 点击 **Submit new issue** 按钮
- 系统会自动处理，几分钟后 Issue 会自动关闭
- ✅ 数据已自动添加到地图中！

---

## ⚙️ 对于开发者：本地开发

### 快速启动

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/astro-view.git
cd astro-view

# 2. 启动本地服务器
python -m http.server 8000

# 3. 在浏览器中打开
http://localhost:8000
```

### 添加观星地数据

#### 方式 A：编辑 JSON 文件（快速）

编辑 `public/data/observatories.json`，在 `observatories` 数组中添加：

```json
{
  "id": "anjihai",
  "name": "安吉海观星地",
  "latitude": 30.6231,
  "longitude": 120.5954,
  "coordinates": "30.6231°N, 120.5954°E",
  "bortle": 3,
  "standardLight": 2,
  "sqm": 20.5,
  "climate": "春秋季云层较少，冬季常见冰雪",
  "accommodation": "附近有多家民宿和酒店",
  "notes": "靠近浙北高速，交通便利。观星点海拔约 800 米",
  "image": "https://example.com/image.jpg"
}
```

然后提交：

```bash
git add public/data/observatories.json
git commit -m "添加观星地: 安吉海观星地"
git push origin main
```

#### 方式 B：使用 GitHub Issue（推荐）

参考上面的 "最简单的方式" 部分。

---

## 📋 字段说明

| 字段 | 说明 | 示例 | 范围 |
|------|------|------|------|
| id | 唯一标识符（自动或手动生成） | `anjihai-obs` | 无重复 |
| name | 地点名称 | `安吉海观星地` | 中英文都可 |
| latitude | 纬度 | `30.6231` | -90 ~ 90 |
| longitude | 经度 | `120.5954` | -180 ~ 180 |
| coordinates | 坐标显示（自动生成） | `30.6231°N, 120.5954°E` | 自动 |
| bortle | 波特尔光害等级 | `3` | 1-9 |
| standardLight | 中国暗夜环境等级 | `2` | 1-5 或 5+ |
| sqm | 天空质量指数 | `20.5` | 15-23 (可选) |
| climate | 气候说明 | `春秋季云层较少...` | 任意文本 |
| accommodation | 住宿条件 | `多家民宿和酒店` | 任意文本 |
| notes | 其他说明 | `靠近高速，交通便利` | 任意文本 |
| image | 图片 URL | `https://example.com/image.jpg` | 图片链接 |

---

## 🎯 最常见的错误

| 错误 | 原因 | 解决方案 |
|------|------|--------|
| ❌ 纬度必须在 -90 到 90 之间 | 输入超出范围 | 检查你的数字，删除多余字符 |
| ❌ ID 已存在 | 使用了已有的 ID | 改用新的唯一 ID |
| ❌ 光污染等级必须是 1-5 或 5+ | 输入无效值 | 只能填 1、2、3、4、5 或 5+ |
| ❌ 经度必须在 -180 到 180 之间 | 经度数字错误 | 检查坐标（可用地图确认） |
| ❌ Issue 没有自动关闭 | GitHub Actions 配置问题 | 参考 [故障排查](.github/TROUBLESHOOTING.md) |

---

## 🗺️ 如何找到正确的坐标？

### 使用高德地图（最准确）
1. 打开 [高德地图](https://amap.com)
2. 搜索地点名称
3. 点击地点
4. 查看地址栏右侧的坐标（格式：`纬度,经度`）
5. 复制坐标数字到 Issue/JSON 中

### 使用 Google 地图
1. 打开 [Google Maps](https://maps.google.com)
2. 右键点击地点
3. 复制显示的坐标（纬度,经度）
4. 分别填入 Latitude 和 Longitude 字段

### 使用 GPS 设备
- 直接在现场测量，准确度最高
- 填入测得的 N/E 坐标（注意方向）

---

## 🌙 光污染等级如何判断？

### 波特尔等级（Bortle 1-9）

在该地点使用目视天文观测时，能看到的最暗星星的星等：

- **1-3 级**（优秀）：极限星等 > 6.6，银河清晰，可看到银河细节
- **4-5 级**（良好）：极限星等 5.6-6.5，银河可见
- **6-7 级**（一般）：极限星等 4.6-5.5，银河模糊或不可见
- **8-9 级**（恶劣）：极限星等 < 4.5，只能看到最亮的星星

📖 详见 [README - 光害等级说明](../README.md#光害等级说明)

### 中国暗夜环境等级（Standard Light 1-5+）

按照中国标准评定的光污染等级：

- **1-2 级**（绿色 🟢）：优秀暗天环保区
- **3 级**（黄色 🟡）：一般
- **4 级**（橙色 🟠）：较差
- **5-5+ 级**（红色 🔴）：严重光污染

---

## ✅ 提交前的检查清单

在提交 Issue 或 PR 前，请确认：

- [ ] 名称和地点正确
- [ ] 坐标经过验证（使用地图工具）
- [ ] Bortle 等级在 1-9 之间
- [ ] Standard Light 等级是 1-5 或 5+
- [ ] JSON 格式正确（如果手动编辑）
- [ ] 图片 URL 可访问（如果有图片）
- [ ] 没有重复的 ID

---

## 🎓 想深入学习？

- 📚 [完整 README](../README.md)
- 🔧 [GitHub Actions 部署指南](../GITHUB_ACTIONS_SETUP.md)
- 📖 [Issue 自动更新详细指南](.ISSUE_AUTO_UPDATE.md)
- 🐛 [故障排查指南](.TROUBLESHOOTING.md)
- 📋 [Issue 格式快速参考](.ISSUE_TEMPLATE/quick_reference.md)

---

## 💡 贡献小贴士

1. **一次只提交一个地点** - 便于审核和追踪
2. **提供图片** - 帮助其他观星爱好者了解地点
3. **详细描述** - 在 Notes 中说明交通、设施等信息
4. **验证坐标** - 使用多个工具交叉验证
5. **参考现有条目** - 查看格式示例

---

## 🤝 社区指南

- ✅ 欢迎任何观星爱好者贡献
- ✅ 提供帮助，不强行要求完美
- ✅ 尊重他人的贡献
- ✅ 使用有建设性的反馈
- ❌ 禁止垃圾数据或虚假信息

---

## 🎉 你的第一个贡献就从现在开始！

1. [点击这里创建 Issue](../../issues/new?template=add-observatory.md)
2. 填写你最喜欢的观星地信息
3. 提交！系统会自动处理
4. 几分钟后，在地图上看到你的贡献 ⭐

感谢你的贡献！🙏

---

**有疑问？** 查看 [故障排查指南](.TROUBLESHOOTING.md) 或在 Issues 中提问。
