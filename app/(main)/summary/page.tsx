'use client'

import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, Users, ArrowUpRight, ArrowDownRight, Activity,
  ChevronDown, ChevronUp, CheckCircle, Download, Check, AlertCircle
} from 'lucide-react';
// 导入月份上下文（和 DefinitionPage 保持一致）
import { useMonthContext } from '../context/MonthContext';

// 主题配置（保持不变）
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
  shadow: '0 4px 6px -1 rgba(0, 0, 0, 0.1), 0 2px 4px -1 rgba(0, 0, 0, 0.06)',
  shadowHover: '0 10px 15px -3 rgba(0, 0, 0, 0.1), 0 4px 6px -2 rgba(0, 0, 0, 0.05)',
  radius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    xl: '24px'
  }
};

// 类型定义
interface PlatformSummary {
  platform: string;
  totalVoice: number;
  voiceMoM: number;
  totalInteraction: number;
  interactionMoM: number;
  sov: number;
  sovMoM: number;
  soe: number;
  soeMoM: number;
}

interface AnalysisItem {
  title: string;
  content: string[];
}

interface PlatformAnalysis {
  platform: string;
  moleculeAnalysis: AnalysisItem[];
  brandAnalysis: AnalysisItem[];
}

// 修复1：在 FeishuRecord 中添加 内容 字段定义
interface FeishuRecord {
  fields: {
    值?: string;
    分子式?: string;
    品牌?: string;
    分析指标?: string;
    拆分方式?: string;
    日期?: string;
    '数据抓取时间:'?: string;
    标题?: string;
    平台?: string;
    内容?: string; // 新增：添加缺失的 内容 字段
  };
  id: string;
  record_id: string;
}

interface KPISummaryRecord {
  fields: {
    内容?: string;
    分析指标?: string;
    平台?: string;
    日期?: string;
    '数据抓取时间:'?: string;
    标题?: string;
  };
  id: string;
  record_id: string;
}

// ======== 修复：通用化工具函数，兼容所有未来年份 ========
// 辅助函数：将月份字符串（如Aug-25、Jan-27）转换为可排序的日期对象
const parseMonthString = (monthStr: string): Date => {
  const [month, year] = monthStr.split('-');
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  const fullYear = parseInt(year, 10) + 2000;
  return new Date(fullYear, monthMap[month], 1);
};

// 辅助函数：标准化月份匹配
const normalizeMonthForMatch = (monthStr: string): string => {
  if (/^[A-Za-z]{3}-\d{2}$/.test(monthStr)) {
    return monthStr;
  }
  const monthMatch = monthStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}/);
  return monthMatch ? monthMatch[0] : monthStr;
};

// 默认空数据
const DEFAULT_EMPTY_DATA: PlatformSummary = {
  platform: '全平台',
  totalVoice: 0,
  voiceMoM: 0,
  totalInteraction: 0,
  interactionMoM: 0,
  sov: 0,
  sovMoM: 0,
  soe: 0,
  soeMoM: 0
};

// 默认平台分析数据（移除全平台）
const DEFAULT_PLATFORM_ANALYSIS: PlatformAnalysis[] = [
  {
    platform: '抖音',
    moleculeAnalysis: [{ title: '暂无数据', content: ['请选择有效月份查看分析数据'] }],
    brandAnalysis: [{ title: '暂无数据', content: ['请选择有效月份查看分析数据'] }]
  },
  {
    platform: '小红书',
    moleculeAnalysis: [{ title: '暂无数据', content: ['请选择有效月份查看分析数据'] }],
    brandAnalysis: [{ title: '暂无数据', content: ['请选择有效月份查看分析数据'] }]
  }
];

// 工具函数：解析数值
const parseValue = (value?: string): number => {
  if (!value) return 0;
  const cleanValue = value.replace(/[,，]/g, '').replace(/[^\d.%]/g, '');
  if (cleanValue.endsWith('%')) {
    return parseFloat(cleanValue.replace('%', '')) || 0;
  }
  const numericValue = parseFloat(cleanValue);
  return isNaN(numericValue) ? 0 : numericValue;
};

// 工具函数：计算环比
const calculateMoM = (current: number, previous: number): number => {
  if (previous === 0 || current === 0) return 0;
  const mom = ((current - previous) / previous) * 100;
  return parseFloat(mom.toFixed(1));
};

