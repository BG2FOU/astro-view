# ✅ 部署前检查清单

使用此清单确保项目已完全准备好部署。

---

## 📋 部署前准备阶段

### 代码完整性检查

#### 必须文件
- [ ] `index.html` - 主页面存在且有效
- [ ] `src/app.js` - 核心 JavaScript 存在（303 行）
- [ ] `src/app.css` - 样式表存在（270+ 行）
- [ ] `src/config.js` - API 配置文件存在
  ```bash
  # 检查命令
  cat src/config.js  # 应该输出 CONFIG 对象
  ```

#### 数据文件
- [ ] `public/data/observatories.json` - 数据文件存在
  ```bash
  # 验证 JSON 格式
  python -m json.tool public/data/observatories.json
  ```

#### GitHub 自动化文件
- [ ] `.github/workflows/process-observatory-issue.yml` - 工作流存在
- [ ] `.github/scripts/process_issue.py` - Python 脚本存在（213 行）
- [ ] `.github/ISSUE_TEMPLATE/add-observatory.md` - Issue 模板存在

#### 配置文件
- [ ] `.gitignore` - 存在且包含 `src/config.js`
  ```bash
  # 检查 config.js 是否在 .gitignore 中
  grep "config.js" .gitignore  # 应该有匹配
  ```

### 文档完整性检查

- [ ] `README.md` - 项目说明（279 行）
- [ ] `GETTING_STARTED.md` - 快速开始指南
- [ ] `INDEX.md` - 文档索引
- [ ] `PROJECT_COMPLETION_SUMMARY.md` - 项目完成总结
- [ ] `CHANGELOG.md` - 更新日志
- [ ] `.github/ISSUE_AUTO_UPDATE.md` - Issue 完整教程
- [ ] `.github/TROUBLESHOOTING.md` - 故障排查指南
- [ ] `GITHUB_ACTIONS_SETUP.md` - GitHub Actions 部署指南

---

## 🔧 API 和凭证检查

### 高德地图 API

#### API Key 验证
- [ ] API Key 已设置在 `src/config.js` 中
  ```bash
  # 确保 config.js 包含有效的 KEY
  grep AMAP_API_KEY src/config.js
  ```

- [ ] API Key 对应的应用已启用 **Web 平台**
  - 登录：https://lbs.amap.com/dev/id/choose
  - 检查应用设置
  - 确保 Web 平台已启用

- [ ] Security JS Code 已设置
  ```bash
  # 检查 Security Code
  grep AMAP_SECURITY_JS_CODE src/config.js
  ```

- [ ] API Key 在有效期内
  - 登录高德开发者平台
  - 检查 Key 的过期日期
  - 如已过期，生成新 Key

#### 权限和请求限制
- [ ] 检查 API 配额是否充足
  - 高德地图开发者平台 → 配额统计
  - 确认日请求次数足够

### GitHub 配置

- [ ] GitHub Actions 已启用
  - 仓库 Settings → Actions → General
  - 确保 Actions 未禁用

- [ ] Actions 权限已配置
  - Settings → Actions → General
  - 下拉到 "Workflow permissions"
  - 选择 **"Read and write permissions"** ✅
  - 勾选 **"Allow GitHub Actions to create and approve pull requests"**

- [ ] Repository secrets（如需要）
  - Settings → Secrets and variables → Actions
  - 检查是否需要添加额外的 secrets

---

## 🌐 部署环境检查

### 本地开发环境

#### Python 环境
- [ ] Python 3.6+ 已安装
  ```bash
  python --version  # 应显示 3.6 或更高版本
  ```

- [ ] JSON 工具可用
  ```bash
  python -m json.tool public/data/observatories.json
  # 应该成功输出，无 JSONDecodeError
  ```

#### 本地服务器
- [ ] 可以启动 HTTP 服务器
  ```bash
  python -m http.server 8000
  # 应该显示：Serving HTTP on 0.0.0.0 port 8000...
  ```

- [ ] 本地网页可访问
  - 打开：http://localhost:8000
  - 应该看到地图加载和标记显示

