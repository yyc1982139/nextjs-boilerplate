import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { inputPassword } = await req.json();
    const realPassword = process.env.PRIVATE_ACCESS_PASSWORD;

    if (!realPassword) {
      return NextResponse.json(
        { success: false, message: '服务器未配置密码' },
        { status: 500 }
      );
    }

    if (inputPassword === realPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false });
    }
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}