// 修复：获取上月（通用化，兼容所有未来年份）
const getPreviousMonthKey = (monthKey: string): string => {
  const date = parseMonthString(monthKey);
  date.setMonth(date.getMonth() - 1);

  const monthAbbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()];
  const yearShort = (date.getFullYear() % 100).toString().padStart(2, '0');
  return `${monthAbbr}-${yearShort}`;
};

// 修复：格式化显示月份（通用化，兼容所有未来年份）
const formatMonthDisplay = (monthKey: string): string => {
  const monthMap: Record<string, string> = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };

  const normalizedKey = normalizeMonthForMatch(monthKey);
  const [monthAbbr, yearShort] = normalizedKey.split('-');
  if (!monthAbbr || !yearShort) return monthKey;

  const fullYear = parseInt(yearShort, 10) + 2000;
  const monthNum = monthMap[monthAbbr] || '01';
  return `${fullYear}年${monthNum}月`;
};

// 格式化工具函数
const formatNumber = (num?: number): string => {
  if (num === undefined || num === null || isNaN(num) || num === 0) {
    return '-';
  }
  return num.toLocaleString('zh-CN');
};

const formatInteraction = (num?: number): string => {
  if (num === undefined || num === null || isNaN(num) || num === 0) {
    return '-';
  }
  return `${(num / 10000).toFixed(1)}w`;
};

const formatPercentage = (num?: number): string => {
  if (num === undefined || num === null || isNaN(num) || num === 0) {
    return '-';
  }
  return `${num}%`;
};

// 趋势指示器组件
const TrendIndicator = ({ value }: { value: number }) => {
  if (value === undefined || value === null || isNaN(value) || value === 0) {
    return <span style={{ color: '#9CA3AF' }}>-</span>;
  }
  if (value > 0) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', color: '#10B981', fontWeight: 500 }}>
        <ArrowUpRight size={14} style={{ marginRight: '4px' }} />
        {value}%
      </span>
    );
  } else {
    return (
      <span style={{ display: 'flex', alignItems: 'center', color: '#EF4444', fontWeight: 500 }}>
        <ArrowDownRight size={14} style={{ marginRight: '4px' }} />
        {Math.abs(value)}%
      </span>
    );
  }
};

