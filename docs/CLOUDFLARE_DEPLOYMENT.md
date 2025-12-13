# 🚀 Cloudflare Pages 部署指南

将观星地导览项目部署到 Cloudflare Pages，需要妥善处理 API 密钥安全问题。

---

## 🔐 API 密钥安全问题

### 当前的风险
```javascript
// ❌ 不安全的做法（当前方式）
const CONFIG = {
    AMAP_API_KEY: 'e5b759a2a9a743ac99a07e48b1dbe23b',  // 暴露在客户端代码中
    AMAP_SECURITY_JS_CODE: 'f93d8688a469db5a5645503baba74a60'
};
```

**问题：**
- API Key 在浏览器中完全可见（F12 查看）
- 任何人都可以复制你的 Key 滥用
- 高德地图可能因过度使用而限流或收费
- 安全性极低

---

## ✅ 推荐方案：Cloudflare Worker 代理（最安全）

### 原理图
```
浏览器请求
    ↓
你的 Cloudflare Pages
    ↓
Cloudflare Worker（处理 API 请求）
    ↓
高德地图 API

Worker 中存储 API Key，浏览器无法访问
```

### 实现步骤

#### 1️⃣ 修改前端代码

在 `src/app.js` 中，修改 API 调用方式：

```javascript
// 原始方式（不使用）
// const amap = new AMap.Map('map', {...});

// 新方式：通过 Worker 代理获取数据
async function loadAMapWithLoader() {
    window._AMapSecurityConfig = {
        securityJsCode: await getSecurityCode(),  // 从 Worker 获取
    };
    
    return new Promise((resolve) => {
        AMapLoader.load({
            key: await getApiKey(),  // 从 Worker 获取
            version: '2.0',
            plugins: ['AMap.PolylineEditor']
        }).then((AMap) => {
            initMap(AMap);
            resolve(AMap);
        });
    });
}

// 从 Worker 获取 API Key
async function getApiKey() {
    const response = await fetch('/api/amap-key');
    const data = await response.json();
    return data.key;
}

// 从 Worker 获取 Security Code
async function getSecurityCode() {
    const response = await fetch('/api/amap-security');
    const data = await response.json();
    return data.code;
}
```

#### 2️⃣ 创建 Cloudflare Worker

创建文件：`_worker.js`（或 `functions/_middleware.ts`）

```javascript
// _worker.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理 API Key 请求
    if (url.pathname === '/api/amap-key') {
      return new Response(JSON.stringify({
        key: env.AMAP_API_KEY
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 处理 Security Code 请求
    if (url.pathname === '/api/amap-security') {
      return new Response(JSON.stringify({
        code: env.AMAP_SECURITY_JS_CODE
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 其他请求转发到静态资源
    return env.ASSETS.fetch(request);
  }
};
```

#### 3️⃣ 在 Cloudflare 中配置环境变量

1. **进入 Cloudflare Dashboard**
   - 选择你的域名
   - Workers & Pages → 选择你的项目
   - 设置 → 环境变量

2. **添加环境变量**
   ```
   AMAP_API_KEY = e5b759a2a9a743ac99a07e48b1dbe23b
   AMAP_SECURITY_JS_CODE = f93d8688a469db5a5645503baba74a60
   ```

3. **保存配置**

#### 4️⃣ 部署到 Cloudflare Pages

```bash
# 1. 推送代码到 GitHub
git add .
git commit -m "Add Cloudflare Worker for API key handling"
git push origin main

# 2. 在 Cloudflare Dashboard 中
# Pages → Connect to Git → 选择你的仓库
# 构建设置：
# - Framework preset: None
# - Build command: (留空)
# - Build output directory: /

# 3. 设置环境变量后重新部署
```

---

## 🔄 方案对比

### 方案 A：Cloudflare Worker 代理（推荐）✅

| 方面 | 说明 |
|------|------|
| 安全性 | ⭐⭐⭐⭐⭐ 最安全，Key 完全隐藏 |
| 复杂度 | ⭐⭐⭐ 需要创建 Worker |
| 成本 | ⭐⭐⭐⭐ Cloudflare Free 包含 Worker |
| 性能 | ⭐⭐⭐⭐⭐ Worker 本地处理 |
| 维护 | ⭐⭐⭐⭐ 配置简单 |

**优点：**
- API Key 完全安全，存储在服务器
- 可以添加速率限制，防止滥用
- 可以记录日志，监控使用情况
- Cloudflare 免费计划包含 Worker

**缺点：**
- 需要创建 Worker 代码
- 需要修改前端代码

---

### 方案 B：使用 Cloudflare 环境变量 + 动态加载

