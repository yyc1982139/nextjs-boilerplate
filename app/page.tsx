'use client';
import { useState } from 'react';

export default function Home() {
  const [inputPassword, setInputPassword] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);
  const [deviceCode, setDeviceCode] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState('');

  const checkPassword = async () => {
    setLoading(true);
    setTip('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputPassword })
      });

      const data = await res.json();
      if (data.success) {
        setAuthSuccess(true);
        setTip('✅ 密码验证成功');
      } else {
        setTip('❌ 密码错误');
      }
    } catch (err) {
      setTip('⚠️ 网络错误');
    } finally {
      setLoading(false);
    }
  };

  const getGithubDeviceCode = async () => {
    if (!authSuccess) return;
    setLoading(true);
    try {
      const res = await fetch('/api/github/device', {
        headers: {
          'x-access-password': inputPassword
        }
      });

      const data = await res.json();
      if (res.ok) {
        setDeviceCode(data.device_code);
        setVerifyUrl(data.verification_uri);
      } else {
        setTip('⚠️ 获取设备码失败');
      }
    } catch (err) {
      setTip('⚠️ 请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-10 bg-black text-white">
      <h1 className="text-2xl font-bold">JustServo GitHub 授权中转</h1>
      
      <div className="w-full max-w-md flex flex-col gap-4">
        <input
          type="password"
          placeholder="输入访问密码"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
          className="p-3 rounded bg-white/10 border border-white/20"
        />
        <button 
          onClick={checkPassword}
          disabled={loading}
          className="p-3 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
        >
          {loading ? '验证中...' : '验证密码'}
        </button>
      </div>

      {tip && <p className="text-sm">{tip}</p>}

      {authSuccess && (
        <div className="w-full max-w-md">
          <button 
            onClick={getGithubDeviceCode}
            disabled={loading}
            className="w-full p-3 rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
          >
            {loading ? '获取中...' : '获取 VS Code 设备码'}
          </button>

          {deviceCode && (
            <div className="mt-4 p-5 rounded bg-white/10">
              <p>设备码：<b className="text-xl">{deviceCode}</b></p>
              <p className="mt-1">授权地址：{verifyUrl}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
