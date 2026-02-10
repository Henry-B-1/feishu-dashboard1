// app/login/page.tsx
'use client'; // 启用客户端交互
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import type { FormEvent, CSSProperties } from 'react'; // 导入CSS样式类型

// 定义表单数据类型
interface LoginFormData {
  username: string;
  password: string;
}

export default function Login() {
  const router = useRouter();

  // 表单状态（指定类型）
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 输入变化处理（指定事件类型）
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // 修复核心：为 e 声明 FormEvent 类型
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // 表单验证
    if (!formData.username || !formData.password) {
      setError('用户名和密码不能为空！');
      setLoading(false);
      return;
    }

    try {
      // 调用后端登录接口
      const res = await fetch('/api/feishu/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '登录失败');
      }

      // 登录成功：存储 Token 并跳转到 summary 页面
      localStorage.setItem('userToken', data.token);
      router.push('/summary');
    } catch (err) {
      // 补全错误类型判断
      setError(err instanceof Error ? err.message : '登录出错，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 所有样式声明为 CSSProperties 类型（核心修复）
  const pageContainer: CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: '20px',
  };

  const loginCard: CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  const title: CSSProperties = {
    textAlign: 'center', // TS 能识别为合法的 TextAlign 类型
    marginBottom: '24px',
    color: '#1e293b',
    fontSize: '24px',
    fontWeight: 600,
  };

  const errorMsg: CSSProperties = {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
  };

  const form: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const formGroup: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const label: CSSProperties = {
    fontSize: '14px',
    color: '#475569',
    fontWeight: 500,
  };

  const input: CSSProperties = {
    padding: '12px 16px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const submitBtn: CSSProperties = {
    padding: '12px',
    borderRadius: '4px',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '8px',
  };

  return (
    <>
      <Head>
        <title>登录 | 飞书看板</title>
        <meta name="description" content="飞书看板系统登录页面" />
      </Head>
      <div style={pageContainer}>
        <div style={loginCard}>
          <h1 style={title}>飞书看板登录</h1>

          {/* 错误提示 */}
          {error && <div style={errorMsg}>{error}</div>}

          {/* 登录表单 */}
          <form onSubmit={handleLogin} style={form}>
            <div style={formGroup}>
              <label style={label}>用户名</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                style={input}
                placeholder="请输入用户名"
                disabled={loading}
              />
            </div>

            <div style={formGroup}>
              <label style={label}>密码</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={input}
                placeholder="请输入密码"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              style={{
                ...submitBtn,
                backgroundColor: loading ? '#94a3b8' : '#3b82f6'
              }}
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}