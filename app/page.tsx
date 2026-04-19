'use client';
import { useState } from 'react';

export default function Home() {
  const [inputPassword, setInputPassword] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);
  const [deviceCode, setDeviceCode] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState('');

  // 第一步：密码校验
  const checkPassword = async () => {
    setLoading(true);
    setTip('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputPassword })
      });

      if (!res.ok) throw new Error(`接口状态错误: ${res.status}`);
      const data = await res.json();
      
      if (data.success) {
        setAuthSuccess(true);
        setTip('✅ 密码验证成功');
      } else {
        setTip('❌ 密码错误，请重新输入');
      }
    } catch (err) {
      console.error('密码验证失败详情：', err);
      setTip(`⚠️ 接口请求异常: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // 第二步：【核心修正】前端改为 POST 请求，完美匹配后端接口
  const getGithubDeviceCode = async () => {
    if (!authSuccess) return;
    setLoading(true);
    try {
      const res = await fetch('/api/github/device', {
        method: 'POST', // 从GET改为POST！！！
        headers: {
          'x-access-password': inputPassword,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error(`设备码接口错误: ${res.status}`);
      const data = await res.json();
      
      setDeviceCode(data.device_code);
      setVerifyUrl(data.verification_uri);
      setTip('✅ 设备码获取成功');
    } catch (err) {
      console.error('获取设备码失败：', err);
      setTip(`⚠️ 获取设备码失败: ${(err as Error).message}`);
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

      {tip && <p className="text-sm text-amber-400">{tip}</p>}

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
