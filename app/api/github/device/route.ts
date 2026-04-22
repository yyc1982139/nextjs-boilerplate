import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // 1. 密码鉴权 (保持原有逻辑)
    const inputPassword = req.headers.get('x-access-password');
    const realPassword = process.env.PRIVATE_ACCESS_PASSWORD;

    if (!realPassword || inputPassword !== realPassword) {
      return NextResponse.json(
        { error: '无权访问' },
        { status: 401 }
      );
    }

    // 2. 获取环境变量
    const clientId = process.env.GITHUB_CLIENT_ID;
    
    if (!clientId) {
      return NextResponse.json(
        { error: '服务器配置缺失: GITHUB_CLIENT_ID' },
        { status: 500 }
      );
    }

    // 3. 【关键修复】构造极简且诚实的请求头
    // 严禁添加 Referer, Origin, Sec-Fetch-* 等浏览器特有头部
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      // User-Agent 建议设置为明确的应用标识，不要模拟 Chrome/Firefox
      'User-Agent': 'VSCode-Device-Flow-Proxy/1.0' 
    };

    // 4. 构造请求体
    // Device Flow 的 /device/code 接口只需要 client_id
    const bodyParams = new URLSearchParams({
      client_id: clientId,
      // scope: 'repo user', // 可选：如果需要特定权限
    });

    // 5. 发起请求到 GitHub
    const response = await fetch('https://github.com/login/oauth/device/code', {
      method: 'POST',
      headers: headers,
      body: bodyParams.toString(),
      // 注意：服务端 fetch 不需要设置 mode: 'cors'
    });

    // 6. 处理响应
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMsg = `GitHub API Error: ${response.status}`;
      
      // 尝试解析错误信息
      if (contentType && contentType.includes('application/json')) {
        const errorJson = await response.json();
        errorMsg = errorJson.error_description || JSON.stringify(errorJson);
      } else {
        // 如果返回 HTML (如你遇到的 "browser did something unexpected")
        // 说明被风控拦截，通常是 IP 或请求头问题
        const text = await response.text();
        console.error('【GitHub 风控拦截】返回了 HTML 页面:', text.substring(0, 200));
        errorMsg = 'GitHub 安全拦截 (422/HTML)。可能是服务器 IP 被限制或请求头不规范。';
      }

      return NextResponse.json(
        { error: errorMsg, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 7. 返回成功数据给前端
    return NextResponse.json(data);

  } catch (error) {
    console.error('【服务器内部错误】', error);
    return NextResponse.json(
      { error: '服务器内部处理异常' },
      { status: 500 }
    );
  }
}
