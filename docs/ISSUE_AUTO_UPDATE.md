# Issue 自动更新指南

## 概述

除了直接 git push 修改 JSON 外，你还可以通过在 GitHub Issue 中提交特定格式的内容，系统会自动解析并更新 `observatories.json` 文件。

## 工作流程

```
创建/编辑 Issue
    ↓
GitHub Actions 触发
    ↓
自动解析 Issue 内容
    ↓
验证数据格式和有效性
    ↓
更新 observatories.json
    ↓
提交代码变更
    ↓
关闭 Issue 并评论结果
```

## 使用步骤

### 1. 创建新 Issue

进入 GitHub 仓库，点击 **Issues** → **New Issue** → 选择 **"添加或更新观星地"** 模板

### 2. 填写信息

按照模板的提示填写以下内容：

#### 选择操作类型
- [ ] 添加新的观星地（新增）
- [ ] 更新现有观星地（修改）

#### 基本信息

**观星地 ID** (仅用于更新时)
- 留空则自动生成
- 格式：小写字母、数字、连字符（例如：`maoershan-1`）

**名称**
- 观星地的中文或英文名称
- 示例：`帽儿山富民村小木楼山庄`

**纬度和经度**
- 纬度范围：-90 到 90
- 经度范围：-180 到 180
- 示例：
  ```
  latitude: 45.31119
  longitude: 127.588019
  ```

#### 光害等级信息

**波特尔光害等级** (必填)
- 输入数字：1-9
- `1` 最好，`9` 最差
- 示例：`3`

**中国暗夜环境等级** (必填)
- 输入：1, 2, 3, 4, 5 或 5+
- `1` 最优秀，`5+` 最严重
- 示例：`1` 或 `5+`

**SQM 值** (必填)
- 天空亮度测量值
- 数值越高越好（通常在 17-22 之间）
- 示例：`21.70`

#### 其他信息

**气候情况**
- 描述该地点的气候特点
- 示例：`晴朗率较高，能见度优秀`

**住宿情况**
- 描述周边住宿条件
- 示例：`周边民宿众多` 或 `无住宿，仅露营`

**备注**
- 额外的重要信息
- 示例：`靠近水源，需带饮用水`

**图片 URL** (可选)
- 观星地的图片链接（HTTPS）
- 示例：`https://example.com/photo.jpg`

### 3. 提交 Issue

填写完成后点击 **Submit new issue**，系统将自动处理。

### 4. 查看结果

- ✅ **成功**：Issue 会自动关闭，并显示成功消息
- ❌ **失败**：Issue 保持打开，显示错误信息，请修正后重新编辑

## 数据格式要求

### 必填字段
- name（名称）
- latitude（纬度）
- longitude（经度）
- bortle（波特尔等级）
- standardLight（中国暗夜等级）
- sqm（SQM 值）
- climate（气候）
- accommodation（住宿）
- notes（备注）

### 可选字段
- image（图片 URL）
- id（自动生成，通常不需要手动填写）

### 字段验证规则

| 字段 | 规则 | 示例 |
|------|------|------|
| latitude | -90 到 90 的数字 | 45.31119 |
| longitude | -180 到 180 的数字 | 127.588019 |
| bortle | 1-9 之间的数字 | 3 |
| standardLight | 1-5 或 5+ | 1 或 5+ |
| sqm | 数字（通常 17-22） | 21.70 |
| image | 有效的 HTTPS URL | https://example.com/pic.jpg |

## 常见问题

### Q: 提交失败显示"缺少必填字段"怎么办？

**A:** 检查所有必填字段是否都填写了，并确保字段值不为空。可以参考模板下方的示例。

### Q: 如何更新已有的观星地？

**A:** 
1. 创建新 Issue 并选择"更新现有观星地"
2. 提供要更新的观星地 ID
3. 填写要修改的字段
4. 提交即可

### Q: 如何知道观星地的 ID？

**A:** ID 通常在 `observatories.json` 中，格式为小写字母和连字符。或者查看已关闭的 Issue，自动处理后会显示分配的 ID。

### Q: 支持自动生成坐标吗？

**A:** 支持！纬度和经度会自动转换为坐标字符串（格式：`经度°E,纬度°N`）。

### Q: 图片 URL 支持哪些格式？

**A:** 支持任何公开的 HTTPS 图片链接。建议使用：
- GitHub 的原始内容 URL
- 图床服务（如 Imgur, CDN 等）
- 自己的服务器 URL

### Q: Issue 自动关闭后还能重新打开吗？

**A:** 可以，但通常不需要。如果发现数据有误，创建新的 Issue 选择"更新现有观星地"即可。

## Issue 模板字段映射

```
Issue 字段              →  JSON 字段
─────────────────────────────────────
id                      →  id
name                    →  name
latitude                →  latitude
longitude               →  longitude
纬度和经度              →  coordinates (自动生成)
bortle                  →  bortle
standardLight           →  standardLight
sqm                     →  sqm
climate                 →  climate
accommodation           →  accommodation
notes                   →  notes
image                   →  image
```

## 工作流程详解

### 工作流文件位置
- `.github/workflows/process-observatory-issue.yml`

### 处理脚本位置
- `.github/scripts/process_issue.py`

### 触发条件
- Issue 创建时（`types: opened`）
- Issue 编辑时（`types: edited`）

### 自动操作
1. 检验 Issue 标题包含 `[观星地]`
2. 解析 Issue 内容提取字段
3. 验证数据有效性
4. 更新 JSON 文件
5. 提交更改到主分支
6. 自动关闭 Issue
7. 添加评论说明结果

## 本地测试

如果要在本地测试脚本逻辑（不依赖 GitHub Actions）：

```bash
# 设置环境变量
export ISSUE_BODY="$(cat << 'EOF'
name:
帽儿山富民村小木楼山庄

latitude:
45.31119

longitude:
127.588019
# ... 其他字段
EOF
)"

export ISSUE_NUMBER=1
export ISSUE_TITLE="[观星地] 帽儿山富民村小木楼山庄"

# 运行脚本
python .github/scripts/process_issue.py
```

## 更新日志

- **v1.0** (2025-12-13): 发布初始版本，支持通过 Issue 添加和更新观星地

## 相关文档

- [README.md](../../README.md) - 项目主文档
- [CONTRIBUTION.md](../../CONTRIBUTION.md) - 贡献指南
- [observatories.json](../../public/data/observatories.json) - 观星地数据文件
