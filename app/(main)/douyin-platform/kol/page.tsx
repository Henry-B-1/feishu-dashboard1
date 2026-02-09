'use client'
import React, { useState } from 'react';
import { ArrowUp, ArrowDown, BarChart2, Users, MessageSquare, TrendingUp } from 'lucide-react';

// ========== 核心类型定义 ==========
type KolMatrixData = {
  level: string;
  levelDesc: string;
  voice: string | number;
  voiceRatio: string | number;
  voiceMoM: string | { value: number; trend: 'up' | 'down' };
  interact: string | number;
  interactRatio: string | number;
  interactMoM: string | { value: number; trend: 'up' | 'down' };
  perPostInteract: string | number;
  perPostMoM: string | { value: number; trend: 'up' | 'down' };
};

// ========== 4个产品的KOL矩阵数据（对应截图） ==========
// 1. 氮䓬斯汀氟替卡松
const AZELASTINE_DATA: KolMatrixData[] = [
  {
    level: '超头部',
    levelDesc: '(粉丝数≥500w)',
    voice: 1,
    voiceRatio: '2%',
    voiceMoM: { value: 6, trend: 'down' },
    interact: 48929,
    interactRatio: '12%',
    interactMoM: { value: 8, trend: 'down' },
    perPostInteract: 48929,
    perPostMoM: { value: 81, trend: 'up' },
  },
  {
    level: '头部',
    levelDesc: '(100w≤粉丝数<500w)',
    voice: 14,
    voiceRatio: '25%',
    voiceMoM: { value: 1, trend: 'down' },
    interact: 213610,
    interactRatio: '51%',
    interactMoM: { value: 10, trend: 'down' },
    perPostInteract: 15258,
    perPostMoM: { value: 36, trend: 'down' },
  },
  {
    level: '肩部',
    levelDesc: '(50w≤粉丝数<100w)',
    voice: 4,
    voiceRatio: '7%',
    voiceMoM: { value: 0, trend: 'down' },
    interact: 16397,
    interactRatio: '4%',
    interactMoM: { value: 4, trend: 'down' },
    perPostInteract: 4099,
    perPostMoM: { value: 60, trend: 'down' },
  },
  {
    level: '腰部',
    levelDesc: '(10w≤粉丝数<50w)',
    voice: 18,
    voiceRatio: '32%',
    voiceMoM: { value: 11, trend: 'down' },
    interact: 108679,
    interactRatio: '26%',
    interactMoM: { value: 18, trend: 'up' },
    perPostInteract: 6038,
    perPostMoM: { value: 229, trend: 'up' },
  },
  {
    level: '尾部',
    levelDesc: '(1w≤粉丝数<10w)',
    voice: 20,
    voiceRatio: '35%',
    voiceMoM: { value: 18, trend: 'up' },
    interact: 27222,
    interactRatio: '7%',
    interactMoM: { value: 3, trend: 'up' },
    perPostInteract: 1361,
    perPostMoM: { value: 28, trend: 'down' },
  },
];

// 2. 糠酸莫米松
const MOMETASONE_DATA: KolMatrixData[] = [
  {
    level: '超头部',
    levelDesc: '(粉丝数≥500w)',
    voice: '-',
    voiceRatio: '-',
    voiceMoM: '-',
    interact: '-',
    interactRatio: '-',
    interactMoM: '-',
    perPostInteract: '-',
    perPostMoM: '-',
  },
  {
    level: '头部',
    levelDesc: '(100w≤粉丝数<500w)',
    voice: 12,
    voiceRatio: '29%',
    voiceMoM: { value: 22, trend: 'up' },
    interact: 49792,
    interactRatio: '55%',
    interactMoM: { value: 21, trend: 'down' },
    perPostInteract: 4149,
    perPostMoM: { value: 85, trend: 'down' },
  },
  {
    level: '肩部',
    levelDesc: '(50w≤粉丝数<100w)',
    voice: 5,
    voiceRatio: '12%',
    voiceMoM: { value: 12, trend: 'up' },
    interact: 15967,
    interactRatio: '17%',
    interactMoM: { value: 17, trend: 'up' },
    perPostInteract: 3193,
    perPostMoM: '-',
  },
  {
    level: '腰部',
    levelDesc: '(10w≤粉丝数<50w)',
    voice: 7,
    voiceRatio: '17%',
    voiceMoM: { value: 21, trend: 'down' },
    interact: 15088,
    interactRatio: '17%',
    interactMoM: { value: 4, trend: 'down' },
    perPostInteract: 2155,
    perPostMoM: { value: 45, trend: 'up' },
  },
  {
    level: '尾部',
    levelDesc: '(1w≤粉丝数<10w)',
    voice: 17,
    voiceRatio: '41%',
    voiceMoM: { value: 12, trend: 'down' },
    interact: 10514,
    interactRatio: '12%',
    interactMoM: { value: 7, trend: 'up' },
    perPostInteract: 618,
    perPostMoM: { value: 158, trend: 'up' },
  },
];

