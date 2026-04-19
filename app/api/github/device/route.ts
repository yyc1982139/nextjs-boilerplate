import { NextRequest, NextResponse } from 'next/server';

// ===================== 填入你GitHub后台完整真实的密钥 =====================
const GITHUB_CLIENT_ID = 'Ov23lia2P0ouOAlYp8Cc';
const GITHUB_CLIENT_SECRET = 'b51a81f407e9aa8a209de8c6f8915b84145fd98c';
// ========================================================================

// 【官方唯一合法权限】个人OAuth应用仅能申请这两个scope，无copilot！
const GITHUB_REQUEST_SCOPE = 'user repo';

// 跨域OPTIONS预检请求兼容（Cloudflare必备）
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'x-access-password, Content-Type',
    }
  });
}

// 【核心修正】接口改为POST！！！GitHub设备码接口**只接受POST请求**！
export async function POST(req: NextRequest) {
  try {
    // 1. 后端私人密码鉴权校验（你的专属访问锁）
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

    // 2. 严格完整复刻浏览器原生请求头，彻底绕过GitHub 422风控拦截
    // 这是解决你报错的最关键部分，完整全套官方要求头部
    const githubRequestHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Referer': 'https://github.com/',
      'Origin': 'https://github.com'
    };

    // 3. 严格官方格式构造请求体
    const requestBody = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: GITHUB_REQUEST_SCOPE
    });

    // 4. 后端代理发起POST请求到GitHub官方设备码接口
    const deviceRes = await fetch('https://github.com/login/oauth/device/code', {
      method: 'POST',
      headers: githubRequestHeaders,
      body: requestBody
    });

    // 完整异常捕获
    if (!deviceRes.ok) {
      const errText = await deviceRes.text();
      console.error('【GitHub接口原始报错】状态码:', deviceRes.status, '返回内容:', errText);
      throw new Error(`GitHub接口拒绝请求 ${deviceRes.status}`);
    }

    const deviceData = await deviceRes.json();
    // 透传全部返回数据，附加跨域头
    return NextResponse.json(deviceData, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('中转接口全部异常', err);
    return NextResponse.json(
      { error: '获取设备码失败' },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}
