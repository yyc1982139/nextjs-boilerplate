import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    if (!code) {
      return NextResponse.json(
        { error: '无授权码' },
        { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // 从环境变量获取密钥
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
    
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return NextResponse.json(
        { error: '服务器配置错误' },
        { 
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // 正确的请求格式：application/x-www-form-urlencoded
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code
    });

    // 后端代理换取Token
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('GitHub Token 接口错误:', res.status, errorText);
      return NextResponse.json(
        { error: `GitHub接口错误: ${res.status}` },
        { 
          status: res.status,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    const data = await res.json();
    const token = data.access_token;
    
    if (!token) {
      return NextResponse.json(
        { error: '获取Token失败', data },
        { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // 携带Token返回前端页面
    return NextResponse.redirect(`https://www.justservo.com/success?token=${token}`);
    
  } catch (error) {
    console.error('回调接口异常:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}
