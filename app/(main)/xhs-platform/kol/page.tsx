'use client'

import { useState, useMemo, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { CallbackDataParams } from 'echarts/types/dist/shared';
import {
  TrendingUp, Users, Eye, AlertCircle, Download, Check,
  ArrowUpRight, ArrowDownRight, Activity,
  BarChart2, PieChart, MessageSquare, Table
} from 'lucide-react';
import { useMonthContext } from '@/app/(main)/context/MonthContext';

// 定义类型接口
interface TierData {
  声量: number | string | '-';  // 增加 string 类型支持 No data 文本
  声量占比: number | string | '-';
  声量月环比: number | string | '-';
  互动量: number | string | '-';
  互动量占比: number | string | '-';
  互动量月环比: number | string | '-';
  单帖互动量: number | string | '-';
  单帖互动量月环比: number | string | '-';
}

// 定义达人等级类型
type TierType = '超头部' | '头部' | '肩部' | '腰部' | '尾部';

interface MoleculeData {
  超头部: TierData;
  头部: TierData;
  肩部: TierData;  // 新增肩部层级
  腰部: TierData;
  尾部: TierData;
  // 移除KOC，统一为尾部
}

// 接口返回数据类型定义
interface ApiRecord {
  fields: {
    互动量: string;
    互动量占比: string;
    互动量月度环比: string;
    分子式: string;
    单帖互动量: string;
    单贴互动量月度环比: string;
    声量: string;
    声量占比: string;
    声量月度环比: string;
    标题: string;
    达人量级: string;
    日期: string;
  };
  id: string;
  record_id: string;
}

// 达人等级映射 - 更新为新的层级标准
const TIER_MAPPING: Record<string, TierType> = {
  '超头部': '超头部',
  '头部': '头部',
  '肩部': '肩部',
  '腰部': '腰部',
  '尾部': '尾部',
};

// 筛选标题常量
const FILTER_TITLE = "分子式KOL投放矩阵（红书）";

// 主题配置
const THEME = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowHover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  radius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    xl: '24px'
  }
};

// 达人等级颜色配置 - 更新为新的层级
const TIER_COLORS: Record<TierType, string> = {
  '超头部': '#EF4444',
  '头部': '#F59E0B',
  '肩部': '#8B5CF6',    // 新增肩部颜色
  '腰部': '#10B981',
  '尾部': '#3B82F6',
};

// 检测 No data 文本的正则
const NO_DATA_REGEX = /No data in\s+(\w+)/i;

// 千分位格式化函数（增强空值处理）
const formatNumberWithCommas = (num: number | string | undefined | null): string => {
  // 处理 No data 文本
  if (typeof num === 'string' && NO_DATA_REGEX.test(num)) {
    return num;
  }
  // 0 显示 0 而不是 -
  if (num === 0 || num === '0') return '0';
  // 空值/无效值处理
  if (num === '-' || !num || num === undefined || num === null || num === '') return '-';

  const number = Number(num);
  if (isNaN(number)) return '-';
  return number.toLocaleString('en-US');
};

// 工具函数：清理数字格式（增强空值处理）
const cleanNumber = (value: string): number | string | '-' => {
  // 识别并保留 No data 文本
  if (typeof value === 'string' && NO_DATA_REGEX.test(value)) {
    return value;
  }
  // 空值处理
  if (!value || value === '-' || value.trim() === '') return '-';
  // 0 保留为 0
  if (value === '0' || value.replace(/,/g, '') === '0') return 0;

  const cleaned = value.replace(/,/g, '').replace(/%/g, '');
  const num = parseFloat(cleaned);

  if (cleaned.includes('.') && Math.abs(num) < 1 && num !== 0) {
    return Math.round(num * 100);
  }

  return isNaN(num) ? '-' : Math.round(num);
};

// 工具函数：复制到剪贴板
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('复制失败:', err);
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

// 工具函数：格式化月份
const formatMonth = (monthStr: string): string => {
  const monthMap: Record<string, string> = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  if (monthStr.includes('-') && monthStr.length === 5) {
    const [monthAbbr, year] = monthStr.split('-');
    return `20${year}-${monthMap[monthAbbr] || '01'}`;
  }
  if (monthStr.includes('-') && monthStr.length === 7) {
    const [year, month] = monthStr.split('-');
    const reversedMonthMap = Object.entries(monthMap).find(([_, v]) => v === month)?.[0] || 'Jan';
    return `${reversedMonthMap}-${year.slice(2)}`;
  }
  return monthStr;
};

