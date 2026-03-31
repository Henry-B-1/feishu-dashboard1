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
  声量: number | string | '-';
  声量占比: number | string | '-';
  声量月环比: number | string | '-';
  互动量: number | string | '-';
  互动量占比: number | string | '-';
  互动量月环比: number | string | '-';
  单帖互动量: number | string | '-';
  单帖互动量月环比: number | string | '-';
}

// 不再固定类型，改为动态字符串
type TierType = string;

interface MoleculeData {
  [key: string]: TierData; // 动态达人层级
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

// 动态颜色（自动给不同达人量级分配颜色）
const getTierColor = (tier: string) => {
  const colors = ['#EF4444', '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EC4899', '#6366F1', '#84CC16'];
  let hash = 0;
  for (let i = 0; i < tier.length; i++) {
    hash = tier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// 检测 No data 文本的正则
const NO_DATA_REGEX = /No data in\s+(\w+)/i;

// 千分位格式化函数（增强空值处理）
const formatNumberWithCommas = (num: number | string | undefined | null): string => {
  if (typeof num === 'string' && NO_DATA_REGEX.test(num)) {
    return num;
  }
  if (num === 0 || num === '0') return '0';
  if (num === '-' || !num || num === undefined || num === null || num === '') return '-';

  const number = Number(num);
  if (isNaN(number)) return '-';
  return number.toLocaleString('en-US');
};

// 工具函数：清理数字格式（增强空值处理）
const cleanNumber = (value: string): number | string | '-' => {
  if (typeof value === 'string' && NO_DATA_REGEX.test(value)) {
    return value;
  }
  if (!value || value === '-' || value.trim() === '') return '-';
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
      const response = await fetch(`/api/feishu/XHSMoleculeKOL?month=${encodeURIComponent(formattedMonth)}`);

      if (!response.ok) {
        throw new Error(`HTTP错误，状态码：${response.status}`);
      }

      const rawData: ApiRecord[] = await response.json();
      const targetMonthFormat = formatMonth(month);
      const filteredData: ApiRecord[] = rawData.filter((item) =>
        item.fields.标题 === FILTER_TITLE &&
        formatMonth(item.fields.日期) === targetMonthFormat
      );

      // 动态收集所有达人量级
      const allTiers = new Set<string>();
      filteredData.forEach(item => {
        const tier = item.fields.达人量级?.trim();
        if (tier) allTiers.add(tier);
      });

      const formattedData: Record<string, MoleculeData> = {};
      const allMolecules: string[] = [];
      filteredData.forEach((item) => {
        const mol = item.fields.分子式.trim();
        if (mol && !allMolecules.includes(mol)) allMolecules.push(mol);
      });

      // 动态初始化结构
      allMolecules.forEach(mol => {
        formattedData[mol] = {};
        allTiers.forEach(tier => {
          formattedData[mol][tier] = {
            声量: '-', 声量占比: '-', 声量月环比: '-',
            互动量: '-', 互动量占比: '-', 互动量月环比: '-',
            单帖互动量: '-', 单帖互动量月环比: '-'
          };
        });
      });

      // 填充数据
      filteredData.forEach(item => {
        const { fields } = item;
        const molecule = fields.分子式.trim();
        const tier = fields.达人量级?.trim();
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
      });

      setKolData(formattedData);
      if (allMolecules.length > 0) setActiveMolecule(allMolecules[0]);
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
    return kolData[activeMolecule] || {};
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

  // ECharts 图表数据转换（动态）
  const chartData = useMemo(() => {
    const tiers = Object.keys(currentData);
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

  // 获取 ECharts 配置项
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
      yAxis: [
        { type: 'value', name: '互动量', nameTextStyle: { fontSize: 13 }, axisLabel: { formatter: (value: number) => formatNumberWithCommas(value) }, position: 'right' },
        { type: 'value', name: '声量', nameTextStyle: { fontSize: 13 }, axisLabel: { formatter: (value: number) => formatNumberWithCommas(value) }, splitLine: { show: false }, position: 'left' }
      ],
      grid: { left: '8%', right: '8%', bottom: '12%', top: '18%', containLabel: true },
      series: [
        { name: '互动量', type: 'bar', data: interactData, yAxisIndex: 0, barWidth: '35%', itemStyle: { color: '#5470c6', borderRadius: [6,6,0,0] }, label: { show: true, position: 'top', formatter: (p) => formatNumberWithCommas(Number(p.value)) } },
        { name: '声量', type: 'bar', data: voiceData, yAxisIndex: 1, barWidth: '35%', itemStyle: { color: '#91cc75', borderRadius: [6,6,0,0] }, label: { show: true, position: 'top', formatter: (p) => formatNumberWithCommas(Number(p.value)) } }
      ],
      animationDuration: 1000
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

  // 渲染趋势指示器
  const renderTrend = (value: number | string) => {
    if (typeof value === 'string' && NO_DATA_REGEX.test(value)) {
      return <span className="text-gray-900">{value}</span>;
    }
    if (value === '-') return <span className="text-gray-900">-</span>;
    if (value === 0) return <span className="text-gray-900">0%</span>;

    const num = Number(value);
    if (num > 0) {
      return (
        <span className="flex items-center text-green-600 font-medium">
          <ArrowUpRight size={14} className="mr-1" />{num}%
        </span>
      );
    } else if (num < 0) {
      return (
        <span className="flex items-center text-red-600 font-medium">
          <ArrowDownRight size={14} className="mr-1" />{Math.abs(num)}%
        </span>
      );
    }
    return <span className="text-gray-900">0%</span>;
  };

  // 加载状态
  if (loading) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: `4px solid ${THEME.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', marginLeft: 'auto', marginRight: 'auto', marginBottom: '16px' }}></div>
          <p style={{ color: THEME.textSecondary, fontSize: '16px' }}>加载{selectedMonth || '月度'}数据中...</p>
          <style jsx global>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }`}</style>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background, paddingLeft: '24px', paddingRight: '24px' }}>
        <div style={{ maxWidth: '500px', backgroundColor: THEME.cardBg, borderRadius: THEME.radius.md, padding: '24px', boxShadow: THEME.shadow, textAlign: 'center' }}>
          <AlertCircle size={48} color={THEME.danger} style={{ marginLeft: 'auto', marginRight: 'auto', marginBottom: '16px' }} />
          <h3 style={{ color: THEME.textPrimary, fontSize: '18px', fontWeight: 600, marginTop: 0, marginBottom: '8px' }}>数据加载失败</h3>
          <p style={{ color: THEME.textSecondary, marginTop: 0, marginBottom: '24px' }}>{error}</p>
          <button onClick={() => fetchData(selectedMonth || 'Jan-26')} style={{ backgroundColor: THEME.primary, color: 'white', border: 'none', borderRadius: THEME.radius.sm, padding: '8px 16px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>重试</button>
        </div>
      </div>
    );
  }

  // 无数据状态
  if (Object.keys(kolData).length === 0) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background, paddingLeft: '24px', paddingRight: '24px' }}>
        <AlertCircle size={64} color={THEME.warning} style={{ marginBottom: '16px' }} />
        <h3 style={{ color: THEME.textPrimary, fontSize: '20px', fontWeight: 600, marginTop: 0, marginBottom: '8px' }}>暂无数据</h3>
        <p style={{ color: THEME.textSecondary, fontSize: '16px', textAlign: 'center', maxWidth: '500px' }}>
          {selectedMonth}月份暂无{FILTER_TITLE}相关数据，请选择其他月份查看
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: THEME.background, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* 页面头部 */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', paddingTop: '40px', paddingBottom: '40px', paddingLeft: '24px', paddingRight: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginTop: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={24} />
                【红书】重点分子式KOL投放矩阵
                <span style={{ fontSize: '16px', fontWeight: 500, backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '16px' }}>{selectedMonth || '当前月份'}</span>
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginTop: 0, marginBottom: 0, lineHeight: 1.6 }}>深度分析红书平台重点分子式药品的KOL投放表现，洞察声量与互动趋势</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={handleExportToExcel} disabled={exportStatus !== 'idle'} style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: THEME.radius.md, padding: '8px 16px', color: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {exportStatus === 'success' ? (<><Check size={18} color={THEME.success} />复制成功！</>) : exportStatus === 'error' ? (<><AlertCircle size={18} color={THEME.danger} />复制失败</>) : (<><Download size={18} />复制</>)}
              </button>
              <button onClick={() => setShowOnlyTable(!showOnlyTable)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: THEME.radius.md, padding: '8px 16px', color: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Table size={18} />{showOnlyTable ? '返回正常视图' : '只看全量表格'}
              </button>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: THEME.radius.md, border: '1px solid rgba(255,255,255,0.2)' }}>
                <select value={activeMolecule} onChange={(e) => setActiveMolecule(e.target.value)} style={{ backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '14px', fontWeight: 500, cursor: 'pointer', outline: 'none', minWidth: '220px' }}>
                  {Object.keys(kolData).map((mol) => (<option key={mol} value={mol} style={{ color: '#111827' }}>{mol}</option>))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div style={{ maxWidth: '1200px', marginTop: '20px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px' }}>
        {showOnlyTable ? (
  <div style={{ backgroundColor: THEME.cardBg, borderRadius: THEME.radius.lg, padding: '20px', boxShadow: THEME.shadow, marginBottom: '24px', overflowX: 'auto' }}>
    <h2 style={{ fontSize: '18px', fontWeight: 700, color: THEME.textPrimary, marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '10px' }}>
      <Table size={20} color={THEME.primary} />全量数据表格（{selectedMonth || '当前月份'}）
    </h2>
    {/* 左右两栏网格布局 - 缩小间距 */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {Object.entries(kolData).map(([molecule, tierData]) => (
        <div key={molecule} style={{ border: '1px solid #E5E7EB', borderRadius: THEME.radius.sm, overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          {/* 表格标题栏 - 缩小高度和内边距 */}
          <div style={{ background: 'linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)', padding: '10px 12px', textAlign: 'center' }}>
            <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 600, margin: 0, letterSpacing: '0.3px' }}>{molecule} KOL投放矩阵</h3>
          </div>
          {/* 表格内容区 */}
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', lineHeight: 1.4 }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  {/* 缩小列宽，更紧凑 */}
                  <th style={{ width: '90px', padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', fontSize: '11px' }}>达人量级</th>
                  <th style={{ width: '60px', padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', fontSize: '11px' }}>声量</th>
                  <th style={{ width: '65px', padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', fontSize: '11px' }}>声量占比</th>
                  <th style={{ width: '65px', padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', fontSize: '11px' }}>声量环比</th>
                  <th style={{ width: '65px', padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', fontSize: '11px' }}>互动量</th>
                  <th style={{ width: '65px', padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', fontSize: '11px' }}>互动占比</th>
                  <th style={{ width: '65px', padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', fontSize: '11px' }}>互动环比</th>
                  <th style={{ width: '65px', padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', fontSize: '11px' }}>单帖互动</th>
                  <th style={{ width: '65px', padding: '8px 4px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', fontSize: '11px' }}>单帖环比</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tierData).map(([tier, data], idx) => (
                  <tr key={tier} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAFB', height: '40px' }}>
                    {/* 达人量级列 - 缩小内边距 */}
                    <td style={{ padding: '8px 4px', textAlign: 'left', paddingLeft: '10px', fontWeight: 600, color: '#111827', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle', fontSize: '11px' }}>{tier}</td>
                    {/* 数值列 - 缩小内边距和字体 */}
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle', fontSize: '11px' }}>{formatNumberWithCommas(data.声量)}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle', fontSize: '11px' }}>{data.声量占比 !== '-' ? `${data.声量占比}%` : '-'}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle', fontSize: '11px' }}>{renderTrend(data.声量月环比)}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle', fontSize: '11px' }}>{formatNumberWithCommas(data.互动量)}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle', fontSize: '11px' }}>{data.互动量占比 !== '-' ? `${data.互动量占比}%` : '-'}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle', fontSize: '11px' }}>{renderTrend(data.互动量月环比)}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle', fontSize: '11px' }}>{formatNumberWithCommas(data.单帖互动量)}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle', fontSize: '11px' }}>{renderTrend(data.单帖互动量月环比)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  </div>
) : (
          <>
            {/* 概览卡片 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: THEME.cardBg, borderRadius: THEME.radius.md, padding: '20px', boxShadow: THEME.shadow, border: `1px solid ${THEME.border}` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: THEME.textSecondary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} color={THEME.primary} />总声量
                  </span>
                  <span style={{ fontSize: '32px', fontWeight: 700, color: THEME.textPrimary, letterSpacing: '-0.025em' }}>
                    {formatNumberWithCommas(Object.values(currentData).reduce((sum, item) => sum + (typeof item.声量 === 'number' ? item.声量 : 0), 0))}
                  </span>
                  <span style={{ fontSize: '12px', color: THEME.textTertiary, lineHeight: 1.4 }}>{selectedMonth || '本月'}KOL总发声次数</span>
                </div>
              </div>
              <div style={{ backgroundColor: THEME.cardBg, borderRadius: THEME.radius.md, padding: '20px', boxShadow: THEME.shadow, border: `1px solid ${THEME.border}` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: THEME.textSecondary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} color={THEME.success} />总互动量
                  </span>
                  <span style={{ fontSize: '32px', fontWeight: 700, color: THEME.textPrimary, letterSpacing: '-0.025em' }}>
                    {(Object.values(currentData).reduce((sum, item) => sum + (typeof item.互动量 === 'number' ? item.互动量 : 0), 0) / 10000).toFixed(1)}w
                  </span>
                  <span style={{ fontSize: '12px', color: THEME.textTertiary, lineHeight: 1.4 }}>{selectedMonth || '本月'}KOL总互动次数</span>
                </div>
              </div>
              <div style={{ backgroundColor: THEME.cardBg, borderRadius: THEME.radius.md, padding: '20px', boxShadow: THEME.shadow, border: `1px solid ${THEME.border}` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: THEME.textSecondary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={16} color={THEME.warning} />平均单帖互动
                  </span>
                  <span style={{ fontSize: '32px', fontWeight: 700, color: THEME.textPrimary, letterSpacing: '-0.025em' }}>
                    {(() => {
                      const total = Object.values(currentData).reduce((sum, item) => sum + (typeof item.单帖互动量 === 'number' ? item.单帖互动量 : 0), 0);
                      const count = Object.values(currentData).filter(item => typeof item.单帖互动量 === 'number' && item.单帖互动量 > 0).length;
                      return count > 0 ? formatNumberWithCommas(Math.round(total / count)) : '0';
                    })()}
                  </span>
                  <span style={{ fontSize: '12px', color: THEME.textTertiary, lineHeight: 1.4 }}>单条内容平均互动次数</span>
                </div>
              </div>
            </div>

            {/* 图表 */}
            <div style={{ backgroundColor: THEME.cardBg, borderRadius: THEME.radius.lg, padding: '24px', boxShadow: THEME.shadow, marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: THEME.textPrimary, marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={20} color={THEME.primary} />KOL表现对比
              </h2>
              <div style={{ height: '400px' }}>
                <ReactECharts ref={barChartRef} option={getEchartsBarOption()} style={{ width: '100%', height: '100%' }} opts={{ renderer: 'svg' }} />
              </div>
            </div>

            {/* KOL 卡片（动态） */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              {Object.entries(currentData).map(([tier, data]) => {
                const color = getTierColor(tier);
                return (
                  <div key={tier} style={{ backgroundColor: THEME.cardBg, borderRadius: THEME.radius.lg, padding: '24px', boxShadow: THEME.shadow, border: `1px solid ${THEME.border}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', backgroundColor: color }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: THEME.textPrimary, marginTop: 0, marginBottom: '4px' }}>{tier}</h3>
                      </div>
                      <div style={{ backgroundColor: `${color}15`, padding: '8px 12px', borderRadius: THEME.radius.sm, fontSize: '14px', fontWeight: 600, color: color }}>
                        {data.声量占比 !== '-' ? `${data.声量占比}%` : '-'}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ backgroundColor: THEME.background, borderRadius: THEME.radius.md, padding: '16px', border: `1px solid ${THEME.border}` }}>
                        <div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={12} />声量</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '20px', fontWeight: 700, color: THEME.textPrimary }}>{formatNumberWithCommas(data.声量)}</span>
                          {renderTrend(data.声量月环比)}
                        </div>
                      </div>
                      <div style={{ backgroundColor: THEME.background, borderRadius: THEME.radius.md, padding: '16px', border: `1px solid ${THEME.border}` }}>
                        <div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><MessageSquare size={12} />互动量</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '20px', fontWeight: 700, color: THEME.textPrimary }}>{formatNumberWithCommas(data.互动量)}</span>
                          {renderTrend(data.互动量月环比)}
                        </div>
                      </div>
                      <div style={{ gridColumn: 'span 2', backgroundColor: THEME.background, borderRadius: THEME.radius.md, padding: '16px', border: `1px solid ${THEME.border}` }}>
                        <div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={12} />单帖互动量</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '20px', fontWeight: 700, color: THEME.textPrimary }}>{formatNumberWithCommas(data.单帖互动量)}</span>
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