```javascript
// 在 index.html 中动态加载 config
async function loadConfig() {
    // 从后端获取配置
    const response = await fetch('/api/config');
    const config = await response.json();
    window.CONFIG = config;
}

// 初始化前调用
loadConfig().then(() => {
    setupAMapSecurity();
    loadAMapWithLoader();
});
```

**缺点：**
- 仍然需要在某个地方暴露 Key
- 只是延迟暴露，不是真正的安全

---

### 方案 C：使用高德地图的官方代理

```javascript
// 使用高德地图官方的代理方式
// 但这通常需要付费或有其他限制
```

---

## 📝 具体实现：完整 Worker 代码

### 简单版本

```javascript
// _worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 路由：提供 API Key
    if (url.pathname === '/api/amap-key') {
      return new Response(
        JSON.stringify({
          key: env.AMAP_API_KEY
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // 路由：提供 Security Code
    if (url.pathname === '/api/amap-security') {
      return new Response(
        JSON.stringify({
          code: env.AMAP_SECURITY_JS_CODE
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // 默认：返回静态资源
    return env.ASSETS.fetch(request);
  }
};
```

### 加强版本（含防护）

```javascript
// _worker.js - 带速率限制和日志
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP');
    
    // 检查速率限制（简单版本）
    const rateLimitKey = `ratelimit:${clientIP}`;
    const count = await env.CACHE.get(rateLimitKey) || 0;
    
    if (count > 100) {  // 每分钟最多 100 次请求
      return new Response('Too many requests', { status: 429 });
    }
    
    // 更新计数
    await env.CACHE.put(rateLimitKey, count + 1, { expirationTtl: 60 });
    
    // 日志记录
    console.log(`API Key request from ${clientIP} at ${new Date().toISOString()}`);
    
    // 提供 API Key
    if (url.pathname === '/api/amap-key') {
      return new Response(
        JSON.stringify({
          key: env.AMAP_API_KEY,
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // 其他路由...
    return env.ASSETS.fetch(request);
  }
};
```

---

## 📝 修改前端代码

### 修改 `src/app.js`

```javascript
// 在文件顶部添加
let CONFIG = {};

// 在 DOMContentLoaded 之前加载配置
async function initializeConfig() {
    try {
        const keyResponse = await fetch('/api/amap-key');
        const securityResponse = await fetch('/api/amap-security');
        
        const keyData = await keyResponse.json();
        const securityData = await securityResponse.json();
        
        CONFIG = {
            AMAP_API_KEY: keyData.key,
            AMAP_SECURITY_JS_CODE: securityData.code
        };
        
        console.log('Config loaded from Worker');
        return true;
    } catch (error) {
        console.error('Failed to load config:', error);
        return false;
    }
}

// 修改 setupAMapSecurity 函数
function setupAMapSecurity() {
    window._AMapSecurityConfig = {
        securityJsCode: CONFIG.AMAP_SECURITY_JS_CODE,
        securityJsUrl: 'https://webapi.amap.com/maps/js/sec/amap_sec_z.js'
    };
}

// 修改初始化流程
document.addEventListener('DOMContentLoaded', async function() {
    // 先加载配置
    const configLoaded = await initializeConfig();
    if (!configLoaded) {
        console.error('Cannot proceed without config');
        return;
    }
    
    // 然后初始化 AMap
    setupAMapSecurity();
    loadAMapWithLoader();
    
    // 其余初始化代码...
    document.getElementById('refreshBtn').addEventListener('click', refreshObservatories);
    document.getElementById('closePanelBtn').addEventListener('click', hideObservatoryInfo);
    
    document.getElementById('infoPanel').addEventListener('click', (e) => {
        if (e.target === document.getElementById('infoPanel')) {
            hideObservatoryInfo();
        }
    });
});
```

---

## 🔒 安全最佳实践

### 1. 环境变量管理

```bash
# ✅ 正确做法：在 Cloudflare Dashboard 中设置
AMAP_API_KEY = xxx
AMAP_SECURITY_JS_CODE = xxx

# ❌ 错误做法：在代码中硬编码
const CONFIG = {
    AMAP_API_KEY: 'xxx'  // 暴露！
};
```

### 2. 速率限制

```javascript
// 防止 API 密钥被滥用
if (request_count > threshold) {
    return new Response('Rate limited', { status: 429 });
}
```

### 3. 请求验证

```javascript
// 只允许来自你的域名的请求
const origin = request.headers.get('Origin');
if (!origin.includes('your-domain.com')) {
    return new Response('Forbidden', { status: 403 });
}
```

### 4. HTTPS 强制

