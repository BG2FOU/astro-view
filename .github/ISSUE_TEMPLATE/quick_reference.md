---
name: Issue 提交快速参考
about: 快速查看 Issue 提交格式
---

# Issue 提交快速参考

## 字段填写要求

```
操作类型: 选择 "添加新的观星地" 或 "更新现有观星地"

基本信息:
├─ id: unique-id (仅更新时必填，新增自动生成)
├─ name: 观星地名称
├─ latitude: 45.31119
└─ longitude: 127.588019

光害等级:
├─ bortle: 1-9 的数字
├─ standardLight: 1, 2, 3, 4, 5 或 5+
└─ sqm: 21.70

其他信息:
├─ climate: 气候描述
├─ accommodation: 住宿情况
├─ notes: 备注
└─ image: https://example.com/photo.jpg (可选)
```

## 有效值范围

| 字段 | 有效值 | 示例 |
|------|--------|------|
| latitude | -90 ~ 90 | 45.31119 |
| longitude | -180 ~ 180 | 127.588019 |
| bortle | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 3 |
| standardLight | 1, 2, 3, 4, 5, 5+ | 1 或 5+ |
| sqm | 任何数字 | 21.70 |

## 填写提示

✅ **正确的例子：**
```
latitude: 45.31119
bortle: 3
standardLight: 1
image: https://example.com/photo.jpg
```

❌ **错误的例子：**
```
latitude: 45.311A9 (含有字母)
bortle: 10 (超出范围)
standardLight: 2+ (无效值)
image: http://example.com (应该是 HTTPS)
```

## 常见错误

| 错误 | 原因 | 修复 |
|------|------|------|
| "缺少必填字段" | 字段为空 | 确保所有必填字段都已填写 |
| "纬度必须在 -90 到 90" | 数字超出范围 | 检查纬度值是否正确 |
| "波特尔光害等级必须是 1-9" | 输入了 0、10 或其他值 | 只能输入 1-9 |
| "找不到要更新的观星地" | ID 不正确 | 检查观星地 ID 是否存在 |

## 需要帮助?

- 📖 查看 [Issue 自动更新指南](../.github/ISSUE_AUTO_UPDATE.md)
- 💬 在 Issue 中提问
- 🐛 报告 Bug
