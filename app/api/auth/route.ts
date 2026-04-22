import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { inputPassword } = await req.json();
    const realPassword = process.env.PRIVATE_ACCESS_PASSWORD;

    if (!realPassword) {
      return NextResponse.json(
        { success: false, message: '服务器未配置密码' },
        { 
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    if (inputPassword === realPassword) {
      return NextResponse.json(
        { success: true },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    } else {
      return NextResponse.json(
        { success: false, message: '密码错误' },
        { 
          status: 401,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}
