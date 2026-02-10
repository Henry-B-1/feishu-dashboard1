'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  // 页面加载后立即跳转到登录页
  useEffect(() => {
    router.push('/summary');
  }, [router]);

  return null; // 无需渲染内容，直接跳转
}