```javascript
// 确保所有请求都使用 HTTPS
if (url.protocol !== 'https:') {
    return Response.redirect(
        'https://' + url.host + url.pathname,
        301
    );
}
```

---

## 📋 部署检查清单

### Cloudflare Pages 配置

- [ ] 仓库已连接到 Cloudflare Pages
- [ ] 构建输出目录设置为 `/`
- [ ] Build 命令留空
- [ ] 环境变量已配置（AMAP_API_KEY, AMAP_SECURITY_JS_CODE）

### Worker 配置

- [ ] `_worker.js` 已创建
- [ ] Worker 正确处理 `/api/amap-key` 和 `/api/amap-security`
- [ ] CORS headers 已设置
- [ ] Worker 与静态文件正确集成

### 前端代码

- [ ] `src/app.js` 已修改为从 Worker 加载 config
- [ ] `config.js` 可以从版本控制中移除
- [ ] `.gitignore` 不再需要排除 `src/config.js`
- [ ] 所有 API 调用都正确处理异步加载

### 测试

- [ ] 本地测试成功
- [ ] Cloudflare Pages 部署成功
- [ ] 地图显示正常
- [ ] 标记显示正确
- [ ] 自动更新工作正常
- [ ] 浏览器控制台无 API Key 暴露

---

## 🚀 完整部署流程

### 步骤 1：准备代码

```bash
# 修改 src/app.js
# 创建 _worker.js
# 更新 .gitignore（可选）

git add .
git commit -m "Setup Cloudflare Pages with Worker proxy"
git push origin main
```

### 步骤 2：配置 Cloudflare

1. 进入 Cloudflare Dashboard
2. 选择你的域名 → Pages
3. 连接 GitHub 仓库
4. 设置环境变量：
   - `AMAP_API_KEY` = 你的 Key
   - `AMAP_SECURITY_JS_CODE` = 你的 Code
5. 部署

### 步骤 3：验证部署

```bash
# 检查是否成功
curl https://your-domain.com/api/amap-key

# 应该返回：
# {"key":"e5b759a2a9a743ac99a07e48b1dbe23b"}

# 检查浏览器控制台
# F12 → Console → 不应该看到 API Key
```

---

## 🎯 常见问题

### Q: Cloudflare Worker 有免费计划吗？
A: 是的！Cloudflare 免费计划包含 10 万次/天的 Worker 请求。对于大多数个人项目足够了。

### Q: 如何测试 Worker 是否正确运行？
A: 使用 `curl` 命令或在浏览器开发工具中检查 Network 标签。

### Q: 是否需要付费购买 Cloudflare 高级计划？
A: 不需要。免费计划已经包含 Pages 和 Worker 功能。

### Q: 能否直接使用 Cloudflare 的 KV 存储 API Key？
A: 可以，但 Worker 环境变量更简单。

### Q: 如果忘记设置环境变量会怎样？
A: Worker 会返回 undefined，前端会加载失败。请检查 Cloudflare Dashboard 的环境变量设置。

---

## 📊 安全对比

```
┌──────────────────────────────────────────┐
│      API Key 安全性对比                   │
├───────────────┬─────┬──────┬──────────────┤
│ 方案          │ 安全│ 易用 │ 成本         │
├───────────────┼─────┼──────┼──────────────┤
│ GitHub Pages  │ ❌  │ ⭐⭐⭐ │ 免费         │
│ (当前方式)    │     │      │              │
├───────────────┼─────┼──────┼──────────────┤
│ Cloudflare    │ ✅  │ ⭐⭐⭐│ 免费+Worker  │
│ Worker (推荐) │     │      │              │
├───────────────┼──────┼──────┼──────────────┤
│ 自建代理      │ ✅  │ ⭐⭐ │ 需要服务器   │
│ (Nginx)       │     │      │              │
└───────────────┴─────┴──────┴──────────────┘
```

---

## ✨ 总结

**对于 Cloudflare Pages 部署：**

1. ✅ **强烈推荐**：使用 Worker 代理方案
   - 最安全（Key 不暴露）
   - 完全免费（Free 计划包含）
   - 性能最好（本地处理）
   - 易于维护

2. ⚠️ **不推荐**：直接在前端暴露 API Key
   - 安全风险很高
   - 容易被滥用
   - 可能产生意外费用

3. 🔄 **迁移步骤**：
   - 创建 `_worker.js` 处理 API 请求
   - 修改 `src/app.js` 从 Worker 加载配置
   - 在 Cloudflare 设置环境变量
   - 部署并测试

---

**关键点：永远不要在客户端代码中暴露 API 密钥！** 🔐

