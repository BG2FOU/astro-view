/**
 * Cloudflare Pages Function - 处理观星地提交
 * 路径：/api/submit
 */

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const data = await request.json();

        // 验证必填字段
        if (!data.name || data.latitude === undefined || data.longitude === undefined) {
            return new Response(JSON.stringify({
                error: true,
                message: '缺少必填字段：name, latitude, longitude'
            }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // 构建 Issue
        const issueTitle = `📍 提交新观星地：${data.name}`;
        let issueBody = `## 观星地信息\n\n`;
        issueBody += `**地点名称**: ${data.name}\n`;
        issueBody += `**坐标**: ${data.latitude}°N, ${data.longitude}°E\n`;
        
        if (data.bortle && data.bortle !== '-') {
            issueBody += `**波特尔光害等级**: ${data.bortle}\n`;
        }
        if (data.standardLight && data.standardLight !== '-') {
            issueBody += `**中国暗夜环境等级**: ${data.standardLight}\n`;
        }
        if (data.sqm && data.sqm !== '-') {
            issueBody += `**SQM值**: ${data.sqm} mag/arcsec²\n`;
        }
        
        issueBody += `\n`;
        
        if (data.climate) {
            issueBody += `### 气候情况\n${data.climate}\n\n`;
        }
        if (data.accommodation) {
            issueBody += `### 住宿情况\n${data.accommodation}\n\n`;
        }
        if (data.notes) {
            issueBody += `### 备注\n${data.notes}\n\n`;
        }
        
        // 支持多张图片（同一字段，多行或分号分隔）
        const imageList = [];
        if (Array.isArray(data.images)) {
            data.images.forEach((img) => {
                if (img && String(img).trim()) imageList.push(String(img).trim());
            });
        }
        if (data.image) {
            String(data.image)
                .split(/[\n;]/)
                .map((url) => url.trim())
                .filter((url) => url.length > 0)
                .forEach((url) => imageList.push(url));
        }
        const uniqueImages = [...new Set(imageList)];
        if (uniqueImages.length > 0) {
            issueBody += `### 附图\n`;
            uniqueImages.forEach((imgUrl, index) => {
                issueBody += `![观星地图片${index + 1}](${imgUrl})\n`;
            });
            issueBody += `\n`;
        }
        
        issueBody += `---\n*此 Issue 由前端自动提交系统生成*\n`;

        // 调用 GitHub API
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
                labels: ['新地点提交']
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '创建 Issue 失败');
        }

        const result = await response.json();

        return new Response(JSON.stringify({
            error: false,
            message: '提交成功',
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
