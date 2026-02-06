/**
 * Cloudflare Pages Function - 处理观星地修改建议
 * 路径：/api/update
 */

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const data = await request.json();
        const { original, updated, changes = [], id = '' } = data || {};
        
        // 从Cloudflare请求头获取真实客户端IP（最可靠的方式）
        const submitterIP = request.headers.get('CF-Connecting-IP') 
                        || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
                        || request.headers.get('X-Real-IP')
                        || 'unknown';
        console.log('📥 update.js 收到请求，从请求头获取 IP:', submitterIP);

        if (!original || !updated) {
            return new Response(JSON.stringify({
                error: true,
                message: '缺少必填字段：original, updated'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 基本字段检查
        if (!updated.name || updated.latitude === undefined || updated.longitude === undefined) {
            return new Response(JSON.stringify({
                error: true,
                message: '缺少必填字段：updated.name, updated.latitude, updated.longitude'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const titleName = original?.name || updated?.name || '未知观星地';
        const titleId = id || original?.id || updated?.id || '';
        const issueTitle = `✏️ 修改观星地：${titleName}${titleId ? ` (${titleId})` : ''}`;

        let issueBody = '';
        issueBody += `### 目标观星地\n`;
        issueBody += `- 名称: ${titleName}\n`;
        if (titleId) issueBody += `- ID: ${titleId}\n`;
        if (original?.latitude !== undefined && original?.longitude !== undefined) {
            issueBody += `- 坐标: ${original.latitude}°N, ${original.longitude}°E\n`;
        }
        issueBody += `\n`;

        issueBody += `### 修改项\n`;
        if (!Array.isArray(changes) || changes.length === 0) {
            issueBody += `无具体变更项（请审核上方“更新后的完整条目”）\n\n`;
        } else {
            for (const c of changes) {
                issueBody += `- ${c.field}: \`${c.before ?? '-'}\` → \`${c.after ?? '-'}\`\n`;
            }
            issueBody += `\n`;
        }

        issueBody += `### 更新后的完整条目（JSON）\n`;
        issueBody += '```json\n' + JSON.stringify(updated, null, 2) + '\n```\n\n';

        issueBody += `---\n*此 Issue 由前端自动提交系统生成*\n`;
        if (submitterIP && submitterIP !== 'unknown') {
            issueBody += `由 \`${submitterIP}\` 提交\n`;
            console.log('✓ 已将IP添加到Issue正文:', submitterIP);
        } else {
            console.warn('✗ IP未添加（submitterIP为空或unknown）:', submitterIP);
        }

        const response = await fetch('https://api.github.com/repos/BG2FOU/astro-view/issues', {
            method: 'POST',
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'astro-view-pages-function'
            },
            body: JSON.stringify({
                title: issueTitle,
                body: issueBody,
                labels: ['信息修改']
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: '创建 Issue 失败' }));
            throw new Error(error.message || '创建 Issue 失败');
        }

        const result = await response.json();

        return new Response(JSON.stringify({
            error: false,
            message: '修改提交成功',
            issueUrl: result.html_url,
            issueNumber: result.number
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: true,
            message: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 处理 CORS 预检请求
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
