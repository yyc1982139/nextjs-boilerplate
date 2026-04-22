'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [inputPassword, setInputPassword] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);
  const [deviceCode, setDeviceCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState('');
  const [copied, setCopied] = useState(false);

  // 检查 URL 中是否有 token（GitHub 回调）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setTip(`✅ GitHub 授权成功！Token 已返回`);
      // 可以在这里处理 token，比如存储到 localStorage
      localStorage.setItem('github_token', token);
    }
  }, []);

  // 第一步：密码校验
  const checkPassword = async () => {
    if (!inputPassword.trim()) {
      setTip('❌ 请输入密码');
      return;
    }
    
    setLoading(true);
    setTip('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputPassword })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || `验证失败 (${res.status})`);
      }
      
      if (data.success) {
        setAuthSuccess(true);
        setTip('✅ 密码验证成功，现在可以获取设备码');
        // 存储密码到 sessionStorage，避免重复输入
        sessionStorage.setItem('access_password', inputPassword);
      } else {
        setTip('❌ 密码错误，请重新输入');
      }
    } catch (err) {
      console.error('密码验证失败详情：', err);
      setTip(`⚠️ 验证失败: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // 第二步：获取 GitHub 设备码
  const getGithubDeviceCode = async () => {
    if (!authSuccess) {
      setTip('❌ 请先完成密码验证');
      return;
    }
    
    setLoading(true);
    setTip('');
    try {
      // 从 sessionStorage 获取密码
      const storedPassword = sessionStorage.getItem('access_password') || inputPassword;
      
      const res = await fetch('/api/github/device', {
        method: 'POST',
        headers: {
          'x-access-password': storedPassword,
          // 注意：后端期望的是 x-www-form-urlencoded，但这里是 GET 请求体
          // 所以不需要 Content-Type
        }
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `获取失败 (${res.status})`);
      }
      
      // 验证返回的数据结构
      if (!data.device_code || !data.user_code || !data.verification_uri) {
        throw new Error('返回的设备码数据格式不正确');
      }
      
      setDeviceCode(data.device_code);
      setUserCode(data.user_code);
      setVerifyUrl(data.verification_uri);
      setTip('✅ 设备码获取成功！请复制用户码到 GitHub 授权');
    } catch (err) {
      console.error('获取设备码失败：', err);
      setTip(`⚠️ 获取设备码失败: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // 复制用户码到剪贴板
  const copyUserCode = () => {
    if (!userCode) return;
    navigator.clipboard.writeText(userCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('复制失败:', err);
        setTip('❌ 复制失败，请手动复制');
      });
  };

  // 打开授权页面
  const openVerificationPage = () => {
    if (verifyUrl && userCode) {
      window.open(`${verifyUrl}?user_code=${userCode}`, '_blank');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">GitHub 授权中转服务</h1>
        <p className="text-gray-400">解决国内网络环境下 VS Code 登录 GitHub 问题</p>
      </div>
      
      {/* 密码验证区域 */}
      <div className="w-full max-w-md bg-gray-800/50 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">第一步：验证访问权限</h2>
        
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">访问密码</label>
            <input
              type="password"
              placeholder="请输入访问密码"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-500 focus:outline-none"
              disabled={authSuccess}
            />
          </div>
          
          <button 
            onClick={checkPassword}
            disabled={loading || authSuccess}
            className={`w-full p-3 rounded-lg font-medium transition-colors ${
              authSuccess 
                ? 'bg-green-600 cursor-default' 
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700'
            }`}
          >
            {loading ? '验证中...' : authSuccess ? '✓ 已验证' : '验证密码'}
          </button>
        </div>
      </div>

      {/* 提示信息 */}
      {tip && (
        <div className={`w-full max-w-md p-4 rounded-lg ${
          tip.includes('✅') ? 'bg-green-900/30 border border-green-700' :
          tip.includes('❌') ? 'bg-red-900/30 border border-red-700' :
          'bg-yellow-900/30 border border-yellow-700'
        }`}>
          <p className="text-sm">{tip}</p>
        </div>
      )}

      {/* 设备码获取区域 */}
      {authSuccess && (
        <div className="w-full max-w-md bg-gray-800/50 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">第二步：获取 GitHub 设备码</h2>
          
          <button 
            onClick={getGithubDeviceCode}
            disabled={loading || !!(deviceCode && userCode)}
            className={`w-full p-3 rounded-lg font-medium mb-6 transition-colors ${
              deviceCode && userCode
                ? 'bg-green-600 cursor-default'
                : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-700'
            }`}
          >
            {loading ? '获取中...' : 
             deviceCode && userCode ? '✓ 已获取设备码' : '获取 VS Code 设备码'}
          </button>

          {/* 设备码显示区域 */}
          {userCode && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">用户码 (User Code)</span>
                  <button
                    onClick={copyUserCode}
                    className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
                  >
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <p className="text-2xl font-mono font-bold text-center tracking-wider">
                  {userCode}
                </p>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  复制此代码，在 GitHub 授权页面输入
                </p>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">设备码 (Device Code)</p>
                <p className="font-mono text-sm break-all">{deviceCode}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={openVerificationPage}
                  className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  打开 GitHub 授权页面
                </button>
                <a
                  href={verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-center"
                >
                  手动打开链接
                </a>
              </div>

              <div className="text-sm text-gray-400 mt-4">
                <p className="font-medium mb-1">使用说明：</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>点击"打开 GitHub 授权页面"或手动访问上方链接</li>
                  <li>在 GitHub 页面输入用户码 <code className="bg-gray-800 px-1 rounded">{userCode}</code></li>
                  <li>授权后返回此页面，VS Code 将自动完成登录</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 页脚信息 */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>GitHub Device Flow 中转服务 • 仅限个人使用</p>
        <p className="mt-1">确保您的 GitHub OAuth App 已正确配置回调地址</p>
      </footer>
    </main>
  );
}
