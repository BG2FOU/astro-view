/**
 * Cloudflare Pages Function - 获取客户端IP地址
 * 路径：/api/getip
 * 用于前端获取用户真实IP（无CORS问题）
 */

export async function onRequestGet(context) {
    const { request } = context;

    try {
        // 从Cloudflare请求头获取真实客户端IP
        const ip = request.headers.get('CF-Connecting-IP') 
                || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
                || request.headers.get('X-Real-IP')
                || 'unknown';

        console.log('📍 getip.js 返回 IP:', ip);

        return new Response(JSON.stringify({
            ip: ip,
            source: 'CF-Connecting-IP'
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            ip: 'unknown',
            error: error.message
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 支持OPTIONS预检请求（CORS）
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }
    });
}
