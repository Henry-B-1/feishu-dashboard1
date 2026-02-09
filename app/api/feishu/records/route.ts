import { NextResponse } from 'next/server';
import axios from 'axios';

// 从环境变量读取配置（需先在 .env.local 中定义）
const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const TABLE_ID = process.env.FEISHU_TABLE_ID; // 数据表 ID
const BITABLE_APP_ID = process.env.FEISHU_BITABLE_APP_ID; // 多维表格的 App ID（关键修正）

// 获取飞书 app_access_token
async function getAppAccessToken() {
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    throw new Error('缺少飞书 App ID 或 App Secret');
  }

  try {
    const response = await axios.post(
      'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
      { app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET }
    );
    return response.data.app_access_token;
  } catch (error) {
    console.error('获取飞书 Token 失败:', error);
    throw new Error('获取飞书 Token 失败');
  }
}

// 从飞书多维表格获取数据
export async function GET() {
  // 校验配置完整性
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !TABLE_ID || !BITABLE_APP_ID) {
    return NextResponse.json(
      { error: '缺少必要的环境变量（FEISHU_APP_ID/SECRET/TABLE_ID/BITABLE_APP_ID）' },
      { status: 500 }
    );
  }

  try {
    const token = await getAppAccessToken();
    // 修正 API 路径：apps/后为多维表格的 App ID
    const response = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP_ID}/tables/${TABLE_ID}/records`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return NextResponse.json(response.data.data.items);
  } catch (error) {
    console.error('获取飞书表格数据失败:', error);
    return NextResponse.json({ error: '获取飞书表格数据失败' }, { status: 500 });
  }
}