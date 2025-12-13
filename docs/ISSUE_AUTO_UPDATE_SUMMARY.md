# GitHub Issue 自动更新功能实现总结

## 📋 概述

实现了通过 GitHub Issue 自动更新观星地数据的功能。用户可以通过提交格式化的 Issue，系统自动解析、验证、更新 JSON 文件，并自动提交代码。

## 🆕 新增文件

### 工作流文件
```
.github/
├── workflows/
│   └── process-observatory-issue.yml       # GitHub Actions 工作流
├── scripts/
│   └── process_issue.py                    # 数据处理脚本
├── ISSUE_TEMPLATE/
│   ├── add-observatory.md                  # Issue 模板（主要）
│   └── quick_reference.md                  # 快速参考
└── ISSUE_AUTO_UPDATE.md                    # 详细使用指南
```

### 文档文件
```
项目根目录/
└── GITHUB_ACTIONS_SETUP.md                 # GitHub Actions 配置说明
```

## 🔄 工作流程

```
用户创建 Issue（带特定格式）
        ↓
GitHub Actions 触发 (on: issues -> opened, edited)
        ↓
执行 process_issue.py 脚本
        ↓
解析 Issue 内容提取字段
        ↓
验证数据有效性
        ↓
[成功分支]                  [失败分支]
更新 JSON 文件          发评论告知错误
提交代码变更            Issue 保持打开
推送到仓库
关闭 Issue
发评论确认
```

## 📝 Issue 模板字段

### 操作类型
- 添加新的观星地
- 更新现有观星地

### 数据字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | 字符串 | 否* | 唯一标识，新增自动生成，更新时必填 |
| name | 字符串 | 是 | 观星地名称 |
| latitude | 数字 | 是 | 纬度 (-90 ~ 90) |
| longitude | 数字 | 是 | 经度 (-180 ~ 180) |
| bortle | 字符串 | 是 | 波特尔等级 (1-9) |
| standardLight | 字符串 | 是 | 中国暗夜等级 (1-5 或 5+) |
| sqm | 字符串 | 是 | SQM 值 |
| climate | 字符串 | 是 | 气候情况 |
| accommodation | 字符串 | 是 | 住宿情况 |
| notes | 字符串 | 是 | 备注 |
| image | 字符串 | 否 | 图片 URL (可选) |

*更新时必填，新增时自动生成

## ✅ 验证规则

### 数值范围验证
- latitude: -90 ~ 90
- longitude: -180 ~ 180
- bortle: 1-9
- standardLight: 1, 2, 3, 4, 5, 5+

### 格式验证
- 必填字段不能为空
- 坐标必须是有效数字
- 光害等级必须在指定范围内

### 业务规则
- 新增：ID 不能重复
- 更新：ID 必须存在
- 图片 URL：可选，但需要是有效 HTTPS 链接

## 🔐 自动操作

工作流自动执行以下操作：

1. ✅ 解析 Issue 内容
2. ✅ 验证数据格式和有效性
3. ✅ 更新 JSON 文件
4. ✅ 生成坐标字符串（自动）
5. ✅ 生成观星地 ID（如果缺失）
6. ✅ 检测重复 ID
7. ✅ 提交代码到主分支
8. ✅ 关闭 Issue
9. ✅ 添加评论说明结果

## 📊 Python 脚本功能

### 主要函数

| 函数 | 功能 |
|------|------|
| parse_issue_body() | 使用正则表达式解析 Issue 内容 |
| validate_data() | 验证数据有效性 |
| load_json() | 加载 JSON 文件 |
| save_json() | 保存 JSON 文件 |
| generate_id() | 根据名称生成唯一 ID |
| process_observatory() | 处理并更新数据 |

### 输出说明

脚本通过 GitHub Actions Output 传递结果：

```
::set-output name=success::true|false
::set-output name=message::成功信息
::set-output name=error::错误信息
```

## 📖 文档清单

