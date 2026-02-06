# 观星地图项目：图片上传与网页端评论方案

## 1. 已实现的功能

### 1.1 Issue 内粘贴图片处理
**目标**: 用户可直接在 GitHub Issue 中粘贴图片，自动提取并存储

**实现方式**:
- ✅ GitHub Actions：`process_issue.py` 已增强，支持识别：
  - 标准 Markdown 图片语法：`![图片](url)`
  - GitHub 上传图片的直接URL：`https://user-images.githubusercontent.com/...`
  - 其他CDN直接链接

**Python正则表达式**:
```python
# 匹配标准 Markdown 图片
urls = re.findall(r'!\[.*?\]\((.*?)\)', image_section.group(1))

# 匹配直接的图片URL（GitHub上传、外链等）
direct_urls = re.findall(
    r'https://[\w\-\.]+/[\w\-/\.\?\=&]*(?:jpg|jpeg|png|gif|webp)', 
    image_section.group(1), 
    re.IGNORECASE
)
```


## 2. 网页端图片上传方案

### 2.1 方案 A: 使用 Giscus 评论组件（推荐）

**优点**:
- 基于 GitHub Discussions，获得完整的权限管理
- 自动处理 Markdown 和图片上传
- 用户无需离开网页，直接在评论框中粘贴图片
- 支持 GitHub 用户登录权限验证
- 完全免费，无第三方服务成本

**缺点**:
- 需要创建 GitHub App
- 评论数据存储在 GitHub Discussions 中（非 Issues）

**集成步骤**:
```html
<script src="https://giscus.app/client.js"
        data-repo="BG2FOU/astro-view"
        data-repo-id="YOUR_REPO_ID"
        data-category="Image Submissions"
        data-category-id="YOUR_CATEGORY_ID"
        data-mapping="specific"
        data-term="image-submission"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="light"
        data-lang="zh-CN"
        crossorigin="anonymous"
        async>
</script>
```