// 可折叠卡片组件
const CollapsibleCard = ({
  title,
  icon: Icon,
  children,
  defaultOpen = true
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{
      background: THEME.cardBg,
      borderRadius: THEME.radius.lg,
      boxShadow: THEME.shadow,
      border: `1px solid ${THEME.border}`,
      marginBottom: '24px',
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '16px',
          fontWeight: 600,
          color: THEME.textPrimary,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = THEME.background;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icon size={20} color={THEME.primary} />
          <span>{title}</span>
        </div>
        {isOpen ?
          <ChevronUp size={20} color={THEME.textSecondary} /> :
          <ChevronDown size={20} color={THEME.textSecondary} />
        }
      </button>

      {isOpen && (
        <div style={{
          padding: '0 24px 24px',
          borderTop: `1px solid ${THEME.border}`
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

// 分析项组件
const AnalysisItem = ({ title, content }: { title: string; content: string[] }) => (
  <div style={{
    marginBottom: '16px',
    padding: '16px',
    background: THEME.background,
    borderRadius: THEME.radius.sm,
    border: `1px solid ${THEME.border}`
  }}>
    <h4 style={{
      fontSize: '15px',
      fontWeight: 600,
      color: THEME.primary,
      margin: '0 0 12px 0'
    }}>
      {title}
    </h4>
    {content.map((item, index) => (
      <div key={index} style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        marginBottom: '8px',
        lineHeight: 1.6
      }}>
        <CheckCircle size={14} color={THEME.success} style={{ marginTop: '2px' }} />
        <span style={{ color: THEME.textSecondary, fontSize: '14px' }}>
          {item}
        </span>
      </div>
    ))}
  </div>
);

// 核心指标卡片组件
const MetricCard = ({
  title,
  value,
  trend,
  label,
  tagType,
  tagText
}: {
  title: string;
  value: string;
  trend: number;
  label: string;
  tagType?: 'molecule' | 'brand';
  tagText?: string;
}) => {
  const tagStyle = {
    molecule: {
      color: THEME.primary,
      background: `${THEME.primary}10`
    },
    brand: {
      color: THEME.success,
      background: `${THEME.success}10`
    }
  };

  const borderColor = tagType === 'molecule' ? THEME.primary :
                      tagType === 'brand' ? THEME.success : THEME.border;

  return (
    <div style={{
      background: THEME.cardBg,
      borderRadius: THEME.radius.md,
      padding: '20px',
      boxShadow: THEME.shadow,
      transition: 'all 0.3s ease',
      border: `1px solid ${borderColor}`,
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = THEME.shadowHover;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = THEME.shadow;
    }}
    >
      {tagType && tagText && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          fontSize: '10px',
          fontWeight: 600,
          color: tagStyle[tagType].color,
          background: tagStyle[tagType].background,
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          {tagText}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{
          fontSize: '14px',
          fontWeight: 500,
          color: THEME.textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{
            fontSize: '32px',
            fontWeight: 700,
            color: THEME.textPrimary,
            letterSpacing: '-0.025em'
          }}>
            {value}
          </span>
          <TrendIndicator value={trend} />
        </div>
        <span style={{
          fontSize: '12px',
          color: THEME.textTertiary,
          lineHeight: 1.4
        }}>
          {label}
        </span>
      </div>
    </div>
  );
};

// ======== 主组件 ========
export default function SummaryPage() {
  // 从上下文获取选中的月份（格式：Jan-26 / Nov-25 / Jan-27）
  const { selectedMonth } = useMonthContext();

  // 格式化显示用的月份
  const displayMonth = useMemo(() => formatMonthDisplay(selectedMonth || 'Jan-26'), [selectedMonth]);
  // 获取上月标识
  const prevMonthKey = useMemo(() => getPreviousMonthKey(selectedMonth || 'Jan-26'), [selectedMonth]);
  // 上月显示格式
  const prevDisplayMonth = useMemo(() => formatMonthDisplay(prevMonthKey), [prevMonthKey]);

  // 状态管理
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [moleculeData, setMoleculeData] = useState<PlatformSummary>(DEFAULT_EMPTY_DATA);
  const [brandData, setBrandData] = useState<PlatformSummary>(DEFAULT_EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [platformAnalysisData, setPlatformAnalysisData] = useState<PlatformAnalysis[]>(DEFAULT_PLATFORM_ANALYSIS);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // 修复：筛选数据（完全复用 molecule 页面逻辑）
  const filterDataByMonth = (data: FeishuRecord[] | KPISummaryRecord[], monthKey: string) => {
    if (!monthKey || !data || data.length === 0) return [];

    const targetMonth = normalizeMonthForMatch(monthKey);
    const targetDisplayMonth = formatMonthDisplay(targetMonth);

    return data.filter(record => {
      const recordDate = record.fields['日期'] || '';
      const recordTime = record.fields['数据抓取时间:'] || '';

      return (
        normalizeMonthForMatch(recordDate) === targetMonth ||
        recordTime.includes(targetMonth) ||
        recordDate === targetDisplayMonth
      );
    });
  };

  // 获取核心数据
  const fetchAndParseData = async () => {
    try {
      setLoading(true);

      // 请求分子式数据
      const moleculeRes = await fetch('/api/feishu/records');
      if (!moleculeRes.ok) throw new Error('分子式接口请求失败');
      const moleculeDataAll: FeishuRecord[] = await moleculeRes.json();

      // 请求品牌数据
      const brandRes = await fetch('/api/feishu/recordsBrand');
      if (!brandRes.ok) throw new Error('品牌接口请求失败');
      const brandDataAll: FeishuRecord[] = await brandRes.json();

      // 筛选当前月和上月数据
      const currentMonthMoleculeData = filterDataByMonth(moleculeDataAll, selectedMonth || 'Jan-26');
      const prevMonthMoleculeData = filterDataByMonth(moleculeDataAll, prevMonthKey);

      const currentMonthBrandData = filterDataByMonth(brandDataAll, selectedMonth || 'Jan-26');
      const prevMonthBrandData = filterDataByMonth(brandDataAll, prevMonthKey);

      // 解析分子式数据
      const getMoleculeValue = (data: FeishuRecord[], indicator: string): number => {
        const indicatorRecords = data.filter(r => r.fields.分析指标 === indicator);
        return indicatorRecords.reduce((sum, record) => {
          const value = parseValue(record.fields.值);
          return sum + value;
        }, 0);
      };

      // 当前月数据
      const targetVoice = getMoleculeValue(currentMonthMoleculeData, '总声量');
      const targetInteraction = getMoleculeValue(currentMonthMoleculeData, '总互动量');
      const targetSOV = getMoleculeValue(currentMonthMoleculeData, 'SOV');
      const targetSOE = getMoleculeValue(currentMonthMoleculeData, 'SOE');

      // 上月数据（环比）
      const prevVoice = getMoleculeValue(prevMonthMoleculeData, '总声量');
      const prevInteraction = getMoleculeValue(prevMonthMoleculeData, '总互动量');
      const prevSOV = getMoleculeValue(prevMonthMoleculeData, 'SOV');
      const prevSOE = getMoleculeValue(prevMonthMoleculeData, 'SOE');

      const moleculeResult: PlatformSummary = {
        platform: '全平台',
        totalVoice: targetVoice,
        voiceMoM: calculateMoM(targetVoice, prevVoice),
        totalInteraction: targetInteraction,
        interactionMoM: calculateMoM(targetInteraction, prevInteraction),
        sov: targetSOV,
        sovMoM: calculateMoM(targetSOV, prevSOV),
        soe: targetSOE,
        soeMoM: calculateMoM(targetSOE, prevSOE)
      };

      // 解析品牌数据
      const getBrandValue = (data: FeishuRecord[], indicator: string): number => {
        const indicatorRecords = data.filter(r => r.fields.分析指标 === indicator);
        return indicatorRecords.reduce((sum, record) => {
          const value = parseValue(record.fields.值);
          return sum + value;
        }, 0);
      };

      const brandVoice = getBrandValue(currentMonthBrandData, '总声量');
      const brandInteraction = getBrandValue(currentMonthBrandData, '总互动量');
      const brandSOV = getBrandValue(currentMonthBrandData, 'SOV');
      const brandSOE = getBrandValue(currentMonthBrandData, 'SOE');

      const brandPrevVoice = getBrandValue(prevMonthBrandData, '总声量');
      const brandPrevInteraction = getBrandValue(prevMonthBrandData, '总互动量');
      const brandPrevSOV = getBrandValue(prevMonthBrandData, 'SOV');
      const brandPrevSOE = getBrandValue(prevMonthBrandData, 'SOE');

      const brandResult: PlatformSummary = {
        platform: '全平台',
        totalVoice: brandVoice,
        voiceMoM: calculateMoM(brandVoice, brandPrevVoice),
        totalInteraction: brandInteraction,
        interactionMoM: calculateMoM(brandInteraction, brandPrevInteraction),
        sov: brandSOV,
        sovMoM: calculateMoM(brandSOV, brandPrevSOV),
        soe: brandSOE,
        soeMoM: calculateMoM(brandSOE, brandPrevSOE)
      };

      // 更新状态
      setMoleculeData(moleculeResult);
      setBrandData(brandResult);

    } catch (err) {
      console.error('数据解析失败:', err);
      setMoleculeData(DEFAULT_EMPTY_DATA);
      setBrandData(DEFAULT_EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  };

  // 获取KPI分析数据
  const fetchKPISummaryData = async () => {
    try {
      setAnalysisLoading(true);
      const response = await fetch('/api/feishu/KPISummary');
      if (!response.ok) throw new Error('KPI总结数据获取失败');
      const data: KPISummaryRecord[] = await response.json();

      // 筛选当前月数据
      const filteredData = filterDataByMonth(data, selectedMonth || 'Jan-26');

      // 初始化分析数据结构（移除全平台）
      const analysisData: Record<string, {
        moleculeAnalysis: AnalysisItem[],
        brandAnalysis: AnalysisItem[]
      }> = {
        '抖音': { moleculeAnalysis: [], brandAnalysis: [] },
        '小红书': { moleculeAnalysis: [], brandAnalysis: [] }
      };

      // 处理数据
      filteredData.forEach(record => {
        const fields = record.fields || {};
        const platform = fields.平台 || '';
        const analysisType = fields.分析指标 || '';
        const content = fields.内容 || '';

        // 只处理抖音和小红书的数据
        if (!['抖音', '小红书'].includes(platform) || !analysisType || !content) return;
        const cleanContent = content.trim().split('\n').filter(Boolean);

        if (analysisType === '重点分子式') {
          analysisData[platform]?.moleculeAnalysis.push({
            title: `分析要点 ${analysisData[platform].moleculeAnalysis.length + 1}`,
            content: cleanContent
          });
        } else if (analysisType === '重点品牌') {
          analysisData[platform]?.brandAnalysis.push({
            title: `分析要点 ${analysisData[platform].brandAnalysis.length + 1}`,
            content: cleanContent
          });
        }
      });

      // 构建最终分析数据（移除全平台）
      const finalAnalysisData: PlatformAnalysis[] = [
        {
          platform: '抖音',
          moleculeAnalysis: analysisData['抖音'].moleculeAnalysis.length > 0
            ? analysisData['抖音'].moleculeAnalysis
            : [{ title: '暂无数据', content: [`未找到${displayMonth}的抖音分子式分析数据`] }],
          brandAnalysis: analysisData['抖音'].brandAnalysis.length > 0
            ? analysisData['抖音'].brandAnalysis
            : [{ title: '暂无数据', content: [`未找到${displayMonth}的抖音品牌分析数据`] }]
        },
        {
          platform: '小红书',
          moleculeAnalysis: analysisData['小红书'].moleculeAnalysis.length > 0
            ? analysisData['小红书'].moleculeAnalysis
            : [{ title: '暂无数据', content: [`未找到${displayMonth}的小红书分子式分析数据`] }],
          brandAnalysis: analysisData['小红书'].brandAnalysis.length > 0
            ? analysisData['小红书'].brandAnalysis
            : [{ title: '暂无数据', content: [`未找到${displayMonth}的小红书品牌分析数据`] }]
        }
      ];

      setPlatformAnalysisData(finalAnalysisData);

    } catch (err) {
      console.error('KPI总结数据解析失败:', err);
      setPlatformAnalysisData(DEFAULT_PLATFORM_ANALYSIS);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // 监听月份变化，刷新数据（增加防抖）
  useEffect(() => {
    if (selectedMonth) {
      const timer = setTimeout(() => {
        fetchAndParseData();
        fetchKPISummaryData();

        // 调试日志
        console.log('SummaryPage - 选中的月份Key:', selectedMonth);
        console.log('SummaryPage - 显示月份:', displayMonth);
        console.log('SummaryPage - 上月Key:', prevMonthKey);
        console.log('SummaryPage - 上月显示:', prevDisplayMonth);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [selectedMonth, prevMonthKey]);

  // 初始化加载
  useEffect(() => {
    fetchAndParseData();
    fetchKPISummaryData();
  }, []);

  // 复制/导出功能
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

  const handleExportToExcel = async () => {
    try {
      const headers = ['维度', '平台', '统计月份', '总声量', '声量环比(%)', '总互动量', '互动量环比(%)', 'SOV(%)', 'SOV环比(%)', 'SOE(%)', 'SOE环比(%)'];
      const rows = [headers.join('\t')];

      // 修复2：调整对象构建顺序，避免 platform 重复定义
      // 将扩展运算符放在前面，手动定义的属性放在后面（这样不会被覆盖）
      const exportData = [
        {
          ...moleculeData, // 先扩展原有数据
          dimension: '分子式',
          platform: '氮䓬斯汀氟替卡松', // 后定义 platform，覆盖原有值
          month: displayMonth
        },
        {
          ...brandData, // 先扩展原有数据
          dimension: '品牌',
          platform: '迪敏思', // 后定义 platform，覆盖原有值
          month: displayMonth
        }
      ];

      exportData.forEach(item => {
        const row = [
          item.dimension,
          item.platform,
          item.month,
          item.totalVoice || '-',
          item.voiceMoM ? `${item.voiceMoM}` : '-',
          item.totalInteraction || '-',
          item.interactionMoM ? `${item.interactionMoM}` : '-',
          item.sov ? `${item.sov}` : '-',
          item.sovMoM ? `${item.sovMoM}` : '-',
          item.soe ? `${item.soe}` : '-',
          item.soeMoM ? `${item.soeMoM}` : '-'
        ];
        rows.push(row.join('\t'));
      });

      const success = await copyToClipboard(rows.join('\n'));
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

  // 加载状态
  if (loading) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        background: THEME.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        <div style={{
          fontSize: '18px',
          color: THEME.textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #6366F1',
            borderBottomColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          正在加载{displayMonth}数据...
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

  // 页面渲染
  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: THEME.background,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* 页面头部 */}
      <div style={{
        background: THEME.cardBg,
        borderBottom: `1px solid ${THEME.border}`,
        padding: '32px 24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: THEME.textPrimary,
                margin: 0,
                marginBottom: '8px'
              }}>
                {displayMonth} 数据总览
              </h1>
              <p style={{
                fontSize: '14px',
                color: THEME.textSecondary,
                margin: 0,
                lineHeight: 1.6
              }}>
                全平台声量、互动量、SOV、SOE及趋势分析（环比对比：{prevDisplayMonth}）
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleExportToExcel}
                disabled={exportStatus !== 'idle'}
                style={{
                  background: `${THEME.primary}10`,
                  color: THEME.primary,
                  border: `1px solid ${THEME.primary}20`,
                  borderRadius: THEME.radius.md,
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: exportStatus === 'idle' ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  opacity: exportStatus === 'idle' ? 1 : 0.8
                }}
              >
                {exportStatus === 'success' ? (
                  <>
                    <Check size={18} color={THEME.success} />
                    复制成功！可粘贴到Excel
                  </>
                ) : exportStatus === 'error' ? (
                  <>
                    <AlertCircle size={18} color={THEME.danger} />
                    复制失败
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    复制{displayMonth}数据
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div style={{
        maxWidth: '1200px',
        margin: '20px auto 0',
        padding: '0 24px 40px'
      }}>
        {/* 核心指标卡片 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* 分子式指标 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            <MetricCard
              title="总声量"
              value={formatNumber(moleculeData.totalVoice)}
              trend={moleculeData.voiceMoM || 0}
              label={`较${prevDisplayMonth}环比变化`}
              tagType="molecule"
              tagText="氮䓬斯汀氟替卡松"
            />
            <MetricCard
              title="总互动量"
              value={formatInteraction(moleculeData.totalInteraction)}
              trend={moleculeData.interactionMoM || 0}
              label={`较${prevDisplayMonth}环比变化`}
              tagType="molecule"
              tagText="氮䓬斯汀氟替卡松"
            />
            <MetricCard
              title="SOV"
              value={formatPercentage(moleculeData.sov)}
              trend={moleculeData.sovMoM || 0}
              label={`较${prevDisplayMonth}环比变化`}
              tagType="molecule"
              tagText="氮䓬斯汀氟替卡松"
            />
            <MetricCard
              title="SOE"
              value={formatPercentage(moleculeData.soe)}
              trend={moleculeData.soeMoM || 0}
              label={`较${prevDisplayMonth}环比变化`}
              tagType="molecule"
              tagText="氮䓬斯汀氟替卡松"
            />
          </div>

          {/* 品牌指标 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            <MetricCard
              title="总声量"
              value={formatNumber(brandData.totalVoice)}
              trend={brandData.voiceMoM || 0}
              label={`较${prevDisplayMonth}环比变化`}
              tagType="brand"
              tagText="迪敏思"
            />
            <MetricCard
              title="总互动量"
              value={formatInteraction(brandData.totalInteraction)}
              trend={brandData.interactionMoM || 0}
              label={`较${prevDisplayMonth}环比变化`}
              tagType="brand"
              tagText="迪敏思"
            />
            <MetricCard
              title="SOV"
              value={formatPercentage(brandData.sov)}
              trend={brandData.sovMoM || 0}
              label={`较${prevDisplayMonth}环比变化`}
              tagType="brand"
              tagText="迪敏思"
            />
            <MetricCard
              title="SOE"
              value={formatPercentage(brandData.soe)}
              trend={brandData.soeMoM || 0}
              label={`较${prevDisplayMonth}环比变化`}
              tagType="brand"
              tagText="迪敏思"
            />
          </div>
        </div>

        {/* 平台分析（只保留抖音和小红书） */}
        {platformAnalysisData.map((platformData, index) => (
          <CollapsibleCard
            key={index}
            title={`${platformData.platform}平台分析（${displayMonth}）`}
            icon={Users}
            defaultOpen={index === 0}
          >
            {analysisLoading ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: THEME.textSecondary
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #6366F1',
                  borderBottomColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                加载分析数据中...
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '24px',
                marginTop: '16px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: THEME.primary,
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Activity size={18} />
                    重点分子式分析
                  </h3>
                  {platformData.moleculeAnalysis.map((item, idx) => (
                    <AnalysisItem
                      key={idx}
                      title={item.title}
                      content={item.content}
                    />
                  ))}
                </div>

                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: THEME.success,
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Activity size={18} />
                    重点品牌分析
                  </h3>
                  {platformData.brandAnalysis.map((item, idx) => (
                    <AnalysisItem
                      key={idx}
                      title={item.title}
                      content={item.content}
                    />
                  ))}
                </div>
              </div>
            )}
          </CollapsibleCard>
        ))}
      </div>
    </div>
  );
}