- [ ] 地图功能正常
  - [ ] 地图显示（不是空白）
  - [ ] 标记显示（红色圆点）
  - [ ] 点击标记显示信息面板
  - [ ] 信息面板显示正确的数据

### Git 配置

#### Git 基本设置
- [ ] Git 已安装
  ```bash
  git --version  # 应显示版本号
  ```

- [ ] Git 用户已配置
  ```bash
  git config user.name
  git config user.email
  # 应显示用户名和邮箱
  ```

- [ ] SSH 密钥已配置（推荐）
  ```bash
  cat ~/.ssh/id_rsa.pub  # 应输出公钥
  ```

#### 仓库配置
- [ ] 远程仓库已配置
  ```bash
  git remote -v
  # 应显示 origin 指向 GitHub 仓库
  ```

- [ ] 所有更改已提交
  ```bash
  git status  # 应显示 "working tree clean"
  ```

- [ ] 主分支是最新的
  ```bash
  git log --oneline -5  # 应显示最近的提交
  ```

---

## 📤 GitHub Pages 部署

### GitHub 仓库检查

#### 仓库设置
- [ ] 仓库是公开的（Public）
  - Settings → Visibility
  - 应显示 "Public"

- [ ] 仓库名称正确
  - 应该是 `astro-view` 或类似名称
  - 用户名应该正确

#### 分支配置
- [ ] 主分支已设置
  - Settings → Branches
  - Default branch 应该是 `main`

- [ ] 分支保护规则（可选）
  - 检查是否有不必要的限制
  - 确保 Actions 能够提交更改

#### 页面配置
- [ ] GitHub Pages 已启用
  - Settings → Pages
  - Source 应该选择 `Deploy from a branch`
  - Branch 应该是 `main` 和 `/root`

- [ ] Pages 构建完成
  - Settings → Pages
  - 应该显示绿色的 ✅ "Your site is published"
  - 显示访问 URL

#### Pages URL
- [ ] 记录 Pages URL
  ```
  https://[username].github.io/astro-view
  ```

- [ ] URL 可访问
  - 打开上面的 URL
  - 应该看到正常的地图页面

### SSL/HTTPS 配置

- [ ] HTTPS 已启用
  - Settings → Pages
  - 应该显示 "Enforce HTTPS" 已启用 ✅

- [ ] 证书有效
  - 检查浏览器地址栏锁图标
  - 应该显示安全连接

---

## 🤖 GitHub Actions 部署检查

### Workflow 文件验证

#### 文件存在和格式
- [ ] Workflow 文件存在
  ```bash
  ls -la .github/workflows/
  # 应该看到 process-observatory-issue.yml
  ```

- [ ] YAML 格式有效
  ```bash
  # 可以在网上验证 YAML 格式
  # https://www.yamllint.com/
  ```

- [ ] 权限配置正确
  ```yaml
  permissions:
    issues: write
    contents: write
  ```

#### 触发条件
- [ ] Workflow 在 Issue 创建/编辑时触发
  ```yaml
  on:
    issues:
      types: [opened, edited]
  ```

#### 工作步骤
- [ ] 所有步骤都已定义
  - [ ] Checkout
  - [ ] Setup Python
  - [ ] Run Python script
  - [ ] Comment on issue
  - [ ] Push changes (如需要)
  - [ ] Close issue

### Python 脚本验证

#### 脚本存在和格式
- [ ] Python 脚本存在
  ```bash
  ls -la .github/scripts/
  # 应该看到 process_issue.py
  ```

- [ ] Python 语法正确
  ```bash
  python -m py_compile .github/scripts/process_issue.py
  # 无输出表示成功
  ```

#### 脚本功能检查
- [ ] parse_issue_body() 函数存在
- [ ] validate_data() 函数存在
- [ ] load_json() 和 save_json() 函数存在
- [ ] generate_id() 函数存在
- [ ] process_observatory() 函数存在

#### 依赖检查
- [ ] 脚本只使用标准库
  - re（正则表达式）
  - json（JSON 处理）
  - os（文件操作）
  - sys（系统操作）
  - 都是 Python 内置，无需额外安装 ✓

---

## 📋 Issue 模板验证

### 模板文件检查
- [ ] Issue 模板文件存在
  ```bash
  ls -la .github/ISSUE_TEMPLATE/
  # 应该看到 add-observatory.md
  ```