**获取IDs**:
1. 访问 [Giscus配置页面](https://giscus.app/zh-CN)
2. 连接 GitHub 账户，选择仓库
3. 创建新的 Discussions 分类
4. 自动生成配置代码

### 2.2 方案 B: 使用 Utterances 组件

**优点**:
- 更成熟的 GitHub Issues 集成
- 每个页面对应一个 GitHub Issue
- 用户可直接在网页评论，自动创建 Issue

**缺点**:
- 图片上传需要用户手动处理
- 每个页面一个 Issue，管理较复杂

**集成方式**:
```html
<script src="https://utteranc.es/client.js"
        repo="BG2FOU/astro-view"
        issue-term="pathname"
        theme="github-light"
        crossorigin="anonymous"
        async>
</script>
```

### 2.3 方案 C: 自定义表单 + 直链上传

**思路**: 
- 保留现有网页表单
- 添加图片预加载验证
- 支持从 URL 直接拉取（用户可上传到自己的图床）

**实现**:
- 在提交表单中添加"从URL添加"按钮
- 支持批量输入 URL
- 客户端验证图片链接有效性

---

## 3. 网页端集成建议方案

### 3.1 优化现有提交表单
当前 `index.html` 的提交表单已支持多图片输入，建议保留并增强：

**增强方向**:
1. **预验证**: 用户输入URL后，立即验证图片是否可访问
2. **拖拽上传**: 支持从本地拖拽图片到输入框
3. **剪贴板粘贴**: 检测到剪贴板有图片时，自动识别并添加

**示例改进代码**:
```javascript
// 监听粘贴事件
document.getElementById('form-image').addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
        // 如果粘贴的是图片，需要上传到外部服务
        if (item.type.startsWith('image/')) {
            // 方案1: 上传到 imgur 或其他免费图床
            uploadToImageService(item.getAsFile());
        }
    }
});

// 拖拽上传
document.getElementById('form-image').addEventListener('dragover', (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
});

document.getElementById('form-image').addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    // 处理拖拽的文件
});
```

### 3.2 与 Giscus 组合方案（推荐）

**适用场景**: 用户可直接在网页发表评论和讨论

**工作流**:
1. 用户填写观星地信息表单
2. 点击"提交" → 自动创建 Issue + 记录IP
3. 页面下方显示 Giscus 评论区
4. 用户可在评论区补充信息或讨论
5. GitHub Actions 自动处理 Issue 和评论中的图片

**HTML集成示例**:
```html
<div id="submit-panel" class="submit-panel hidden">
    <!-- 现有表单 -->
    <form id="observatory-form" class="observatory-form">
        <!-- ... 现有字段 ... -->
    </form>
</div>

<!-- Giscus 评论区 -->
<div id="comments-section" class="comments-section" style="margin-top: 40px;">
    <h3>💬 相关讨论</h3>
    <script src="https://giscus.app/client.js"
            data-repo="BG2FOU/astro-view"
            data-repo-id="YOUR_REPO_ID"
            data-category="Image Submissions"
            data-category-id="YOUR_CATEGORY_ID"
            data-mapping="specific"
            data-term="general-discussions"
            data-reactions-enabled="1"
            data-emit-metadata="0"
            data-input-position="bottom"
            data-theme="light"
            data-lang="zh-CN"
            crossorigin="anonymous"
            async>
    </script>
</div>
```

---

## 4. 图片来源和格式标准化

### 4.1 支持的图片来源
| 来源 | 格式 | 优先级 | 说明 |
|------|------|--------|------|
| GitHub 上传 | `https://user-images.githubusercontent.com/...` | 高 | Issue/PR中粘贴的图片 |
| jsDelivr CDN | `https://cdn.jsdelivr.net/gh/...` | 高 | 开源免费CDN |
| 用户图床 | 任何HTTPS URL | 中 | 需用户自己上传 |
| 本地Imgur | `https://imgur.com/...` | 中 | 支持但需用户手动上传 |

### 4.2 图片URL标准化
所有图片URL使用 `;` 分隔符：
```json
{
  "id": "HLHKSD",
  "name": "呼兰河口湿地",
  "image": "https://example.com/img1.jpg;https://example.com/img2.png"
}
```

### 4.3 GitHub Actions 处理流程
```
Issue 创建
    ↓
检测 "### 附图" 部分
    ↓
提取所有图片URL（Markdown格式 + 直接链接）
    ↓
去重并合并到 image 字段
    ↓
删除旧的 images 数组
    ↓
保存到 observatories.json
```

---

## 5. 未来改进方案

### 5.1 图片优化
- [ ] 自动压缩上传的图片（保留原始，生成缩略图）
- [ ] 生成WebP格式以提高加载速度
- [ ] 根据网络速度调整图片质量

### 5.2 图片托管
- [ ] 改为使用自托管方案（减少依赖第三方CDN）
- [ ] GitHub Pages 作为图片文件服务
- [ ] 或接入 Cloudinary 等CDN服务

### 5.3 用户认证
- [ ] GitHub OAuth 登录
- [ ] 信誉积分系统
- [ ] 重复提交检测

### 5.4 内容审查
- [ ] AI 内容检测
- [ ] 自动水印标记（非官方提交）
- [ ] 投票/审核机制

---

## 6. 实现优先级

| 优先级 | 功能 | 难度 | 工时 |
|--------|------|------|------|
| ⭐⭐⭐ | ✅ Issue内图片自动识别 | 低 | 1h |
| ⭐⭐⭐ | 增强表单图片验证 | 低 | 2h |
| ⭐⭐ | 集成Giscus评论 | 中 | 3h |
| ⭐⭐ | 本地拖拽上传 | 中 | 4h |
| ⭐ | 自托管图片服务 | 高 | 8h |
| ⭐ | 图片优化处理 | 高 | 6h |

---

## 7. 快速开始

### 7.1 启用 Giscus（推荐）
1. 访问 https://giscus.app/zh-CN
2. 连接你的 GitHub 账户
3. 输入仓库名：`BG2FOU/astro-view`
4. 选择"Discussions"作为映射目标
5. 复制生成的 `<script>` 标签到 `index.html`

### 7.3 测试Issue内图片识别
1. 在 GitHub Issue 中粘贴一张图片
2. 等待 GitHub Actions 运行
3. 检查 `observatories.json` 中是否正确识别该图片URL

---

## 8. 参考资源

- [Giscus官方文档](https://giscus.app/zh-CN)
- [Utterances](https://utteranc.es/)
- [GitHub Discussions API](https://docs.github.com/en/graphql/reference/objects#discussion)
- [jsDelivr 文档](https://www.jsdelivr.com/)
- [免费图床对比](https://github.com/search?q=free+image+hosting)

---

**更新时间**: 2026-02-06  
**维护者**: BG2FOU  
**状态**: ✅ 部分已实现，待完成功能见优先级表
