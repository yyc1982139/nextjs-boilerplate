import { NextRequest, NextResponse } from 'next/server';

// 填入你刚刚申请的OAuth密钥
const GITHUB_CLIENT_ID = "Ov23lia2P0ouOAlYp8Cc";
const GITHUB_CLIENT_SECRET = "23694fdef4856ce6b3e5950f08cd55f9f15e7608";

// 第一步：代理请求GitHub，获取设备码
export async function GET() {
  try {
    // 后端代为请求GitHub官方设备码接口，本地不直连
    const deviceRes = await fetch('https://github.com/login/oauth/device/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        scope: 'user repo copilot', // 权限：用户信息+仓库代码+Copilot AI全部权限
      })
    });

    const deviceData = await deviceRes.json();
    return NextResponse.json(deviceData);
  } catch (err) {
    return NextResponse.json({ error: '获取设备码失败' }, { status: 500 });
  }
}

// 第二步：轮询校验设备授权，获取登录Token
export async function POST(req: NextRequest) {
  const { device_code } = await req.json();
  
  try {
    // 后端代理轮询GitHub授权状态
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        device_code: device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    });

    const tokenData = await tokenRes.json();
    return NextResponse.json(tokenData);
  } catch (err) {
    return NextResponse.json({ error: '授权校验失败' }, { status: 500 });
  }
}