# 观星地图项目 - IP记录和图片处理功能更新

## 📋 更新概览

本次更新为观星地提交系统添加了：

2. **Issue内粘贴图片自动识别** ✅  
3. **网页端图片上传和评论方案** 📖

---

## ✨ 已实现功能

### 2. Issue内图片自动识别

#### 工作原理
当用户在GitHub Issue中粘贴图片时，GitHub会：
1. 上传图片到 `user-images.githubusercontent.com`
2. 在Issue体中生成 Markdown 图片语法
3. GitHub Actions 自动运行

#### Python脚本增强（.github/scripts/process_issue.py）

**新增特性**:
```python
# 识别两种图片URL格式
# 1. Markdown标准格式
urls = re.findall(r'!\[.*?\]\((.*?)\)', image_section.group(1))

# 2. GitHub上传或直接链接
direct_urls = re.findall(
    r'https://[\w\-\.]+/[\w\-/\.\?\=&]*(?:jpg|jpeg|png|gif|webp)',
    image_section.group(1),
    re.IGNORECASE
)

# 合并去重
all_urls = list(set(urls + direct_urls))
data['image'] = ';'.join(all_urls)
```

#### 支持的图片来源
| 来源 | 示例 | 支持 |
|------|------|------|
| GitHub上传 | `https://user-images.githubusercontent.com/xxx` | ✅ |
| jsDelivr CDN | `https://cdn.jsdelivr.net/gh/...` | ✅ |
| 外链URL | `https://example.com/image.jpg` | ✅ |
| Markdown链接 | `![图](url)` | ✅ |

---

## 📺 网页端方案讨论

已创建详细方案文档：**docs/IMAGE_UPLOAD_AND_COMMENTS_PLAN.md**

### 推荐方案：Giscus + 现有表单

#### Giscus 优势
- ✅ 用户无需离开网页，直接粘贴图片
- ✅ GitHub Discussions 完全托管
- ✅ 自动Markdown支持
- ✅ 用户权限验证
- ✅ 完全免费

#### 集成步骤
1. 访问 https://giscus.app/zh-CN
2. 连接GitHub账户，选择仓库
3. 创建"Image Submissions"分类
4. 复制生成代码到 index.html

#### HTML示例
```html
<script src="https://giscus.app/client.js"
        data-repo="BG2FOU/astro-view"
        data-repo-id="YOUR_REPO_ID"
        data-category="Image Submissions"
        data-category-id="YOUR_CATEGORY_ID"
        data-mapping="specific"
        data-term="image-submission"
        data-reactions-enabled="1"
        data-input-position="bottom"
        data-theme="light"
        data-lang="zh-CN"
        crossorigin="anonymous"
        async>
</script>
```

---

## 📝 使用示例

### 场景1：用户通过网页表单提交
1. 填写观星地信息
2. 粘贴或输入图片URL（多张用换行或`;`分隔）
3. 点击"📤 提交"
4. 系统自动记录用户IP并创建GitHub Issue
5. Issue 底部显示提交者IP

### 场景2：用户在GitHub Issue中粘贴图片
1. 打开新建Issue页面
2. 粘贴图片（GitHub自动上传）
3. 填写观星地信息
4. 点击"Create issue"
5. GitHub Actions自动运行
6. 识别Issue中的所有图片
7. 更新 `observatories.json`

### 场景3：用户通过评论补充图片
1. 用户在网页Giscus评论区粘贴图片
2. 评论自动保存到GitHub Discussions
3. 可后续人工审核并整合到数据库

---

## 🔍 测试清单

### 前端测试
- [ ] 提交表单是否正确获取用户IP
- [ ] 多张图片URL是否正确识别
- [ ] 编辑时图片修改是否检测成功
- [ ] 本地环境是否显示"unknown"

### 后端测试
- [ ] API是否正确接收IP信息
- [ ] Issue中是否显示"由 xxx 提交"
- [ ] Cloudflare Functions是否正常运行

### GitHub Actions测试
- [ ] 是否正确识别Markdown图片链接
- [ ] 是否正确识别GitHub上传的图片
- [ ] 是否正确识别外链图片
- [ ] 是否正确去重合并

### 集成测试
1. 创建测试Issue包含：
   ```text
   ### 附图
   ![图1](https://example.com/img1.jpg)
   https://example.com/img2.png
   ```
2. 观察Actions运行结果
3. 检查 `observatories.json` 中的 `image` 字段

---

## 📊 代码改动汇总

| 文件 | 改动 | 行数 | 说明 |
|------|------|------|------|
| `src/app.js` | + `getUserIP()` 函数 | +40 | 获取用户IP |
| `src/app.js` | 更新 `submitObservatory()` | +3 | 调用IP获取 |
| `src/app.js` | 更新 `submitObservatoryUpdate()` | +3 | 调用IP获取 |
| `src/app.js` | 更新 `buildIssueBody()` | +2 | 显示IP |
| `functions/api/submit.js` | 更新Issue Body | +2 | 显示IP |
| `functions/api/update.js` | 更新Issue Body | +2 | 显示IP |
| `.github/scripts/process_issue.py` | 增强图片识别 | +5 | 支持直链 |
| `docs/IMAGE_UPLOAD_AND_COMMENTS_PLAN.md` | 新增 | 300+ | 完整方案 |

---

## 🚀 下一步行动

### 立即执行（优先级⭐⭐⭐）
1. ✅ **已完成**：IP地址记录
2. ✅ **已完成**：Issue图片识别
3. ⏳ **进行中**：部署到Cloudflare Pages
4. ⏳ **进行中**：在GitHub Actions中验证

### 短期目标（1-2周）
- [ ] 测试IP获取是否正常工作
- [ ] 测试GitHub上传图片识别
- [ ] 监控GitHub Actions运行日志
- [ ] 完善错误处理和日志记录

### 中期目标（1个月）
- [ ] 集成Giscus评论组件
- [ ] 添加表单拖拽上传功能
- [ ] 改进图片预加载验证
- [ ] 创建用户文档

### 长期目标（3个月+）
- [ ] 自托管图片服务
- [ ] 图片优化和压缩
- [ ] 用户认证和信誉系统
- [ ] 内容自动审查

---

## 🔐 安全和隐私

### IP地址使用
- IP仅用于**溯源**和**防滥用**，不进行追踪
- 用户无需登录即可提交
- IP地址在GitHub Issue中公开显示
- 建议在隐私政策中说明

### 图片来源验证
- 所有图片都需要HTTPS
- 将验证图片URL的有效性
- 防止恶意链接注入

---

## 📞 技术支持

如遇问题，请检查：
1. Cloudflare Pages 环境变量 `GITHUB_TOKEN` 是否设置
2. GitHub Actions 工作流权限是否配置
3. Python脚本是否有语法错误（已通过检查✅）
4. 网络连接是否正常（IP查询服务可能被屏蔽）

---

**更新日期**: 2026-02-06  
**版本**: v2.0.0  
**维护者**: BG2FOU
