# ⚡ 快速命令参考

常用命令和快速操作指南。

---

## 🚀 快速开始命令

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/astro-view.git
cd astro-view

# 2. 启动本地服务器
python -m http.server 8000

# 3. 在浏览器中打开
# http://localhost:8000

# 4. 修改 JSON 并保存，自动检测变化（30 秒）
```

### 推送到 GitHub

```bash
# 1. 查看改动
git status

# 2. 添加所有文件
git add .

# 3. 提交更改
git commit -m "添加新观星地: 地点名称"

# 4. 推送到 GitHub
git push origin main
```

### 启用 GitHub Pages

```bash
# 1. 进入你的 GitHub 仓库
# 2. Settings → Pages
# 3. Source: main branch
# 4. 保存

# 你的网址将是：
# https://[username].github.io/astro-view
```

---

## 📋 验证和测试命令

### 验证 JSON 格式

```bash
# 检查 JSON 是否有效
python -m json.tool public/data/observatories.json

# 输出到文件（验证）
python -m json.tool public/data/observatories.json > /tmp/test.json

# 如果无输出，表示 JSON 格式正确
```

### 检查 Python 脚本

```bash
# 检查 Python 脚本语法
python -m py_compile .github/scripts/process_issue.py

# 无输出表示成功
```

### 测试本地服务器

```bash
# 验证服务器是否运行
curl http://localhost:8000/

# 验证 JSON 数据可访问
curl http://localhost:8000/public/data/observatories.json

# 验证 API 配置（查看 config）
curl http://localhost:8000/src/config.js
```

---

## 🔍 调试命令

### 检查 Git 状态

```bash
# 查看当前分支和未提交文件
git status

# 查看最近的提交
git log --oneline -5

# 查看文件改动
git diff

# 查看远程仓库信息
git remote -v
```

### 查看文件结构

```bash
# Windows PowerShell
# 列出所有文件
Get-ChildItem -Recurse -Include "*.js", "*.css", "*.html", "*.json" | Select-Object FullName

# 或使用树形结构（Windows）
tree /F

# Linux/Mac
# 列出所有文件
find . -type f -not -path './.git/*' | sort

# 树形结构
tree -I '.git|node_modules'
```

### 检查文件大小

```bash
# Windows PowerShell
# 查看文件大小
Get-ChildItem -Recurse | Select-Object FullName, @{n="Size(KB)";e={[math]::Round($_.Length/1KB, 2)}}

# Linux/Mac
# 查看文件大小
ls -lah src/
du -sh *
```

---

## 📝 编辑 JSON 数据

### 添加新的观星地

```bash
# 1. 打开 public/data/observatories.json
# 2. 在 observatories 数组中添加新条目
# 3. 确保 JSON 格式正确

# 示例：
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
  "notes": "靠近浙北高速，交通便利",
  "image": "https://example.com/image.jpg"
}

# 4. 验证 JSON 格式
python -m json.tool public/data/observatories.json

# 5. 提交并推送
git add public/data/observatories.json
git commit -m "添加新观星地: 安吉海"
git push origin main
```

---

## 🔧 配置和设置

### 更新 API Key

```bash
# 1. 编辑 src/config.js
# 2. 替换 AMAP_API_KEY

window.CONFIG = {
  AMAP_API_KEY: "你的新API Key",
  AMAP_SECURITY_JS_CODE: "你的安全码"
};

# 3. 保存并刷新网页
```

### 修改自动检查间隔

```javascript
// 在 src/app.js 中找到这一行：
const CHECK_INTERVAL = 30000; // 30 秒

// 修改为你需要的间隔（毫秒）
const CHECK_INTERVAL = 60000; // 60 秒

// 保存并重新加载网页
```

### 修改地图中心点

```javascript
// 在 src/app.js 的 initMap 函数中：
amap.setCenter([104.065540, 30.572815]); // [经度, 纬度]

// 改为你的中心点
amap.setCenter([121.47, 31.23]); // 例如：上海
```

---

## 🤖 GitHub Actions 命令

### 手动触发 Workflow

```bash
# 通过 GitHub CLI
gh workflow run process-observatory-issue.yml

# 或通过网页：
# GitHub 仓库 → Actions → process-observatory-issue → Run workflow
```

### 查看 Workflow 日志

```bash
# 使用 GitHub CLI
gh run list
gh run view <run-id>

# 或通过网页：
# GitHub 仓库 → Actions → 选择 workflow run → 点击 step 查看日志
```

### 调试 Workflow

```bash
# 在 .github/workflows/process-observatory-issue.yml 中添加调试步骤

- name: Debug
  run: |
    echo "环境变量："
    env
    echo "文件内容："
    cat public/data/observatories.json
```

---

## 📊 统计和分析

### 统计代码行数

```bash
# Windows PowerShell
# 统计 JavaScript 行数
(Get-Content src/app.js | Measure-Object -Line).Lines

# 统计所有代码行数
$files = Get-ChildItem -Recurse -Include "*.js", "*.css", "*.html"
$lines = 0
foreach ($file in $files) {
    $lines += (Get-Content $file | Measure-Object -Line).Lines
}
Write-Host "总行数: $lines"

# Linux/Mac
# 统计特定文件
wc -l src/app.js