- [ ] 模板格式正确
  - 文件开头有 YAML front matter
  - 包含所有必需的字段标签

### 模板内容验证
- [ ] 操作类型字段存在
- [ ] ID 字段存在
- [ ] 名称字段存在
- [ ] 坐标字段存在（纬度、经度）
- [ ] Bortle 等级字段存在
- [ ] Standard Light 字段存在
- [ ] 其他字段存在（气候、住宿、备注、图片）

---

## 🌍 生产环境特定检查

### 如果使用 Cloudflare Pages

- [ ] Cloudflare 账户已创建
- [ ] 项目已连接到 GitHub
- [ ] 构建设置正确
  - Framework: None
  - Build command: (empty)
  - Build output directory: /

- [ ] 环境变量已配置（如需要）
  - Settings → Environment variables
  - AMAP_API_KEY 已设置

### 如果使用自托管 Nginx

- [ ] Nginx 已安装和配置
- [ ] 反向代理已设置
- [ ] API Key 已在服务器端存储
- [ ] HTTPS 证书已配置
- [ ] 文件权限已设置（644）

### 如果使用自定义域名

- [ ] 域名已购买
- [ ] DNS 记录已配置
  ```bash
  # 检查 DNS 解析
  nslookup yourdomain.com
  # 应该指向 GitHub Pages 或你的服务器
  ```

- [ ] 域名在 GitHub Pages 中配置
  - Settings → Pages → Custom domain
  - 输入你的域名

---

## 🧪 功能测试

### 地图功能测试

- [ ] 页面加载成功
  - 无 JavaScript 错误
  - 无网络错误

- [ ] 地图显示正常
  - 地图不是空白
  - 可以缩放和拖动

- [ ] 标记显示正确
  - 所有观星地都有标记
  - 标记显示在正确位置

- [ ] 信息面板功能
  - [ ] 点击标记显示面板
  - [ ] 面板显示正确的数据
  - [ ] 点击关闭按钮或面板外部隐藏
  - [ ] 面板显示光污染等级颜色

- [ ] 图片显示
  - [ ] 有图片的地点显示图片
  - [ ] 无图片的地点显示 "暂无图片"
  - [ ] 损坏的图片 URL 显示 "图片加载失败"

- [ ] 自动刷新功能
  - [ ] 每 30 秒检查一次数据更新
  - [ ] JSON 更改后自动刷新标记
  - [ ] 刷新按钮能手动触发刷新

### 响应式设计测试

- [ ] 桌面版（1024px+）
  - [ ] 布局正常
  - [ ] 所有功能可用
  - [ ] 文本可读

- [ ] 平板版（768-1024px）
  - [ ] 布局优化
  - [ ] 功能可用
  - [ ] 没有水平滚动条

- [ ] 手机版（480-768px）
  - [ ] 布局紧凑
  - [ ] 信息面板不遮挡地图
  - [ ] 所有按钮都可点击

- [ ] 小屏幕（<480px）
  - [ ] 极致优化
  - [ ] 可以垂直滚动浏览所有内容

### GitHub Actions 测试

- [ ] 创建测试 Issue
  - 使用 "添加或更新观星地" 模板
  - 填写有效的测试数据

- [ ] Workflow 执行
  - 进入 Actions 选项卡
  - 应该看到工作流运行
  - 应该显示所有步骤为绿色 ✅

- [ ] Issue 自动处理
  - [ ] Issue 收到自动评论
  - [ ] 评论包含成功或失败信息
  - [ ] 数据添加到 JSON（如成功）
  - [ ] Issue 自动关闭（如成功）

- [ ] 数据验证
  - [ ] 打开 `public/data/observatories.json`
  - [ ] 应该看到新添加的数据
  - [ ] 数据格式正确

- [ ] 地图更新
  - [ ] 刷新网页或等待 30 秒
  - [ ] 新的标记应该显示在地图上

### 错误处理测试

- [ ] 提交无效数据的 Issue
  - 比如：坐标超出范围
  - Workflow 应该失败并有详细错误消息

- [ ] 提交重复 ID 的 Issue
  - Workflow 应该报告 "ID 已存在"

