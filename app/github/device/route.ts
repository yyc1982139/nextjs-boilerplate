import { NextRequest, NextResponse } from 'next/server';

const GITHUB_CLIENT_ID = 'Ov23lia2P0ouOAlYp8Cc';
const GITHUB_CLIENT_SECRET = '23694fdef4856ce6b3e5950f08cd55f9f15e7608';

export async function GET(req: NextRequest) {
  try {
    const inputPassword = req.headers.get('x-access-password');
    const realPassword = process.env.PRIVATE_ACCESS_PASSWORD;

    if (!realPassword || inputPassword !== realPassword) {
      return NextResponse.json(
        { error: '无权访问' },
        { status: 401 }
      );
    }

    const deviceRes = await fetch('https://github.com/login/oauth/device/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        scope: 'user repo copilot',
      }),
    });

    const deviceData = await deviceRes.json();
    return NextResponse.json(deviceData);
  } catch (err) {
    return NextResponse.json(
      { error: '获取设备码失败' },
      { status: 500 }
    );
  }
}
