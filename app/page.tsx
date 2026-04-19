'use client';
import { useState } from 'react';

export default function Home() {
  const [password, setPassword] = useState('');
  // 你自己设置唯一访问密码，外人无法进入中转功能
  const MY_PRIVATE_PASSWORD = 'justservo';
  const [authOk, setAuthOk] = useState(false);
  const [deviceCode, setDeviceCode] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');

  // 从你的中转后端获取GitHub设备码
  const getDeviceCode = async () => {
    if (password !== MY_PRIVATE_PASSWORD) {
      alert('密码错误，无权访问');
      return;
    }
    const res = await fetch('/api/github/device');
    const data = await res.json();
    setDeviceCode(data.device_code);
    setVerifyUrl(data.verification_uri);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-10 bg-black text-white">
      <h1 className="text-2xl font-bold">JustServo 个人GitHub中转授权</h1>
      
      <div className="w-full max-w-md flex flex-col gap-4">
        <input
          type="password"
          placeholder="请输入专属访问密码"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="p-3 rounded bg-white/10 border border-white/20"
        />
        <button 
          onClick={getDeviceCode}
          className="p-3 rounded bg-blue-600 hover:bg-blue-700"
        >
          获取VS Code登录设备码
        </button>
      </div>

      {deviceCode && (
        <div className="bg-white/10 p-5 rounded w-full max-w-md">
          <p>请复制设备码：<b className="text-xl">{deviceCode}</b></p>
          <p>授权地址：{verifyUrl}</p>
          <p className="text-sm mt-2">打开上方地址，粘贴设备码完成GitHub账号授权</p>
        </div>
      )}
    </main>
  );
}
