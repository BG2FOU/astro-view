# GitHub Issue 自动更新功能配置

## 系统要求

该功能需要以下 GitHub 特性：

- GitHub Actions
- Issue templates
- Repository permissions

## 部署步骤

### 1. 启用 GitHub Actions

确保你的仓库已启用 GitHub Actions：

1. 进入仓库 → **Settings**
2. 左侧选择 **Actions**
3. 确保 **Actions permissions** 为 "Allow all actions"

### 2. 工作流文件

工作流文件已位于：
- `.github/workflows/process-observatory-issue.yml`

### 3. 脚本文件

处理脚本已位于：
- `.github/scripts/process_issue.py`

### 4. 权限配置

工作流需要以下权限（已在 YAML 中配置）：

```yaml
permissions:
  issues: write          # 需要修改 Issue 状态
  contents: write        # 需要提交代码
  pull-requests: write   # 需要创建 PR (可选)
```

## 测试工作流

### 本地测试脚本

在提交前可以本地测试 Python 脚本：

```bash
# 设置环境变量并运行脚本
export ISSUE_BODY="name: 测试地点"
export ISSUE_NUMBER=1
export ISSUE_TITLE="[观星地] 测试地点"

python .github/scripts/process_issue.py
```

### 在 GitHub 上测试

1. 创建一个测试 Issue
2. 按照模板填写
3. 观察 GitHub Actions 执行日志
4. 检查是否自动更新了 JSON

## 工作流执行日志

### 查看日志步骤

1. 进入仓库 → **Actions**
2. 选择 **自动处理观星地提交** 工作流
3. 点击最近的运行
4. 查看详细日志

### 常见日志输出

**成功：**
```
✅ 已添加新观星地: 帽儿山富民村小木楼山庄
- ID: `maoershan-fujun-cun`
- 坐标: 127.588019°E,45.311199°N
```

**失败：**
```
❌ 处理失败
错误: 纬度必须在 -90 到 90 之间
```

## 常见问题

### Q: 工作流没有自动触发怎么办？

**A:** 检查以下几点：
1. Issue 标题是否包含 `[观星地]`
2. GitHub Actions 是否已启用
3. 工作流文件是否在 main 分支上
4. 查看 Actions 日志了解详细信息

### Q: Issue 没有自动关闭怎么办？

**A:** 可能是：
1. 数据验证失败，查看评论了解具体原因
2. 脚本执行失败，查看 Actions 日志
3. 权限配置不正确

### Q: 如何手动处理失败的 Issue？

**A:** 
1. 按照评论中的错误提示修正信息
2. 重新编辑 Issue（会重新触发工作流）
3. 或者手动修改 JSON 并 git push

## 隐私与安全

### 敏感信息保护

该工作流：
- ✅ 不存储任何敏感信息
- ✅ 不上传数据到外部服务
- ✅ 仅修改本地 JSON 文件
- ✅ 所有操作都在 GitHub 上进行

### Issue 内容

所有通过 Issue 提交的信息都是公开的，包括：
- 观星地坐标
- 图片 URL
- 备注信息

**建议：** 不要在 Issue 中提交隐私信息或敏感数据

## 自定义配置

### 修改刷新间隔

编辑 `.github/workflows/process-observatory-issue.yml`：

```yaml
# 改变触发条件
on:
  issues:
    types: [opened, edited, reopened]  # 添加 reopened
```

### 修改验证规则

编辑 `.github/scripts/process_issue.py` 中的 `validate_data()` 函数

### 修改自动生成的 ID

编辑 `.github/scripts/process_issue.py` 中的 `generate_id()` 函数

## 故障排查

### 问题：提交总是失败

**解决方案：**
1. 检查字段名称是否正确（区分大小写）
2. 确保数值在有效范围内
3. 检查必填字段是否为空

### 问题：工作流执行超时

**解决方案：**
1. 通常不会发生，脚本执行很快
2. 如果发生，检查 Actions 运行时间限制

### 问题：JSON 文件未更新

**解决方案：**
1. 查看 Actions 日志确认脚本是否成功运行
2. 检查是否提交了代码
3. 检查分支是否为 main

## 相关文档

- [Issue 自动更新指南](./.github/ISSUE_AUTO_UPDATE.md)
- [Issue 模板](./.github/ISSUE_TEMPLATE/add-observatory.md)
- [README](./README.md)

## 更新历史

- **2025-12-13**: 初版发布
