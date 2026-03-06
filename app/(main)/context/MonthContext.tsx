// app/(main)/context/MonthContext.tsx （注意路径要和 layout.tsx 中的导入路径匹配）
'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';

// 定义上下文类型
interface MonthContextType {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  allMonthOptions: string[];
}

// 创建上下文，默认值设为 undefined 方便后续校验
const MonthContext = createContext<MonthContextType | undefined>(undefined);

// 月份英文缩写映射
const monthAbbrMap = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// 生成从startYear到endYear的所有月份（格式：Jan-25, Feb-25...Dec-30）
const generateMonthList = (startYear: number, endYear: number): string[] => {
  const monthList: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const yearSuffix = year.toString().slice(-2);
      const monthStr = `${monthAbbrMap[month]}-${yearSuffix}`;
      monthList.push(monthStr);
    }
  }
  return monthList;
};

// 生成2025到2125年的所有月份列表（无年份上限）
export const fullMonthList = generateMonthList(2025, 2125);

// 排序逻辑（生成的列表已按时间正序，排序仅作备用）
const monthSortMap = Object.fromEntries(
  fullMonthList.map((month, index) => [month, index + 1])
);
const sortedMonths = fullMonthList.sort((a, b) => monthSortMap[a] - monthSortMap[b]);

// ========== 关键：确保 MonthProvider 被正确导出 ==========
export const MonthProvider = ({ children }: { children: ReactNode }) => {
  // 默认选中2025年1月
  const [selectedMonth, setSelectedMonth] = useState<string>(fullMonthList[0]);

  return (
    <MonthContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        allMonthOptions: sortedMonths
      }}
    >
      {children}
    </MonthContext.Provider>
  );
};

// ========== 关键：确保 useMonthContext 被正确导出 ==========
export const useMonthContext = () => {
  const context = useContext(MonthContext);
  if (context === undefined) {
    throw new Error('useMonthContext must be used within a MonthProvider');
  }
  return context;
};

// 可选：导出工具函数（供 layout 使用）
export const generateYearList = (startYear = 2025, endYear = 2125) => {
  return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
};

export const generateMonthsByYear = (year: number) => {
  const yearSuffix = year.toString().slice(-2);
  return monthAbbrMap.map(abbr => `${abbr}-${yearSuffix}`);
};