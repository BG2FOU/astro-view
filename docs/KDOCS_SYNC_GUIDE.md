# 金山文档自动同步配置指南

## 概述

本项目已配置自动从金山文档同步观星地数据的GitHub Actions工作流。

## 文件说明

### 1. 同步脚本
- **位置**: `scripts/sync-observatories.js`
- **功能**: 从金山文档获取数据并更新 `public/data/observatories.json`

### 2. GitHub Actions工作流
- **位置**: `.github/workflows/sync-observatories.yml`
- **触发时间**: 每天北京时间早上8点（UTC 0点）
- **功能**: 自动运行同步脚本并提交更改

## 数据源格式

### 金山文档URL
https://www.kdocs.cn/l/cnxtcbkOwWMM

### 数据列映射
| 列 | 字段名 | 对应JSON字段 |
|----|--------|-------------|
| D | 观星地ID | id |
| E | 观星地名称 | name |
| F | 观星地纬度 | latitude |
| G | 观星地经度 | longitude |
| H | 波特尔光害等级 | bortle |
| I | 中国暗夜环境等级 | standardLight |
| J | SQM值 | sqm |
| K | 气候情况 | climate |
| L | 住宿情况 | accommodation |
| M | 备注 | notes |
| N | 观星地附图 | image |

## 使用方法

### 本地测试同步
```bash
# 安装依赖
npm install

# 运行同步脚本
npm run sync
```

### 手动触发GitHub Actions
1. 进入仓库的 Actions 标签页
2. 选择 "同步观星地数据" 工作流
3. 点击 "Run workflow" 按钮
4. 选择分支并运行

### 查看同步日志
1. 进入仓库的 Actions 标签页
2. 选择最近的工作流运行记录
3. 查看详细日志

## 重要说明

### 金山文档导出配置
金山文档可能需要特殊的导出设置：

1. **方式一：直接导出链接**
   - 在金山文档中设置允许"任何人可查看"
   - 使用导出URL: `https://www.kdocs.cn/l/cnxtcbkOwWMM?export=xlsx`

2. **方式二：使用金山文档API**
   - 如果需要API访问，需要申请金山文档开发者账号
   - 配置API密钥到GitHub Secrets

3. **方式三：手动导出CSV**
   - 定期将文档导出为CSV并上传到GitHub

### 当前实现
当前脚本使用 `xlsx` 库解析Excel文件，尝试从金山文档的导出URL获取数据。

如果金山文档不支持直接导出，可能需要：
- 设置API密钥
- 使用第三方服务（如Zapier、Make.com等）
- 手动触发同步

## 故障排查

### 问题1：无法访问金山文档
**解决方案**:
- 确认文档链接设置为"任何人可查看"
- 检查导出URL是否正确
- 查看GitHub Actions日志中的错误信息

### 问题2：数据格式不匹配
**解决方案**:
- 确认金山文档表格格式与列映射一致
- 第一行必须是表头
- 数据从第二行开始
- D到N列包含必需的数据

### 问题3：同步后数据丢失
**解决方案**:
- 检查observatories.json文件
- 确认所有行都有ID和名称
- 查看GitHub提交历史

## 手动配置步骤

### 1. 配置仓库权限
确保GitHub Actions有写入权限：
1. 进入仓库 Settings → Actions → General
2. 找到 "Workflow permissions"
3. 选择 "Read and write permissions"
4. 保存更改

### 2. 测试工作流
```bash
# 克隆仓库
git clone https://github.com/你的用户名/astro-view.git
cd astro-view

# 安装依赖
npm install

# 本地测试
npm run sync

# 检查生成的文件
cat public/data/observatories.json
```

### 3. 首次运行
- 推送代码到GitHub
- Actions会在下次定时任务时自动运行
- 或者手动触发工作流进行首次同步

## 定时任务说明

工作流配置为每天运行一次：
```yaml
schedule:
  - cron: '0 0 * * *'  # 每天UTC 0点 = 北京时间早上8点
```

修改运行频率：
- `0 */6 * * *` - 每6小时运行一次
- `0 0 * * 1` - 每周一运行
- `0 0 1 * *` - 每月1号运行

## 数据验证

同步后建议检查：
1. ✅ 所有观星地都有唯一ID
2. ✅ 纬度范围: -90 到 90
3. ✅ 经度范围: -180 到 180
4. ✅ 必填字段不为空
5. ✅ JSON格式正确

## 联系支持

如遇到问题，请：
1. 查看GitHub Actions日志
2. 检查金山文档访问权限
3. 提交Issue说明具体问题
