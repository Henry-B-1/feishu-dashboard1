import { NextResponse } from 'next/server';
import axios from 'axios';

// ========== 类型定义 ==========
// 飞书获取token响应类型
interface FeishuTokenResponse {
  code: number;
  msg: string;
  app_access_token: string;
  expire: number;
}

// 飞书多维表格记录响应类型
interface BitableRecordsResponse {
  code: number;
  msg: string;
  data: {
    items: Record<string, any>[];
    has_more: boolean;
    next_page_token: string;
    total: number;
  };
}

// ========== 环境变量 ==========
const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const BITABLE_APP_ID = process.env.FEISHU_XHSBrand_BITABLE_APP_ID;
const TABLE_ID = process.env.FEISHU_XHSBrand_TABLE_ID;

// 获取飞书 Token（通用逻辑，可抽离到 utils 避免重复）
async function getAppAccessToken(): Promise<string> {
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    throw new Error('缺少飞书 App ID 或 App Secret');
  }
  try {
    const response = await axios.post<FeishuTokenResponse>(
      'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
      { app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET }
    );
    return response.data.app_access_token;
  } catch (error) {
    console.error('获取飞书 Token 失败:', error);
    throw new Error('获取飞书 Token 失败');
  }
}

// 🔥 核心修复：为 token 参数添加 string 类型标注
// 分页获取 XHS 数据表的所有数据（可选，若数据量>100条则加）
async function getAllTableRecords(token: string): Promise<Record<string, any>[]> {
  const allItems: Record<string, any>[] = []; // 明确数组类型
  let pageToken = '';
  const pageSize = 500;

  while (true) {
    try {
      const response = await axios.get<BitableRecordsResponse>(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP_ID}/tables/${TABLE_ID}/records`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page_size: pageSize, page_token: pageToken }
        }
      );

      const { items, has_more, next_page_token } = response.data.data;
      allItems.push(...items);

      if (!has_more) break;
      pageToken = next_page_token;
    } catch (error) {
      console.error('分页获取 XHS 数据失败:', error);
      throw new Error('分页获取 XHS 数据失败');
    }
  }

  return allItems;
}

// 核心接口逻辑
export async function GET() {
  // 校验当前接口的配置是否齐全
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !TABLE_ID || !BITABLE_APP_ID) {
    return NextResponse.json(
      { error: '缺少 XHS 数据表的环境变量配置' },
      { status: 500 }
    );
  }

  try {
    const token = await getAppAccessToken();
    const allItems = await getAllTableRecords(token); // 分页获取所有数据
    return NextResponse.json(allItems);
  } catch (error) {
    console.error('获取 XHS 表格数据失败:', error);
    return NextResponse.json({ error: '获取 XHS 表格数据失败' }, { status: 500 });
  }
}