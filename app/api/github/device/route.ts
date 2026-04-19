import { NextRequest, NextResponse } from 'next/server';

// ===================== 这里！！！必须替换成你自己的真实密钥 =====================
const GITHUB_CLIENT_ID = 'Ov23lia2P0ouOAlYp8Cc';
const GITHUB_CLIENT_SECRET = '23694fdef4856ce6b3e5950f08cd55f9f15e7608';
// ==============================================================================

// 兼容Cloudflare跨域预检请求
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-access-password',
    }
  });
}

export async function GET(req: NextRequest) {
  try {
    // 第一步：后端密码鉴权校验
    const inputPassword = req.headers.get('x-access-password');
    const realPassword = process.env.PRIVATE_ACCESS_PASSWORD;

    if (!realPassword || inputPassword !== realPassword) {
      return NextResponse.json(
        { error: '无权访问' },
        { 
          status: 401,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // 第二步：后端代理请求GitHub官方设备码接口（格式100%兼容GitHub官方要求）
    const deviceRes = await fetch('https://github.com/login/oauth/device/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        scope: 'user repo copilot',
      }),
    });

    // 打印状态码排查，处理GitHub返回的所有异常
    if (!deviceRes.ok) {
      const errText = await deviceRes.text();
      console.error('GitHub接口请求失败', deviceRes.status, errText);
      throw new Error(`GitHub接口返回错误 ${deviceRes.status}`);
    }

    const deviceData = await deviceRes.json();
    return NextResponse.json(deviceData, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('设备码接口全部错误', err);
    return NextResponse.json(
      { error: '获取设备码失败' },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}
