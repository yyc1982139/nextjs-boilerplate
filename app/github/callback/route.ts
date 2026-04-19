import { NextRequest, NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = "Ov23lia2P0ouOAlYp8Cc";
const GITHUB_CLIENT_SECRET = "23694fdef4856ce6b3e5950f08cd55f9f15e7608";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({error: '无授权码'}, {status:400});

  // 后端代理换取Token
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({client_id:GITHUB_CLIENT_ID, client_secret:GITHUB_CLIENT_SECRET, code})
  });

  const data = await res.json();
  const token = data.access_token;
  // 携带Token返回前端页面
  return NextResponse.redirect(`https://www.justservo.com/success?token=${token}`);
}