// 【新增工具函数】：生成 No data in 月份 文本
const getNoDataText = (month: string): string => {
  if (!month) return 'No data';
  // 提取月份缩写（如 Dec-24 -> Dec）
  const monthAbbr = month.split('-')[0];
  return `No data in ${monthAbbr}`;
};

export default function KOLMatrixPage() {
  // 状态管理
  const [kolData, setKolData] = useState<Record<string, MoleculeData>>({});
  const [activeMolecule, setActiveMolecule] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  // 控制：是否只显示全量表格（隐藏其他所有内容）
  const [showOnlyTable, setShowOnlyTable] = useState<boolean>(false);

  // 获取全局月份上下文
  const { selectedMonth } = useMonthContext();

  // ECharts 实例引用
  const barChartRef = useRef<any>(null);

  // 从API获取数据
  const fetchData = async (month: string) => {
    try {
      setLoading(true);
      const formattedMonth = formatMonth(month);
      const response = await fetch(`http://localhost:3000/api/feishu/XHSMoleculeKOL?month=${encodeURIComponent(formattedMonth)}`);

      if (!response.ok) {
        throw new Error(`HTTP错误，状态码：${response.status}`);
      }

      const rawData: ApiRecord[] = await response.json();
      const targetMonthFormat = formatMonth(month);
      const filteredData: ApiRecord[] = rawData.filter((item) =>
        item.fields.标题 === FILTER_TITLE &&
        formatMonth(item.fields.日期) === targetMonthFormat
      );

      const formattedData: Record<string, MoleculeData> = {};
      const allMolecules: string[] = [];
      for (const item of filteredData) {
        const mol = item.fields.分子式.trim();
        if (mol && !allMolecules.includes(mol)) {
          allMolecules.push(mol);
        }
      }

      for (const molecule of allMolecules) {
        // 更新初始化数据结构，使用新的层级（包含肩部，移除KOC）
        formattedData[molecule] = {
          超头部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
          头部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
          肩部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
          腰部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
          尾部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
        };
      }

      for (const item of filteredData) {
        const { fields } = item;
        const molecule = fields.分子式.trim();
        const tier = TIER_MAPPING[fields.达人量级] || fields.达人量级 as TierType;
        if (formattedData[molecule] && formattedData[molecule][tier]) {
          formattedData[molecule][tier] = {
            声量: cleanNumber(fields.声量),
            声量占比: cleanNumber(fields.声量占比),
            声量月环比: cleanNumber(fields.声量月度环比),
            互动量: cleanNumber(fields.互动量),
            互动量占比: cleanNumber(fields.互动量占比),
            互动量月环比: cleanNumber(fields.互动量月度环比),
            单帖互动量: cleanNumber(fields.单帖互动量),
            单帖互动量月环比: cleanNumber(fields.单贴互动量月度环比),
          };
        }
      }

      setKolData(formattedData);
      if (allMolecules.length > 0) {
        setActiveMolecule(allMolecules[0]);
      }
      setError(null);
    } catch (err) {
      console.error('获取数据失败:', err);
      setError(err instanceof Error ? err.message : '获取数据失败，请稍后重试');
      setKolData({});
    } finally {
      setLoading(false);
    }
  };

  // 监听月份变化，重新加载数据
  useEffect(() => {
    if (selectedMonth) {
      fetchData(selectedMonth);
    }
  }, [selectedMonth]);

  // 当前选中分子式的数据
  const currentData = useMemo(() => {
    if (!activeMolecule || !kolData[activeMolecule]) {
      // 更新默认数据结构
      return {
        超头部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
        头部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
        肩部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
        腰部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
        尾部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
      };
    }
    return kolData[activeMolecule];
  }, [activeMolecule, kolData]);

  // 生成Excel格式数据
  const generateExcelData = () => {
    const headers = [
      '月份', '分子式', '达人等级', '声量', '声量占比(%)', '声量月环比(%)',
      '互动量', '互动量占比(%)', '互动量月环比(%)', '单帖互动量', '单帖互动量月环比(%)'
    ];
    const rows = [headers.join('\t')];
    Object.entries(kolData).forEach(([molecule, tierData]) => {
      Object.entries(tierData).forEach(([tier, data]) => {
        const row = [
          selectedMonth || '',
          molecule,
          tier,
          data.声量 === '-' ? '' : data.声量,
          data.声量占比 === '-' ? '' : `${data.声量占比}`,
          data.声量月环比 === '-' ? '' : `${data.声量月环比}`,
          data.互动量 === '-' ? '' : data.互动量,
          data.互动量占比 === '-' ? '' : `${data.互动量占比}`,
          data.互动量月环比 === '-' ? '' : `${data.互动量月环比}`,
          data.单帖互动量 === '-' ? '' : data.单帖互动量,
          data.单帖互动量月环比 === '-' ? '' : `${data.单帖互动量月环比}`
        ];
        rows.push(row.join('\t'));
      });
    });
    rows.push('');
    rows.push(['汇总数据', '', '', '', '', '', '', '', '', '', ''].join('\t'));
    const totalVoice = Object.values(currentData).reduce((sum, item) => {
      const value = typeof item.声量 === 'number' ? item.声量 : 0;
      return sum + value;
    }, 0);
    const totalInteract = Object.values(currentData).reduce((sum, item) => {
      const value = typeof item.互动量 === 'number' ? item.互动量 : 0;
      return sum + value;
    }, 0);
    const avgPerPost = (() => {
      const total = Object.values(currentData).reduce((sum, item) => {
        const value = typeof item.单帖互动量 === 'number' ? item.单帖互动量 : 0;
        return sum + value;
      }, 0);
      const count = Object.values(currentData).filter(item => typeof item.单帖互动量 === 'number' && item.单帖互动量 > 0).length;
      return count > 0 ? Math.round(total / count) : 0;
    })();
    rows.push([
      selectedMonth || '',
      activeMolecule,
      '总计',
      totalVoice || '',
      '100',
      '',
      totalInteract || '',
      '100',
      '',
      avgPerPost || '',
      ''
    ].join('\t'));
    return rows.join('\n');
  };

  // 处理导出到Excel
  const handleExportToExcel = async () => {
    try {
      const excelData = generateExcelData();
      const success = await copyToClipboard(excelData);
      if (success) {
        setExportStatus('success');
        setTimeout(() => setExportStatus('idle'), 3000);
      } else {
        setExportStatus('error');
        setTimeout(() => setExportStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('导出失败:', err);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  // ECharts 图表数据转换
  const chartData = useMemo(() => {
    const tiers: TierType[] = ['超头部', '头部', '肩部', '腰部', '尾部'];
    const voiceData = tiers.map(tier => {
      const value = currentData[tier].声量;
      return typeof value === 'number' ? value : 0;
    });
    const interactData = tiers.map(tier => {
      const value = currentData[tier].互动量;
      return typeof value === 'number' ? value : 0;
    });
    return { tiers, voiceData, interactData };
  }, [currentData]);

  // 获取 ECharts 配置项 - 核心修改：双Y轴配置，右侧Y轴显示声量
  const getEchartsBarOption = (): EChartsOption => {
    const { tiers, voiceData, interactData } = chartData;
    return {
      title: {
        text: `KOL表现对比（${activeMolecule} - ${selectedMonth || '当前月份'}）`,
        left: 'center',
        top: 15,
        textStyle: { fontSize: 15, fontWeight: 600, color: '#1e293b', fontFamily: 'Inter, sans-serif' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}：{c}',
        textStyle: { fontSize: 13 },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(84, 112, 198, 0.1)' } }
      },
      legend: {
        data: ['声量', '互动量'],
        orient: 'horizontal',
        left: 'center',
        top: 45,
        textStyle: { fontSize: 13, color: '#475569', fontFamily: 'Inter, sans-serif' },
        itemGap: 18,
        itemWidth: 14,
        itemHeight: 14
      },
      xAxis: {
        type: 'category',
        data: tiers,
        axisLabel: { fontSize: 13, fontWeight: 500, rotate: 0, interval: 0, color: '#475569' },
        axisLine: { lineStyle: { color: '#e2e8f0', width: 1 } },
        axisTick: { alignWithLabel: true, lineStyle: { color: '#e2e8f0' } },
        splitLine: { show: false }
      },
      // 核心修改：配置双Y轴
      yAxis: [
        {
          // 左侧Y轴：互动量
          type: 'value',
          name: '互动量',
          nameTextStyle: { fontSize: 13, color: '#475569' },
          nameGap: 15,
          axisLabel: { fontSize: 13, color: '#475569', formatter: (value: number) => formatNumberWithCommas(value) },
          axisLine: { lineStyle: { color: '#e2e8f0', width: 1 } },
          splitLine: { lineStyle: { color: '#f1f5f9', width: 1 } },
          position: 'left'
        },
        {
          // 右侧Y轴：声量（关键修改）
          type: 'value',
          name: '声量',
          nameTextStyle: { fontSize: 13, color: '#475569' },
          nameGap: 15,
          axisLabel: { fontSize: 13, color: '#475569', formatter: (value: number) => formatNumberWithCommas(value) },
          axisLine: { lineStyle: { color: '#e2e8f0', width: 1 } },
          splitLine: { show: false }, // 隐藏右侧Y轴的分割线，避免重复
          position: 'right'
        }
      ],
      grid: { left: '8%', right: '8%', bottom: '12%', top: '18%', containLabel: true },
      series: [
        {
          name: '声量',
          type: 'bar',
          data: voiceData,
          barWidth: '35%',
          yAxisIndex: 1, // 指定声量使用右侧Y轴（索引1）
          itemStyle: {
            color: '#5470c6',
            borderRadius: [6, 6, 0, 0],
            shadowColor: 'rgba(84, 112, 198, 0.15)',
            shadowBlur: 6,
            shadowOffsetY: 2
          },
          label: {
            show: true,
            position: 'top',
            fontSize: 12,
            color: '#1e293b',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            formatter: (params: CallbackDataParams) => formatNumberWithCommas(typeof params.value === 'number' ? params.value : 0)
          },
          emphasis: { itemStyle: { opacity: 0.9 } }
        },
        {
          name: '互动量',
          type: 'bar',
          data: interactData,
          barWidth: '35%',
          yAxisIndex: 0, // 指定互动量使用左侧Y轴（索引0）
          itemStyle: {
            color: '#91cc75',
            borderRadius: [6, 6, 0, 0],
            shadowColor: 'rgba(145, 204, 117, 0.15)',
            shadowBlur: 6,
            shadowOffsetY: 2
          },
          label: {
            show: true,
            position: 'top',
            fontSize: 12,
            color: '#1e293b',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            formatter: (params: CallbackDataParams) => formatNumberWithCommas(typeof params.value === 'number' ? params.value : 0)
          },
          emphasis: { itemStyle: { color: '#91cc75', opacity: 0.9 } }
        }
      ],
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    };
  };

  // 窗口大小变化时重绘图表
  useEffect(() => {
    const handleResize = () => {
      if (barChartRef.current) {
        barChartRef.current.getEchartsInstance().resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 渲染趋势指示器 - 所有文本显示为正常黑色
  const renderTrend = (value: number | string) => {
    // 处理 No data 文本
    if (typeof value === 'string' && NO_DATA_REGEX.test(value)) {
      return <span className="text-gray-900">{value}</span>;
    }
    // 当值为 '-' 时，直接显示 '-'，颜色为正常黑色
    if (value === '-') return <span className="text-gray-900">-</span>;
    // 当值为 0 时，显示 0%，颜色为正常黑色
    if (value === 0) return <span className="text-gray-900">0%</span>;

    const num = Number(value);
    if (num > 0) {
      return (
        <span className="flex items-center text-green-600 font-medium">
          <ArrowUpRight size={14} className="mr-1" />
          {num}%
        </span>
      );
    } else if (num < 0) {
      return (
        <span className="flex items-center text-red-600 font-medium">
          <ArrowDownRight size={14} className="mr-1" />
          {Math.abs(num)}%
        </span>
      );
    }
    return <span className="text-gray-900">0%</span>;
  };

  // 加载状态
  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: THEME.background
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: `4px solid ${THEME.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: THEME.textSecondary, fontSize: '16px' }}>加载{selectedMonth || '月度'}数据中...</p>
          <style jsx global>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: THEME.background,
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '500px',
          background: THEME.cardBg,
          borderRadius: THEME.radius.md,
          padding: '24px',
          boxShadow: THEME.shadow,
          textAlign: 'center'
        }}>
          <AlertCircle size={48} color={THEME.danger} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: THEME.textPrimary, fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>数据加载失败</h3>
          <p style={{ color: THEME.textSecondary, margin: '0 0 24px' }}>{error}</p>
          <button
            onClick={() => fetchData(selectedMonth || 'Jan-26')}
            style={{
              background: THEME.primary,
              color: 'white',
              border: 'none',
              borderRadius: THEME.radius.sm,
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = THEME.primaryDark}
            onMouseLeave={(e) => e.currentTarget.style.background = THEME.primary}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 无数据状态
  if (Object.keys(kolData).length === 0) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: THEME.background,
        padding: '24px'
      }}>
        <AlertCircle size={64} color={THEME.warning} style={{ marginBottom: '16px' }} />
        <h3 style={{ color: THEME.textPrimary, fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>暂无数据</h3>
        <p style={{ color: THEME.textSecondary, fontSize: '16px', textAlign: 'center', maxWidth: '500px' }}>
          {selectedMonth}月份暂无{FILTER_TITLE}相关数据，请选择其他月份查看
        </p>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: THEME.background,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* 页面头部 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 24px 40px 24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'white',
                margin: 0,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Users size={24} />
                【红书】重点分子式KOL投放矩阵
                <span style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '16px'
                }}>
                  {selectedMonth || '当前月份'}
                </span>
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', margin: 0, lineHeight: 1.6 }}>
                深度分析红书平台重点分子式药品的KOL投放表现，洞察声量与互动趋势
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleExportToExcel}
                disabled={exportStatus !== 'idle'}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: THEME.radius.md,
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: exportStatus === 'idle' ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  opacity: exportStatus === 'idle' ? 1 : 0.8
                }}
                onMouseEnter={(e) => {
                  if (exportStatus === 'idle') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  if (exportStatus === 'idle') e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                {exportStatus === 'success' ? (
                  <>
                    <Check size={18} color={THEME.success} />
                    复制成功！
                  </>
                ) : exportStatus === 'error' ? (
                  <>
                    <AlertCircle size={18} color={THEME.danger} />
                    复制失败
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    复制
                  </>
                )}
              </button>

              {/* 切换：只显示全量表格 / 恢复正常 */}
              <button
                onClick={() => setShowOnlyTable(!showOnlyTable)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: THEME.radius.md,
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              >
                <Table size={18} />
                {showOnlyTable ? '返回正常视图' : '只看全量表格'}
              </button>

              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                padding: '8px 16px',
                borderRadius: THEME.radius.md,
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <select
                  value={activeMolecule}
                  onChange={(e) => setActiveMolecule(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '220px'
                  }}
                >
                  {Object.keys(kolData).map((mol) => (
                    <option key={mol} value={mol} style={{ color: '#111827' }}>
                      {mol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div style={{ maxWidth: '1200px', margin: '20px auto 0', padding: '0 24px' }}>
        {/* 只显示全量表格 */}
        {showOnlyTable ? (
          <div style={{
            background: THEME?.cardBg || '#ffffff',
            borderRadius: THEME?.radius?.lg || '12px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            marginBottom: '14px',
            overflowX: 'auto'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: THEME?.textPrimary || '#1f2937',
              margin: 0,
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative',
              paddingBottom: '12px'
            }}>
              <Table size={20} color={THEME?.primary || '#d4af37'} />
              全量数据表格（{selectedMonth || '当前月份'}）
              <span style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '60px',
                height: '2px',
                background: THEME?.primary || '#d4af37',
                borderRadius: '1px'
              }}></span>
            </h2>

            {/* 两列网格布局 - 强制等宽 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '5px',
              width: '100%'
            }}>
              {Object.entries(kolData).map(([molecule, tierData]) => {
                // 提前获取所有达人等级，使用新的层级顺序
                const allTiers: TierType[] = ['超头部', '头部', '肩部', '腰部', '尾部'];
                // 补全缺失的达人等级数据，避免行数不一致
                const completeTierData = allTiers.reduce((acc: Record<TierType, TierData>, tier) => {
                  acc[tier] = tierData[tier] || {
                    声量: '-',
                    声量占比: '-',
                    声量月环比: '-',
                    互动量: '-',
                    互动量占比: '-',
                    互动量月环比: '-',
                    单帖互动量: '-',
                    单帖互动量月环比: '-'
                  };
                  return acc;
                }, {} as Record<TierType, TierData>);

                return (
                  <div
                    key={molecule}
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: THEME?.radius?.md || '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.3s ease',
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.03)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* 统一的标题栏样式 */}
                    <div style={{
                      background: 'linear-gradient(135deg, #d4af37 0%, #f0d460 100%)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <h3 style={{
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 700,
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                      }}>
                        {molecule} KOL矩阵
                      </h3>
                    </div>

                    {/* 表格容器 - 强制统一尺寸 */}
                    <div style={{
                      flex: 1,
                      overflow: 'auto'
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontSize: '8px',
                        tableLayout: 'fixed'
                      }}>
                        {/* 统一的表头样式 */}
                        <thead>
                          <tr style={{
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)'
                          }}>
                            {/* 9列统一样式 - 固定宽度比例 */}
                            <th style={{
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '10px 0',
                              textAlign: 'center',
                              borderRight: '1px solid #333333',
                              width: '12%'
                            }}>
                              达人量级
                            </th>
                            <th style={{
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '10px 0',
                              textAlign: 'center',
                              borderRight: '1px solid #333333',
                              width: '10%'
                            }}>
                              声量
                            </th>
                            <th style={{
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '10px 0',
                              textAlign: 'center',
                              borderRight: '1px solid #333333',
                              width: '11%'
                            }}>
                              声量<br />占比
                            </th>
                            <th style={{
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '10px 0',
                              textAlign: 'center',
                              borderRight: '1px solid #333333',
                              width: '11%'
                            }}>
                              声量<br />环比
                            </th>
                            <th style={{
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '10px 0',
                              textAlign: 'center',
                              borderRight: '1px solid #333333',
                              width: '11%'
                            }}>
                              互动量
                            </th>
                            <th style={{
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '10px 0',
                              textAlign: 'center',
                              borderRight: '1px solid #333333',
                              width: '11%'
                            }}>
                              互动量<br />占比
                            </th>
                            <th style={{
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '10px 0',
                              textAlign: 'center',
                              borderRight: '1px solid #333333',
                              width: '11%'
                            }}>
                              互动量<br />环比
                            </th>
                            <th style={{
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '10px 0',
                              textAlign: 'center',
                              borderRight: '1px solid #333333',
                              width: '10%'
                            }}>
                              单帖<br />互动量
                            </th>
                            <th style={{
                              color: 'white',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '10px 0',
                              textAlign: 'center',
                              width: '13%'
                            }}>
                              单帖<br />环比
                            </th>
                          </tr>
                        </thead>

                        {/* 统一的表格内容样式 */}
                        <tbody>
                          {allTiers.map((tier, idx) => {
                            const data = completeTierData[tier];
                            const isEvenRow = idx % 2 === 0;
                            return (
                              <tr
                                key={tier}
                                style={{
                                  background: isEvenRow ? '#f8f9fa' : '#ffffff',
                                  transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#f0f7ff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = isEvenRow ? '#f8f9fa' : '#ffffff';
                                }}
                              >
                                {/* 达人量级单元格 - 更新为新的粉丝数范围 */}
                                <td style={{
                                  padding: '10px 0',
                                  textAlign: 'center',
                                  fontWeight: 600,
                                  color: '#212529',
                                  lineHeight: '1.3',
                                }}>
                                  {tier === '超头部' && <>超头部<br />(粉丝数≥500w)</>}
                                  {tier === '头部' && <>头部<br />(100w≤粉丝数&lt;500w)</>}
                                  {tier === '肩部' && <>肩部<br />(50w≤粉丝数&lt;100w)</>}
                                  {tier === '腰部' && <>腰部<br />(10w≤粉丝数&lt;50w)</>}
                                  {tier === '尾部' && <>尾部<br />(1w≤粉丝数&lt;10w)</>}
                                </td>

                                {/* 声量单元格 - 全部显示为正常黑色 */}
                                <td style={{
                                  padding: '10px 0',
                                  textAlign: 'center',
                                  color: '#212529',
                                  fontWeight: 500
                                }}>
                                  {typeof data.声量 === 'string' && NO_DATA_REGEX.test(data.声量)
                                    ? <span className="text-gray-900">{data.声量}</span>
                                    : <span className="text-gray-900">{formatNumberWithCommas(data.声量)}</span>}
                                </td>

                                {/* 声量占比 - 全部显示为正常黑色 */}
                                <td style={{
                                  padding: '10px 0',
                                  textAlign: 'center',
                                  color: '#212529',
                                  fontWeight: 500
                                }}>
                                  {typeof data.声量占比 === 'string' && NO_DATA_REGEX.test(data.声量占比) ? (
                                    <span className="text-gray-900">{data.声量占比}</span>
                                  ) : data.声量占比 !== '-' ? (
                                    <span style={{
                                      color: '#212529',
                                      display: 'inline-block'
                                    }}>
                                      {data.声量占比}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-900">-</span>
                                  )}
                                </td>

                                {/* 声量环比 */}
                                <td style={{
                                  padding: '10px 0',
                                  textAlign: 'center',
                                  fontWeight: 600,
                                }}>
                                  {renderTrend(data.声量月环比)}
                                </td>

                                {/* 互动量单元格 - 全部显示为正常黑色 */}
                                <td style={{
                                  padding: '10px 0',
                                  textAlign: 'center',
                                  color: '#212529',
                                  fontWeight: 500
                                }}>
                                  {typeof data.互动量 === 'string' && NO_DATA_REGEX.test(data.互动量)
                                    ? <span className="text-gray-900">{data.互动量}</span>
                                    : <span className="text-gray-900">{formatNumberWithCommas(data.互动量)}</span>}
                                </td>

                                {/* 互动量占比 - 全部显示为正常黑色 */}
                                <td style={{
                                  padding: '10px 0',
                                  textAlign: 'center',
                                  color: '#212529',
                                  fontWeight: 500
                                }}>
                                  {typeof data.互动量占比 === 'string' && NO_DATA_REGEX.test(data.互动量占比) ? (
                                    <span className="text-gray-900">{data.互动量占比}</span>
                                  ) : data.互动量占比 !== '-' ? (
                                    <span style={{
                                      color: '#212529',
                                      display: 'inline-block'
                                    }}>
                                      {data.互动量占比}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-900">-</span>
                                  )}
                                </td>

                                {/* 互动量环比 */}
                                <td style={{
                                  padding: '10px 0',
                                  textAlign: 'center',
                                  fontWeight: 600,
                                }}>
                                  {renderTrend(data.互动量月环比)}
                                </td>

                                {/* 单帖互动量 - 全部显示为正常黑色 */}
                                <td style={{
                                  padding: '10px 0',
                                  textAlign: 'center',
                                  color: '#212529',
                                  fontWeight: 500
                                }}>
                                  {typeof data.单帖互动量 === 'string' && NO_DATA_REGEX.test(data.单帖互动量)
                                    ? <span className="text-gray-900">{data.单帖互动量}</span>
                                    : <span className="text-gray-900">{formatNumberWithCommas(data.单帖互动量)}</span>}
                                </td>

                                {/* 单帖环比 */}
                                <td style={{
                                  padding: '10px 0',
                                  textAlign: 'center',
                                  fontWeight: 600,
                                }}>
                                  {renderTrend(data.单帖互动量月环比)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* 概览卡片 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: THEME.cardBg,
                borderRadius: THEME.radius.md,
                padding: '20px',
                boxShadow: THEME.shadow,
                transition: 'all 0.3s ease',
                border: `1px solid ${THEME.border}`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: THEME.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Activity size={16} color={THEME.primary} />
                    总声量
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: THEME.textPrimary,
                      letterSpacing: '-0.025em'
                    }}>
                      {formatNumberWithCommas(Object.values(currentData).reduce((sum, item) => {
                        const value = typeof item.声量 === 'number' ? item.声量 : 0;
                        return sum + value;
                      }, 0))}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: THEME.textTertiary, lineHeight: 1.4 }}>
                    {selectedMonth || '本月'}KOL总发声次数
                  </span>
                </div>
              </div>

              <div style={{
                background: THEME.cardBg,
                borderRadius: THEME.radius.md,
                padding: '20px',
                boxShadow: THEME.shadow,
                transition: 'all 0.3s ease',
                border: `1px solid ${THEME.border}`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: THEME.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <MessageSquare size={16} color={THEME.success} />
                    总互动量
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: THEME.textPrimary,
                      letterSpacing: '-0.025em'
                    }}>
                      {(Object.values(currentData).reduce((sum, item) => {
                        const value = typeof item.互动量 === 'number' ? item.互动量 : 0;
                        return sum + value;
                      }, 0) / 10000).toFixed(1)}w
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: THEME.textTertiary, lineHeight: 1.4 }}>
                    {selectedMonth || '本月'}KOL总互动次数
                  </span>
                </div>
              </div>

              <div style={{
                background: THEME.cardBg,
                borderRadius: THEME.radius.md,
                padding: '20px',
                boxShadow: THEME.shadow,
                transition: 'all 0.3s ease',
                border: `1px solid ${THEME.border}`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: THEME.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Eye size={16} color={THEME.warning} />
                    平均单帖互动
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: THEME.textPrimary,
                      letterSpacing: '-0.025em'
                    }}>
                      {(() => {
                        const total = Object.values(currentData).reduce((sum, item) => {
                          const value = typeof item.单帖互动量 === 'number' ? item.单帖互动量 : 0;
                          return sum + value;
                        }, 0);
                        const count = Object.values(currentData).filter(item => typeof item.单帖互动量 === 'number' && item.单帖互动量 > 0).length;
                        return count > 0 ? formatNumberWithCommas(Math.round(total / count)) : '0';
                      })()}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: THEME.textTertiary, lineHeight: 1.4 }}>
                    单条内容平均互动次数
                  </span>
                </div>
              </div>
            </div>

            {/* 图表区域 */}
            <div style={{
              background: THEME.cardBg,
              borderRadius: THEME.radius.lg,
              padding: '24px',
              boxShadow: THEME.shadow,
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: THEME.textPrimary,
                margin: 0,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BarChart2 size={20} color={THEME.primary} />
                KOL表现对比
              </h2>
              <div style={{ height: '400px' }}>
                <ReactECharts
                  ref={barChartRef}
                  option={getEchartsBarOption()}
                  style={{ width: '100%', height: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            </div>

            {/* KOL 卡片网格 - 更新为新的层级 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              marginBottom: '24px'
            }}>
              {Object.entries(currentData).map(([tier, data]) => {
                const typedTier = tier as TierType;
                return (
                  <div
                    key={typedTier}
                    style={{
                      background: THEME.cardBg,
                      borderRadius: THEME.radius.lg,
                      padding: '24px',
                      boxShadow: THEME.shadow,
                      transition: 'all 0.3s ease',
                      border: `1px solid ${THEME.border}`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = THEME.shadowHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = THEME.shadow;
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '4px',
                      background: TIER_COLORS[typedTier] || THEME.primary
                    }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: THEME.textPrimary, margin: 0, marginBottom: '4px' }}>
                          {typedTier}
                        </h3>
                        <p style={{ fontSize: '12px', color: THEME.textTertiary, margin: 0 }}>
                          {/* 更新粉丝数范围 */}
                          {typedTier === '超头部' && '(粉丝数≥500w)'}
                          {typedTier === '头部' && '(100w≤粉丝数<500w)'}
                          {typedTier === '肩部' && '(50w≤粉丝数<100w)'}
                          {typedTier === '腰部' && '(10w≤粉丝数<50w)'}
                          {typedTier === '尾部' && '(1w≤粉丝数<10w)'}
                        </p>
                      </div>
                      <div style={{
                        background: `${TIER_COLORS[typedTier] || THEME.primary}15`,
                        padding: '8px 12px',
                        borderRadius: THEME.radius.sm,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: TIER_COLORS[typedTier] || THEME.primary
                      }}>
                        {typeof data.声量占比 === 'string' && NO_DATA_REGEX.test(data.声量占比)
                          ? data.声量占比
                          : data.声量占比 !== '-' ? `${data.声量占比}%` : '-'}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{
                        background: THEME.background,
                        borderRadius: THEME.radius.md,
                        padding: '16px',
                        border: `1px solid ${THEME.border}`
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: THEME.textSecondary,
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Activity size={12} />
                          声量
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '20px', fontWeight: 700, color: THEME.textPrimary }}>
                            {typeof data.声量 === 'string' && NO_DATA_REGEX.test(data.声量)
                              ? <span className="text-gray-900">{data.声量}</span>
                              : <span className="text-gray-900">{formatNumberWithCommas(data.声量)}</span>}
                          </span>
                          {renderTrend(data.声量月环比)}
                        </div>
                      </div>
                      <div style={{
                        background: THEME.background,
                        borderRadius: THEME.radius.md,
                        padding: '16px',
                        border: `1px solid ${THEME.border}`
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: THEME.textSecondary,
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <MessageSquare size={12} />
                          互动量
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '20px', fontWeight: 700, color: THEME.textPrimary }}>
                            {typeof data.互动量 === 'string' && NO_DATA_REGEX.test(data.互动量) ? (
                              <span className="text-gray-900">{data.互动量}</span>
                            ) : data.互动量 !== '-' ? (
                              <span className="text-gray-900">
                                {Number(data.互动量) > 10000 ? `${(Number(data.互动量)/10000).toFixed(1)}w` : formatNumberWithCommas(data.互动量)}
                              </span>
                            ) : <span className="text-gray-900">-</span>}
                          </span>
                          {renderTrend(data.互动量月环比)}
                        </div>
                      </div>
                      <div style={{
                        gridColumn: 'span 2',
                        background: THEME.background,
                        borderRadius: THEME.radius.md,
                        padding: '16px',
                        border: `1px solid ${THEME.border}`
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: THEME.textSecondary,
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Eye size={12} />
                          单帖互动量
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '20px', fontWeight: 700, color: THEME.textPrimary }}>
                            {typeof data.单帖互动量 === 'string' && NO_DATA_REGEX.test(data.单帖互动量)
                              ? <span className="text-gray-900">{data.单帖互动量}</span>
                              : <span className="text-gray-900">{formatNumberWithCommas(data.单帖互动量)}</span>}
                          </span>
                          {renderTrend(data.单帖互动量月环比)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}