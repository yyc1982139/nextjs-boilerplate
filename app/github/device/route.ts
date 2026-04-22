import { NextRequest, NextResponse } from 'next/server';

// 跨域OPTIONS预检请求兼容
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'x-access-password, Content-Type',
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. 密码鉴权
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

    // 2. 从环境变量获取GitHub密钥
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
    
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'GitHub应用配置缺失' },
        { 
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // 3. 简化请求头 - 移除伪造的浏览器头部
    const githubRequestHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'GitHub-Device-Flow-Proxy/1.0' // 使用合理的User-Agent
    };

    // 4. 构造请求体 - 使用正确的scope格式
    // GitHub Device Flow 通常不需要scope参数，或者使用标准scope
    const requestBody = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      // scope: 'read:user repo' // 可选：如果需要特定权限
    });

    // 5. 发起请求到GitHub设备码接口
    const deviceRes = await fetch('https://github.com/login/oauth/device/code', {
      method: 'POST',
      headers: githubRequestHeaders,
      body: requestBody
    });

    // 6. 处理响应
    if (!deviceRes.ok) {
      const errText = await deviceRes.text();
      console.error('【GitHub接口原始报错】状态码:', deviceRes.status, '返回内容:', errText);
      
      // 尝试解析错误信息
      let errorMessage = `GitHub接口拒绝请求 ${deviceRes.status}`;
      try {
        const errorJson = JSON.parse(errText);
        if (errorJson.error_description) {
          errorMessage = errorJson.error_description;
        }
      } catch (e) {
        // 如果不是JSON，保持原错误文本
      }
      
      return NextResponse.json(
        { error: errorMessage, status: deviceRes.status },
        { 
          status: deviceRes.status,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    const deviceData = await deviceRes.json();
    
    // 7. 返回设备码数据
    return NextResponse.json(deviceData, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error('中转接口全部异常', err);
    return NextResponse.json(
      { error: '获取设备码失败', details: err instanceof Error ? err.message : '未知错误' },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}
