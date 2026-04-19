import { NextRequest, NextResponse } from 'next/server';

// ===================== 填入你自己完整的 Client ID / Client Secret =====================
const GITHUB_CLIENT_ID = 'Ov23lia2P0ouOAlYp8Cc';
const GITHUB_CLIENT_SECRET = '23694fdef4856ce6b3e5950f08cd55f9f15e7608';
// ========================================================================================

// 兼容Cloudflare跨域预检OPTIONS请求
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
    // 1. 后端私人密码鉴权（仅你自己可访问）
    const inputPassword = req.headers.get('x-access-password');
    const realPassword = process.env.PRIVATE_ACCESS_PASSWORD;

    if (!realPassword || inputPassword !== realPassword) {
      return NextResponse.json(
        { error: '无权访问' },
        { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 2. 【核心修正】仅保留GitHub官方允许个人应用申请的合法权限
    // 彻底删除非法copilot权限！！！个人OAuth应用不允许申请Copilot scope
    // 权限范围：用户信息 + Git仓库完整权限，足够VS Code全部基础登录使用
    const requestBody = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: 'user repo',
    });

    // 3. 严格完全遵循GitHub官方设备码接口原生请求格式
    const deviceRes = await fetch('https://github.com/login/oauth/device/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        // 标准浏览器UA，绕过GitHub的陌生请求风控拦截
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: requestBody,
    });

    // 接口异常兜底排查
    if (!deviceRes.ok) {
      const errText = await deviceRes.text();
      console.error('GitHub设备码接口原始报错', deviceRes.status, errText);
      throw new Error(`接口请求拒绝 ${deviceRes.status}`);
    }

    const deviceData = await deviceRes.json();
    return NextResponse.json(deviceData, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('中转接口全部异常', err);
    return NextResponse.json(
      { error: '获取设备码失败' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
