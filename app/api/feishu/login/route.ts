import { NextResponse } from 'next/server';

// 🔥 密码只存在这里，前端看不到
const ADMIN_USER = 'admin';
const ADMIN_PWD = '123456'; // 你可以改成复杂密码

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (username === ADMIN_USER && password === ADMIN_PWD) {
      return NextResponse.json({
        token: 'login-success-' + Date.now(),
      });
    } else {
      return NextResponse.json({ message: '错误' }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ message: '失败' }, { status: 500 });
  }
}