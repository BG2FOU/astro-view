/**
 * Cloudflare Worker - 观星地提交处理器
 * 
 * 此脚本运行在 Cloudflare Worker 上，用于：
 * 1. 接收前端提交的观星地数据
 * 2. 验证数据格式
 * 3. 调用 GitHub API 创建 Issue
 * 4. 返回结果给前端
 * 
 * 环境变量配置：
 * - GITHUB_TOKEN: GitHub Personal Access Token
 * - GITHUB_REPO: 仓库名称（格式：owner/repo）
 */

async function handleSubmit(request, env) {
    // 验证请求方法
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ 
            error: true, 
            message: '只支持 POST 请求' 
        }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 解析请求数据
        const data = await request.json();

        // 验证必填字段
        if (!data.name || data.latitude === undefined || data.longitude === undefined) {
            return new Response(JSON.stringify({
                error: true,
                message: '缺少必填字段：name, latitude, longitude'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 验证坐标范围
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        
        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return new Response(JSON.stringify({
                error: true,
                message: '坐标格式不正确'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 构建 GitHub Issue 内容
        const issueTitle = `📍 提交新观星地：${data.name}`;
        const issueBody = buildIssueBody(data);

        // 调用 GitHub API 创建 Issue
        const githubResponse = await createGitHubIssue(issueTitle, issueBody, env);

        if (!githubResponse.ok) {
            const errorData = await githubResponse.json();
            console.error('GitHub API 错误:', errorData);
            
            return new Response(JSON.stringify({
                error: true,
                message: `GitHub API 错误：${errorData.message || '未知错误'}`
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const issueData = await githubResponse.json();

        return new Response(JSON.stringify({
            error: false,
            message: '提交成功',
            issueUrl: issueData.html_url,
            issueNumber: issueData.number
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('处理请求失败:', error);

        return new Response(JSON.stringify({
            error: true,
            message: `服务器错误：${error.message}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 处理观星地修改（Worker 端）
 */
async function handleUpdate(request, env) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: true, message: '只支持 POST 请求' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }
    try {
        const payload = await request.json();
        const { original, updated, changes = [], id = '' } = payload || {};
        if (!original || !updated) {
            return new Response(JSON.stringify({ error: true, message: '缺少必填字段：original, updated' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        if (updated.latitude === undefined || updated.longitude === undefined || !updated.name) {
            return new Response(JSON.stringify({ error: true, message: '缺少必填字段：updated.name, updated.latitude, updated.longitude' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const titleName = original?.name || updated?.name || '未知观星地';
        const titleId = id || original?.id || updated?.id || '';
        const issueTitle = `✏️ 修改观星地：${titleName}${titleId ? ` (${titleId})` : ''}`;

        const issueBody = buildUpdateIssueBody(changes, original, updated);

        const repoPath = env.GITHUB_REPO || 'BG2FOU/astro-view';
        const apiUrl = `https://api.github.com/repos/${repoPath}/issues`;
        const resp = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'astro-view-worker'
            },
            body: JSON.stringify({ title: issueTitle, body: issueBody, labels: ['信息修改'] })
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ message: '创建 Issue 失败' }));
            throw new Error(err.message || '创建 Issue 失败');
        }

        const result = await resp.json();
        return new Response(JSON.stringify({ error: false, message: '修改提交成功', issueUrl: result.html_url, issueNumber: result.number }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: true, message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

/**
 * 构建 GitHub Issue 内容
 */
function buildIssueBody(data) {
    let body = `## 观星地信息\n\n`;
    
    body += `**地点名称**: ${escapeMarkdown(data.name)}\n`;
    body += `**坐标**: ${data.latitude}°N, ${data.longitude}°E\n`;
    
    if (data.bortle && data.bortle !== '-') {
        body += `**波特尔光害等级**: ${data.bortle}\n`;
    }
    
    if (data.standardLight && data.standardLight !== '-') {
        body += `**中国暗夜环境等级**: ${data.standardLight}\n`;
    }
    
    if (data.sqm && data.sqm !== '-') {
        body += `**SQM值**: ${data.sqm} mag/arcsec²\n`;
    }
    
    body += `\n`;
    
    if (data.climate) {
        body += `### 气候情况\n${escapeMarkdown(data.climate)}\n\n`;
    }
    
    if (data.accommodation) {
        body += `### 住宿情况\n${escapeMarkdown(data.accommodation)}\n\n`;
    }
    
    if (data.notes) {
        body += `### 备注\n${escapeMarkdown(data.notes)}\n\n`;
    }
    
    if (data.image) {
        body += `### 附图\n![观星地图片](${data.image})\n\n`;
    }
    
    body += `---\n`;
    body += `*此 Issue 由自动提交系统生成于 ${new Date().toISOString()}*\n`;
    
    return body;
}

/**
 * 构建“修改观星地”Issue 内容
 */
function buildUpdateIssueBody(changes, original, updated) {
    let body = '';
    body += `### 目标观星地\n`;
    body += `- 名称: ${escapeMarkdown(original?.name || updated?.name || '')}\n`;
    if (original?.id || updated?.id) body += `- ID: ${escapeMarkdown(original?.id || updated?.id)}\n`;
    if (original?.latitude !== undefined && original?.longitude !== undefined) {
        body += `- 坐标: ${original.latitude}°N, ${original.longitude}°E\n`;
    }
    body += `\n`;

    body += `### 修改项\n`;
    if (Array.isArray(changes) && changes.length) {
        for (const c of changes) {
            body += `- ${c.field}: \`${String(c.before ?? '-') }\` → \`${String(c.after ?? '-') }\`\n`;
        }
    } else {
        body += `无具体变更项（请审核下方“更新后的完整条目”）\n`;
    }
    body += `\n`;

    body += `### 更新后的完整条目（JSON）\n`;
    body += '```json\n' + JSON.stringify(updated || {}, null, 2) + '\n```\n\n';
    body += `---\n*此 Issue 由前端自动提交系统生成*\n`;
    return body;
}

/**
 * 调用 GitHub API 创建 Issue
 */
async function createGitHubIssue(title, body, env) {
    const gitHubToken = env.GITHUB_TOKEN || '';
    const repoPath = env.GITHUB_REPO || 'BG2FOU/astro-view';
    const apiUrl = `https://api.github.com/repos/${repoPath}/issues`;

    if (!gitHubToken) {
        throw new Error('GITHUB_TOKEN 未配置');
    }

    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `token ${gitHubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'astro-view-worker'
        },
        body: JSON.stringify({
            title: title,
            body: body,
            labels: ['新地点提交']
        })
    });
}

/**
 * 转义 Markdown 特殊字符
 */
function escapeMarkdown(text) {
    if (!text) return '';
    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/\*/g, '\\*')
        .replace(/_/g, '\\_')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/#/g, '\\#')
        .replace(/\+/g, '\\+')
        .replace(/-/g, '\\-')
        .replace(/\./g, '\\.')
        .replace(/!/g, '\\!');
}

/**
 * 主处理函数
 */
export default {
    async fetch(request, env, ctx) {
        // 处理 CORS 预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // 路由处理
        const url = new URL(request.url);
        if (url.pathname === '/api/submit') {
            const response = await handleSubmit(request, env);
            
            // 添加 CORS 头
            response.headers.set('Access-Control-Allow-Origin', '*');
            response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
            
            return response;
        }

        if (url.pathname === '/api/update') {
            const response = await handleUpdate(request, env);
            response.headers.set('Access-Control-Allow-Origin', '*');
            response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
            return response;
        }

        return new Response('Not Found', { status: 404 });
    }
};
