'use client'
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react'; // 用图标替代纯文字箭头（更美观）

// KOL矩阵数据（把你的数据传进来）
type KolMatrixData = {
  level: string; // 达人量级
  levelDesc: string; // 粉丝数描述
  voice: string | number; // 声量
  voiceRatio: string | number; // 声量占比
  voiceMoM: string | { value: number; trend: 'up' | 'down' }; // 声量月度环比（带趋势）
  interact: string | number; // 互动量
  interactRatio: string | number; // 互动量占比
  interactMoM: string | { value: number; trend: 'up' | 'down' }; // 互动量月度环比
  perPostInteract: string | number; // 单帖互动量
  perPostMoM: string | { value: number; trend: 'up' | 'down' }; // 单帖互动量环比
};

// 抖音风格KOL矩阵组件
export const DouyinKolMatrix = ({ dataList }: { dataList: KolMatrixData[] }) => {
  // 格式化增减幅显示（带图标+颜色）
  const formatTrend = (item: string | { value: number; trend: 'up' | 'down' }) => {
    if (typeof item === 'string') return item;
    const { value, trend } = item;
    return (
      <span className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
        {trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        {Math.abs(value)}%
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* 抖音风格标题栏（黑底白字+绿色边框，贴合抖音UI） */}
      <div className="bg-black text-white py-3 px-4 text-center font-bold text-lg border-t-4 border-green-500">
        糠酸莫米松KOL矩阵
      </div>

      {/* 表格区域（抖音风格：细边框+ hover高亮） */}
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
            {dataList.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {/* 达人量级（加粗区分层级） */}
                <td className="py-3 px-4">
                  <div className="font-semibold">{item.level}</div>
                  <div className="text-xs text-gray-500">{item.levelDesc}</div>
                </td>
                {/* 声量 */}
                <td className="py-3 px-4 text-center">{item.voice}</td>
                {/* 声量占比 */}
                <td className="py-3 px-4 text-center">{item.voiceRatio}</td>
                {/* 声量月度环比 */}
                <td className="py-3 px-4 text-center">{formatTrend(item.voiceMoM)}</td>
                {/* 互动量 */}
                <td className="py-3 px-4 text-center">{item.interact}</td>
                {/* 互动量占比 */}
                <td className="py-3 px-4 text-center">{item.interactRatio}</td>
                {/* 互动量月度环比 */}
                <td className="py-3 px-4 text-center">{formatTrend(item.interactMoM)}</td>
                {/* 单帖互动量 */}
                <td className="py-3 px-4 text-center">{item.perPostInteract}</td>
                {/* 单帖互动量月度环比 */}
                <td className="py-3 px-4 text-center">{formatTrend(item.perPostMoM)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};