- [ ] 浏览器开发工具
  - F12 打开控制台
  - 应该没有错误或只有警告
  - 应该看到调试信息

---

## 📊 性能检查

### 页面加载性能

- [ ] 首屏加载时间 < 3 秒
  - F12 → Network 选项卡
  - 查看总加载时间

- [ ] 资源大小优化
  - `src/app.js`: ~303 行（~10KB）
  - `src/app.css`: ~270 行（~8KB）
  - `observatories.json`: < 50KB

- [ ] 缓存策略正常
  - 静态资源可以被缓存
  - JSON 总是最新（cache: no-store）

### API 调用优化

- [ ] 高德地图 API 加载成功
- [ ] 没有重复的 API 调用
- [ ] JSON 轮询频率合理（30 秒）

---

## 📈 监控和日志

### 设置监控

- [ ] Google Analytics（可选）
  - 追踪用户访问
  - 追踪功能使用

- [ ] GitHub 错误追踪
  - 设置 Issue 报告标签
  - 文档中包含报告链接

### 日志检查

- [ ] 浏览器控制台日志
  - 重要事件有日志输出
  - 错误有详细信息

- [ ] GitHub Actions 日志
  - 可以查看工作流执行详情
  - 可以调试问题

---

## 🎯 最终检查

### 部署前的最后检查

```bash
# 1. 检查 git 状态
git status
# 应该显示: On branch main, working tree clean

# 2. 检查最近的提交
git log --oneline -1

# 3. 检查远程仓库
git remote -v
# 应该显示 GitHub 仓库地址

# 4. 验证 JSON 格式
python -m json.tool public/data/observatories.json > /dev/null
# 无输出表示成功

# 5. 测试本地服务器
python -m http.server 8000
# 然后访问 http://localhost:8000
```

### 部署后的验证

- [ ] 访问 GitHub Pages URL
  - https://[username].github.io/astro-view

- [ ] 所有页面加载正常
  - 主页面加载
  - 地图显示
  - 标记显示

- [ ] 链接都有效
  - 所有文档链接工作
  - 外部链接工作

- [ ] 功能都能用
  - 点击标记显示信息
  - 自动刷新工作
  - Issue 提交功能工作

---

## 📝 检查清单项目

### 打印此清单
```bash
# 你可以将此文件打印出来手动检查
```

### 自动化检查
```bash
#!/bin/bash
# 保存为 check-deployment.sh

# 检查必需文件
echo "检查必需文件..."
test -f index.html && echo "✓ index.html" || echo "✗ index.html"
test -f src/app.js && echo "✓ src/app.js" || echo "✗ src/app.js"
test -f src/app.css && echo "✓ src/app.css" || echo "✗ src/app.css"
test -f src/config.js && echo "✓ src/config.js" || echo "✗ src/config.js"
test -f public/data/observatories.json && echo "✓ observatories.json" || echo "✗ observatories.json"

# 验证 JSON
echo "验证 JSON..."
python -m json.tool public/data/observatories.json > /dev/null && echo "✓ JSON 格式有效" || echo "✗ JSON 格式错误"

# 检查 git 状态
echo "检查 git 状态..."
git status | grep -q "working tree clean" && echo "✓ 没有未提交文件" || echo "✗ 有未提交文件"
```

---

## ✅ 部署完成标志

当你完成以上所有检查后，你就可以自信地部署项目了！

**部署成功的标志：**
- ✅ 所有检查清单项目都已勾选
- ✅ 本地测试都能通过
- ✅ GitHub Pages 显示 "Your site is published"
- ✅ GitHub Actions Workflow 在运行
- ✅ Issue 模板工作正常
- ✅ 没有浏览器控制台错误

---

## 🎉 恭喜！你已准备就绪！

项目现在已准备好进行生产部署。享受你的观星地导览应用吧！🌟

---

**更新时间**：2024 年
**相关文档**：
- [项目完成总结](PROJECT_COMPLETION_SUMMARY.md)
- [GitHub Actions 部署指南](GITHUB_ACTIONS_SETUP.md)
- [故障排查指南](.github/TROUBLESHOOTING.md)

