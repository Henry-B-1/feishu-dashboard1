// app/context/MonthContext.tsx
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

// 月份列表常量
export const fullMonthList = [
  'Jan-26', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
  'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'
];

// 排序映射
const monthSortMap = Object.fromEntries(
  fullMonthList.map((month, index) => [month, index + 1])
);
const sortedMonths = fullMonthList.sort((a, b) => monthSortMap[a] - monthSortMap[b]);

// 上下文提供者组件
export const MonthProvider = ({ children }: { children: ReactNode }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('Jan-26');

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

// 自定义 Hook 方便使用上下文
export const useMonthContext = () => {
  const context = useContext(MonthContext);
  if (context === undefined) {
    throw new Error('useMonthContext must be used within a MonthProvider');
  }
  return context;
};