// 3. 布地奈德
const BUDESONIDE_DATA: KolMatrixData[] = [
  {
    level: '超头部',
    levelDesc: '(粉丝数≥500w)',
    voice: '-',
    voiceRatio: '-',
    voiceMoM: '-',
    interact: '-',
    interactRatio: '-',
    interactMoM: '-',
    perPostInteract: '-',
    perPostMoM: '-',
  },
  {
    level: '头部',
    levelDesc: '(100w≤粉丝数<500w)',
    voice: '-',
    voiceRatio: '-',
    voiceMoM: '-',
    interact: '-',
    interactRatio: '-',
    interactMoM: '-',
    perPostInteract: '-',
    perPostMoM: '-',
  },
  {
    level: '肩部',
    levelDesc: '(50w≤粉丝数<100w)',
    voice: '-',
    voiceRatio: '-',
    voiceMoM: '-',
    interact: '-',
    interactRatio: '-',
    interactMoM: '-',
    perPostInteract: '-',
    perPostMoM: '-',
  },
  {
    level: '腰部',
    levelDesc: '(10w≤粉丝数<50w)',
    voice: 1,
    voiceRatio: '7%',
    voiceMoM: { value: 7, trend: 'up' },
    interact: 13,
    interactRatio: '1%',
    interactMoM: { value: 1, trend: 'up' },
    perPostInteract: 13,
    perPostMoM: '-',
  },
  {
    level: '尾部',
    levelDesc: '(1w≤粉丝数<10w)',
    voice: 13,
    voiceRatio: '93%',
    voiceMoM: { value: 7, trend: 'down' },
    interact: 2536,
    interactRatio: '99%',
    interactMoM: { value: 1, trend: 'down' },
    perPostInteract: 195,
    perPostMoM: { value: 87, trend: 'down' },
  },
];

// 4. 丙酸氟替卡松
const FLUTICASONE_DATA: KolMatrixData[] = [
  {
    level: '超头部',
    levelDesc: '(粉丝数≥500w)',
    voice: 2,
    voiceRatio: '15%',
    voiceMoM: { value: 15, trend: 'up' },
    interact: 18965,
    interactRatio: '94%',
    interactMoM: { value: 94, trend: 'up' },
    perPostInteract: 9483,
    perPostMoM: '-',
  },
  {
    level: '头部',
    levelDesc: '(100w≤粉丝数<500w)',
    voice: '-',
    voiceRatio: '-',
    voiceMoM: '-',
    interact: '-',
    interactRatio: '-',
    interactMoM: '-',
    perPostInteract: '-',
    perPostMoM: '-',
  },
  {
    level: '肩部',
    levelDesc: '(50w≤粉丝数<100w)',
    voice: '-',
    voiceRatio: '-',
    voiceMoM: '-',
    interact: '-',
    interactRatio: '-',
    interactMoM: '-',
    perPostInteract: '-',
    perPostMoM: '-',
  },
  {
    level: '腰部',
    levelDesc: '(10w≤粉丝数<50w)',
    voice: 1,
    voiceRatio: '8%',
    voiceMoM: { value: 15, trend: 'down' },
    interact: 42,
    interactRatio: '0%',
    interactMoM: { value: 90, trend: 'down' },
    perPostInteract: 42,
    perPostMoM: { value: 99, trend: 'down' },
  },
  {
    level: '尾部',
    levelDesc: '(1w≤粉丝数<10w)',
    voice: 10,
    voiceRatio: '77%',
    voiceMoM: { value: 1, trend: 'down' },
    interact: 1074,
    interactRatio: '5%',
    interactMoM: { value: 4, trend: 'down' },
    perPostInteract: 107,
    perPostMoM: { value: 57, trend: 'up' },
  },
];