### 用户文档
- **[.github/ISSUE_AUTO_UPDATE.md](../.github/ISSUE_AUTO_UPDATE.md)** - 详细的使用指南
  - 工作流程说明
  - 分步使用指南
  - 数据格式要求
  - 常见问题解答

### 开发文档
- **[GITHUB_ACTIONS_SETUP.md](../GITHUB_ACTIONS_SETUP.md)** - 配置和部署指南
  - 系统要求
  - 部署步骤
  - 权限配置
  - 测试方法
  - 故障排查

### 快速参考
- **[.github/ISSUE_TEMPLATE/quick_reference.md](../.github/ISSUE_TEMPLATE/quick_reference.md)** - 快速查看表单

## 🧪 测试方法

### 本地测试
```bash
export ISSUE_BODY="name: 测试地点\nlatitude: 45.3\nlongitude: 127.5..."
export ISSUE_NUMBER=1
export ISSUE_TITLE="[观星地] 测试地点"
python .github/scripts/process_issue.py
```

### GitHub Actions 测试
1. 创建测试 Issue
2. 观察 Actions 执行
3. 查看 JSON 文件更新
4. 验证 Issue 是否自动关闭

## 🚀 使用流程

### 对普通用户
1. 进入 Issues → New Issue
2. 选择 "添加或更新观星地" 模板
3. 填写观星地信息
4. 提交，系统自动处理

### 对开发者
1. 直接 git push 修改 JSON
2. 或创建 Issue，让系统处理

## ⚙️ 配置需求

### GitHub 仓库设置
- [ ] GitHub Actions 已启用
- [ ] 工作流文件在 main 分支
- [ ] Python 3.10+ 可用（GitHub Actions 提供）
- [ ] 仓库有写权限

### 工作流权限
```yaml
permissions:
  issues: write       # 修改 Issue 状态
  contents: write     # 提交代码
```

## 📈 未来改进方向

可以考虑的优化：
- [ ] 支持图片上传到仓库而不是外链
- [ ] 支持编辑历史记录
- [ ] 支持批量导入
- [ ] 支持数据验证 webhook
- [ ] 支持自动生成坐标（调用 API）
- [ ] 支持邮件通知
- [ ] 支持多语言 Issue 模板

## 🔍 相关文件位置

```
.github/
├── workflows/
│   └── process-observatory-issue.yml       ← 工作流定义
├── scripts/
│   └── process_issue.py                    ← 处理脚本
├── ISSUE_TEMPLATE/
│   ├── add-observatory.md                  ← Issue 模板
│   └── quick_reference.md                  ← 快速参考
└── ISSUE_AUTO_UPDATE.md                    ← 使用指南

GITHUB_ACTIONS_SETUP.md                     ← 配置说明
README.md                                   ← 已更新
```

## 📝 更新日志

### v1.0 (2025-12-13)
- ✅ 实现 GitHub Issue 自动处理
- ✅ 支持添加和更新观星地
- ✅ 数据格式验证
- ✅ 自动生成 ID 和坐标
- ✅ 工作流自动化

## 常见命令

### 查看工作流状态
```bash
git log --grep="自动添加观星地数据"
```

### 验证 Python 脚本
```bash
python -m py_compile .github/scripts/process_issue.py
```

### 测试正则表达式
在 Python 中运行脚本并检查输出

## 技术栈

- **GitHub Actions** - CI/CD 自动化
- **Python 3** - 数据处理脚本
- **正则表达式** - 内容解析
- **JSON** - 数据存储
- **Markdown** - 文档和模板

## 支持与反馈

如遇到问题：
1. 查看 [Issue 自动更新指南](.github/ISSUE_AUTO_UPDATE.md)
2. 查看 [GitHub Actions 配置说明](GITHUB_ACTIONS_SETUP.md)
3. 查看 GitHub Actions 运行日志
4. 提交 Issue 或 Discussion

---

**功能完成时间**: 2025-12-13  
**版本**: 1.0  
**状态**: ✅ 生产就绪