# 统计目录下所有文件
find . -name "*.js" -o -name "*.css" | xargs wc -l
```

### 文件大小统计

```bash
# 计算所有代码的总大小
# Windows PowerShell
$size = (Get-ChildItem -Recurse -Include "*.js", "*.css", "*.html" | Measure-Object -Property Length -Sum).Sum
Write-Host "总大小: $([math]::Round($size/1KB, 2)) KB"

# Linux/Mac
du -sh src/
du -sh public/data/
du -sh .github/
```

---

## 🧹 清理和维护

### 清理缓存

```bash
# 清理 git 缓存
git gc

# 清理 git 大文件
git reflog expire --expire=now --all
git gc --prune=now

# 查看 git 仓库大小
du -sh .git/
```

### 清理本地文件

```bash
# 删除未追踪的文件（谨慎使用）
git clean -fd

# 查看哪些文件会被删除
git clean -fdn

# 重置到最后一次提交
git reset --hard HEAD
```

---

## 📦 备份和恢复

### 备份项目

```bash
# 创建备份副本
cp -r astro-view astro-view-backup

# 创建 zip 存档
# Windows
Compress-Archive -Path astro-view -DestinationPath astro-view-backup.zip

# Linux/Mac
zip -r astro-view-backup.zip astro-view
```

### 恢复项目

```bash
# 从本地分支恢复
git checkout HEAD -- src/app.js  # 恢复单个文件

# 从远程恢复
git checkout origin/main -- .  # 恢复所有文件

# 查看历史提交
git log --oneline
git checkout <commit-id>  # 检出特定提交
```

---

## 🌐 部署到不同平台

### GitHub Pages

```bash
# 1. 确保代码已推送
git push origin main

# 2. 启用 GitHub Pages（Settings → Pages）

# 3. 设置自定义域名（可选）
# 在 GitHub 仓库 Settings → Pages → Custom domain
```

### Cloudflare Pages

```bash
# 1. 连接 GitHub 仓库到 Cloudflare Pages
# 2. 设置构建命令（留空）
# 3. 设置构建输出（/）
# 4. 部署
```

### 自托管（Nginx）

```bash
# 1. 复制项目文件到服务器
scp -r astro-view user@server:/var/www/

# 2. 配置 Nginx
# 在 /etc/nginx/sites-enabled/ 中创建配置文件

server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/astro-view;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}

# 3. 重启 Nginx
sudo systemctl restart nginx
```

---

## 🔗 常用链接

### 项目相关
- 📖 [项目 README](README.md)
- 🚀 [快速开始](GETTING_STARTED.md)
- 📚 [文档索引](INDEX.md)

### 文档相关
- 🐛 [故障排查](.github/TROUBLESHOOTING.md)
- ⚙️ [GitHub Actions 设置](GITHUB_ACTIONS_SETUP.md)
- 📋 [部署检查清单](DEPLOYMENT_CHECKLIST.md)

### 在线资源
- 🗺️ [高德地图 API](https://lbs.amap.com)
- 🔄 [GitHub Actions 文档](https://docs.github.com/actions)
- 📖 [Python 文档](https://docs.python.org)

---

## 💡 快速提示

### 快速修复常见问题

```bash
# 问题：地图显示空白
# 解决：检查 API Key 和 Security Code

# 问题：JSON 数据不更新
# 解决：等待 30 秒自动检测，或点击刷新按钮

# 问题：Issue 提交后没反应
# 解决：检查 GitHub Actions 日志（Actions 选项卡）

# 问题：本地测试显示 404
# 解决：确保 Python 服务器运行，访问正确的路径
```

### 快速查看命令

```bash
# 显示当前目录结构
ls -la  # Linux/Mac
dir     # Windows

# 显示当前路径
pwd     # Linux/Mac
cd      # Windows

# 编辑文件
nano    # Linux/Mac 简单编辑
vim     # Linux/Mac 高级编辑
code    # VS Code
```

---

## 📚 相关学习资源

### Git 命令
```
git status      - 查看状态
git add .       - 添加所有文件
git commit -m   - 提交更改
git push        - 推送到远程
git pull        - 拉取更新
git log         - 查看历史
```

### Python 命令
```
python -m json.tool          - 验证 JSON
python -m py_compile         - 检查语法
python -m http.server 8000   - 启动服务器
```

### 高德地图 API
```
API 调用：fetch(url)
地图初始化：amap.setCenter([lng, lat])
添加标记：amap.add(marker)
事件监听：amap.on('click', callback)
```

---

## ⚠️ 注意事项

```
⚠️  不要在代码中硬编码 API Key
⚠️  不要将 src/config.js 提交到 git
⚠️  不要删除 .github 目录中的文件
⚠️  不要修改 observatories.json 的字段名
⚠️  不要在 Issue 中泄露 API 凭证
```

---

## ✨ 最后

这个快速参考包含了最常用的命令。更详细的说明请查看：
- [快速开始](GETTING_STARTED.md) - 适合初学者
- [故障排查](.github/TROUBLESHOOTING.md) - 解决问题
- [完整 README](README.md) - 项目全貌

祝你使用愉快！🚀

---

**更新时间**：2024 年  
**适用版本**：v1.0 及以上