// ========== 产品列表（用于标签切换） ==========
const PRODUCTS = [
  { id: 'azelastine', name: '氮䓬斯汀氟替卡松', data: AZELASTINE_DATA, color: 'bg-yellow-600' },
  { id: 'mometasone', name: '糠酸莫米松', data: MOMETASONE_DATA, color: 'bg-blue-600' },
  { id: 'budesonide', name: '布地奈德', data: BUDESONIDE_DATA, color: 'bg-green-600' },
  { id: 'fluticasone', name: '丙酸氟替卡松', data: FLUTICASONE_DATA, color: 'bg-indigo-600' },
];

// ========== 通用工具函数 ==========
// 格式化增减幅显示
const formatTrend = (item: string | { value: number; trend: 'up' | 'down' }) => {
  if (typeof item === 'string') return <span className="text-gray-400">{item}</span>;
  const { value, trend } = item;
  return (
    <span className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
      {trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(value)}%
    </span>
  );
};

// 格式化数字（千分位）
const formatNumber = (num: string | number) => {
  if (typeof num === 'string' || num === '-') return num;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// ========== KOL矩阵表格组件 ==========
const KolMatrixTable = ({ product }: { product: typeof PRODUCTS[0] }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* 标题栏（产品名+对应颜色） */}
      <div className={`py-3 px-4 flex items-center gap-2 font-bold text-lg text-white ${product.color}`}>
        <Users size={18} />
        {product.name}KOL矩阵
      </div>

      {/* 表格区域 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-left font-medium text-gray-700">达人量级</th>
              <th className="py-3 px-4 text-center font-medium text-gray-700">声量</th>
              <th className="py-3 px-4 text-center font-medium text-gray-700">声量占比</th>
              <th className="py-3 px-4 text-center font-medium text-gray-700">声量月度环比</th>
              <th className="py-3 px-4 text-center font-medium text-gray-700">互动量</th>
              <th className="py-3 px-4 text-center font-medium text-gray-700">互动量占比</th>
              <th className="py-3 px-4 text-center font-medium text-gray-700">互动量月度环比</th>
              <th className="py-3 px-4 text-center font-medium text-gray-700">单帖互动量</th>
              <th className="py-3 px-4 text-center font-medium text-gray-700">单帖互动量月度环比</th>
            </tr>
          </thead>
          <tbody>
            {product.data.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold">{item.level}</div>
                  <div className="text-xs text-gray-500">{item.levelDesc}</div>
                </td>
                <td className="py-3 px-4 text-center font-medium">{formatNumber(item.voice)}</td>
                <td className="py-3 px-4 text-center">{item.voiceRatio}</td>
                <td className="py-3 px-4 text-center">{formatTrend(item.voiceMoM)}</td>
                <td className="py-3 px-4 text-center font-medium">{formatNumber(item.interact)}</td>
                <td className="py-3 px-4 text-center">{item.interactRatio}</td>
                <td className="py-3 px-4 text-center">{formatTrend(item.interactMoM)}</td>
                <td className="py-3 px-4 text-center font-medium">{formatNumber(item.perPostInteract)}</td>
                <td className="py-3 px-4 text-center">{formatTrend(item.perPostMoM)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ========== 页面主函数 ==========
export default function DouyinKolPage() {
  // 标签切换状态
  const [activeProductId, setActiveProductId] = useState(PRODUCTS[0].id);
  const activeProduct = PRODUCTS.find(p => p.id === activeProductId)!;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-8 text-center">抖音KOL矩阵对比分析</h1>

      {/* 产品标签切换栏 */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap gap-2">
        {PRODUCTS.map(product => (
          <button
            key={product.id}
            onClick={() => setActiveProductId(product.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeProductId === product.id
                ? `${product.color} text-white`
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {product.name}
          </button>
        ))}
      </div>

      {/* 活跃产品的KOL矩阵表格 */}
      <div className="max-w-6xl mx-auto">
        <KolMatrixTable product={activeProduct} />
      </div>


    </div>
  );
}