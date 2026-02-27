'use client'

import { useState, useMemo, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  TrendingUp, Users, Eye, AlertCircle, Download, Check,
  ArrowUpRight, ArrowDownRight, Activity,
  BarChart2, PieChart, MessageSquare
} from 'lucide-react';

// 定义类型接口，解决 TypeScript 类型检查问题
interface TierData {
  声量: number | '-';
  声量占比: number | '-';
  声量月环比: number | '-';
  互动量: number | '-';
  互动量占比: number | '-';
  互动量月环比: number | '-';
  单帖互动量: number | '-';
  单帖互动量月环比: number | '-';
}

interface MoleculeData {
  超头部: TierData;
  头部: TierData;
  腰部: TierData;
  尾部: TierData;
  KOC: TierData;
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
  };
  id: string;
  record_id: string;
}

// 达人等级映射（适配接口中的"肩部"等字段）
const TIER_MAPPING: Record<string, string> = {
  '超头部': '超头部',
  '头部': '头部',
  '肩部': '腰部',    // 接口中的肩部对应原页面的腰部
  '腰部': '尾部',    // 接口中的腰部对应原页面的尾部
  '尾部': 'KOC',     // 接口中的尾部对应原页面的KOC
};

// 筛选标题常量
const FILTER_TITLE = "分子式KOL投放矩阵（抖音）";

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

// 达人等级颜色配置
const TIER_COLORS: Record<string, string> = {
  '超头部': '#EF4444',
  '头部': '#F59E0B',
  '腰部': '#10B981',
  '尾部': '#3B82F6',
  'KOC': '#6366F1'
};

// 工具函数：清理数字格式（移除逗号、百分号）
const cleanNumber = (value: string): number | '-' => {
  if (!value || value === '-') return '-';

  // 移除逗号、百分号，处理小数
  const cleaned = value.replace(/,/g, '').replace(/%/g, '');
  const num = parseFloat(cleaned);

  // 如果是环比数据（小数），转换为百分比显示
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
    // 降级方案：创建临时textarea
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

export default function KOLMatrixPage() {
  // 状态管理
  const [kolData, setKolData] = useState<Record<string, MoleculeData>>({});
  const [activeMolecule, setActiveMolecule] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // 新增：导出状态
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // ECharts 实例引用
  const barChartRef = useRef<any>(null);

  // 从API获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/feishu/DOUYINMoleculeKOL');

        if (!response.ok) {
          throw new Error(`HTTP错误，状态码：${response.status}`);
        }

        // 显式指定 rawData 类型
        const rawData: ApiRecord[] = await response.json();

        // 核心修改：筛选出标题为"分子式KOL投放矩阵（抖音）"的记录
        const filteredData: ApiRecord[] = rawData.filter((item) =>
          item.fields.标题 === FILTER_TITLE
        );

        // 如果筛选后没有数据，抛出提示
        if (filteredData.length === 0) {
          throw new Error(`未找到标题为"${FILTER_TITLE}"的数据`);
        }

        // 处理数据，转换为页面需要的格式
        const formattedData: Record<string, MoleculeData> = {};

        // ========== 核心修复：分步处理，彻底解决类型问题 ==========
        // 步骤1：提取所有分子式并去重（完全显式的类型声明）
        const allMolecules: string[] = [];
        for (const item of filteredData) {
          const mol = item.fields.分子式.trim();
          if (mol && mol !== '') {
            if (!allMolecules.includes(mol)) {
              allMolecules.push(mol);
            }
          }
        }

        // 步骤2：使用明确的字符串数组（彻底解决 unknown 类型问题）
        const molecules: string[] = allMolecules;

        // 初始化所有分子式的基础结构
        for (const molecule of molecules) {
          // 明确 molecule 是 string 类型，可安全作为索引
          formattedData[molecule] = {
            超头部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
            头部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
            腰部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
            尾部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
            KOC: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
          };
        }

        // 填充筛选后的数据
        for (const item of filteredData) {
          const { fields } = item;
          const molecule = fields.分子式.trim();
          const tier = TIER_MAPPING[fields.达人量级] || fields.达人量级;

          if (formattedData[molecule] && formattedData[molecule][tier as keyof MoleculeData]) {
            formattedData[molecule][tier as keyof MoleculeData] = {
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

        // 设置默认选中的分子式（添加类型保护）
        if (molecules.length > 0) {
          const firstMolecule: string = molecules[0] as string;
          setActiveMolecule(firstMolecule);
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

    fetchData();
  }, []);

  // 当前选中分子式的数据
  const currentData = useMemo(() => {
    if (!activeMolecule || !kolData[activeMolecule]) {
      return {
        超头部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
        头部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
        腰部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
        尾部: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
        KOC: { 声量: '-', 声量占比: '-', 声量月环比: '-', 互动量: '-', 互动量占比: '-', 互动量月环比: '-', 单帖互动量: '-', 单帖互动量月环比: '-' },
      };
    }
    return kolData[activeMolecule];
  }, [activeMolecule, kolData]);

  // 新增：生成Excel格式数据
  const generateExcelData = () => {
    // 表头
    const headers = [
      '分子式', '达人等级', '声量', '声量占比(%)', '声量月环比(%)',
      '互动量', '互动量占比(%)', '互动量月环比(%)', '单帖互动量', '单帖互动量月环比(%)'
    ];

    // 构建数据行
    const rows = [headers.join('\t')]; // 使用制表符分隔，适合Excel

    // 遍历所有分子式
    Object.entries(kolData).forEach(([molecule, tierData]) => {
      // 遍历每个达人等级
      Object.entries(tierData).forEach(([tier, data]) => {
        const row = [
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

    // 添加汇总行
    rows.push(''); // 空行分隔
    rows.push(['汇总数据', '', '', '', '', '', '', '', '', ''].join('\t'));

    // 为当前选中的分子式添加汇总
    const totalVoice = Object.values(currentData).reduce((sum, item) => sum + (Number(item.声量) || 0), 0);
    const totalInteract = Object.values(currentData).reduce((sum, item) => sum + (Number(item.互动量) || 0), 0);
    const avgPerPost = (() => {
      const total = Object.values(currentData).reduce((sum, item) => sum + (Number(item.单帖互动量) || 0), 0);
      const count = Object.values(currentData).filter(item => Number(item.单帖互动量) > 0).length;
      return count > 0 ? Math.round(total / count) : 0;
    })();

    rows.push([
      activeMolecule,
      '总计',
      totalVoice,
      '100',
      '',
      totalInteract,
      '100',
      '',
      avgPerPost,
      ''
    ].join('\t'));

    return rows.join('\n');
  };

  // 新增：处理导出到Excel
  const handleExportToExcel = async () => {
    try {
      const excelData = generateExcelData();
      const success = await copyToClipboard(excelData);

      if (success) {
        setExportStatus('success');
        // 3秒后重置状态
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
    const tiers = Object.keys(currentData) as Array<keyof MoleculeData>;
    const voiceData = tiers.map(tier => Number(currentData[tier].声量) || 0);
    const interactData = tiers.map(tier => Number(currentData[tier].互动量) || 0);

    return {
      tiers,
      voiceData,
      interactData
    };
  }, [currentData]);

  // 获取 ECharts 配置项（彻底移除 boxShadow）
  const getEchartsBarOption = (): EChartsOption => {
    const { tiers, voiceData, interactData } = chartData;

    return {
      title: {
        text: `KOL/KOC表现对比（${activeMolecule}）`,
        left: 'center',
        top: 15,
        textStyle: {
          fontSize: 15,
          fontWeight: 600,
          color: '#1e293b',
          fontFamily: 'Inter, sans-serif'
        }
      },
      // ========== 修复：移除不支持的 boxShadow 属性 ==========
      tooltip: {
        trigger: 'axis',
        formatter: '{b}：{c}',
        textStyle: { fontSize: 13 },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(84, 112, 198, 0.1)'
          }
        }
      },
      legend: {
        data: ['声量', '互动量'],
        orient: 'horizontal',
        left: 'center',
        top: 45,
        textStyle: {
          fontSize: 13,
          color: '#475569',
          fontFamily: 'Inter, sans-serif'
        },
        itemGap: 18,
        itemWidth: 14,
        itemHeight: 14
      },
      xAxis: {
        type: 'category',
        data: tiers,
        axisLabel: {
          fontSize: 13,
          fontWeight: 500,
          rotate: 0,
          interval: 0,
          color: '#475569'
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 1
          }
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: { color: '#e2e8f0' }
        },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 13,
          color: '#475569'
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 1
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            width: 1
          }
        },
        name: '数值',
        nameTextStyle: {
          fontSize: 13,
          color: '#475569'
        },
        nameGap: 15
      },
      grid: {
        left: '8%',
        right: '8%',
        bottom: '12%',
        top: '18%',
        containLabel: true
      },
      series: [
        {
          name: '声量',
          type: 'bar',
          data: voiceData,
          barWidth: '35%',
          itemStyle: {
            color: function(params: { dataIndex: number }) {
              return TIER_COLORS[tiers[params.dataIndex]] || '#5470c6';
            },
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
            fontFamily: 'Inter, sans-serif'
          },
          emphasis: {
            itemStyle: {
              opacity: 0.9
            }
          }
        },
        {
          name: '互动量',
          type: 'bar',
          data: interactData,
          barWidth: '35%',
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
            fontFamily: 'Inter, sans-serif'
          },
          emphasis: {
            itemStyle: {
              color: '#91cc75',
              opacity: 0.9
            }
          }
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

  // 渲染趋势指示器
  const renderTrend = (value: number | string) => {
    if (value === '-' || value === 0) return <span className="text-gray-400">-</span>;
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
    return <span className="text-gray-400">0%</span>;
  };

  // 加载状态显示
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
          <p style={{ color: THEME.textSecondary, fontSize: '16px' }}>加载数据中...</p>
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

  // 错误状态显示
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
          <h3 style={{
            color: THEME.textPrimary,
            fontSize: '18px',
            fontWeight: 600,
            margin: '0 0 8px'
          }}>数据加载失败</h3>
          <p style={{ color: THEME.textSecondary, margin: '0 0 24px' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
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

  // 无数据状态显示
  if (Object.keys(kolData).length === 0) {
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
          <p style={{ color: THEME.textSecondary, fontSize: '16px' }}>暂无可用数据</p>
        </div>
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
                【红书】重点分子式KOL/KOC投放矩阵
              </h1>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0,
                lineHeight: 1.6
              }}>
                深度分析小红书平台重点分子式药品的KOL/KOC投放表现，洞察声量与互动趋势
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {/* 新增：导出到Excel按钮 */}
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
                  if (exportStatus === 'idle') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (exportStatus === 'idle') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
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
      <div style={{
        maxWidth: '1200px',
        margin: '20px auto 0',
        padding: '0 24px'
      }}>
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
                  {Object.values(currentData).reduce((sum, item) => sum + (Number(item.声量) || 0), 0)}
                </span>
              </div>
              <span style={{
                fontSize: '12px',
                color: THEME.textTertiary,
                lineHeight: 1.4
              }}>
                本月KOL/KOC总发声次数
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
                  {(Object.values(currentData).reduce((sum, item) => sum + (Number(item.互动量) || 0), 0) / 10000).toFixed(1)}w
                </span>
              </div>
              <span style={{
                fontSize: '12px',
                color: THEME.textTertiary,
                lineHeight: 1.4
              }}>
                本月KOL/KOC总互动次数
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
                    const total = Object.values(currentData).reduce((sum, item) => sum + (Number(item.单帖互动量) || 0), 0);
                    const count = Object.values(currentData).filter(item => Number(item.单帖互动量) > 0).length;
                    return count > 0 ? Math.round(total / count).toLocaleString() : '0';
                  })()}
                </span>
              </div>
              <span style={{
                fontSize: '12px',
                color: THEME.textTertiary,
                lineHeight: 1.4
              }}>
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
            KOL/KOC表现对比
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

        {/* KOL/KOC 卡片网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {Object.entries(currentData).map(([tier, data]) => (
            <div
              key={tier}
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
              {/* 顶部装饰条 */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: TIER_COLORS[tier as keyof typeof TIER_COLORS] || THEME.primary
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: THEME.textPrimary,
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    {tier}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: THEME.textTertiary,
                    margin: 0
                  }}>
                    {tier === '超头部' && '(粉丝数≥50w)'}
                    {tier === '头部' && '(30w≤粉丝数<50w)'}
                    {tier === '腰部' && '(10w≤粉丝数<30w)'}
                    {tier === '尾部' && '(1w≤粉丝数<10w)'}
                    {tier === 'KOC' && '(3k≤粉丝数<1w)'}
                  </p>
                </div>
                <div style={{
                  background: `${TIER_COLORS[tier as keyof typeof TIER_COLORS] || THEME.primary}15`,
                  padding: '8px 12px',
                  borderRadius: THEME.radius.sm,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: TIER_COLORS[tier as keyof typeof TIER_COLORS] || THEME.primary
                }}>
                  {data.声量占比 !== '-' ? `${data.声量占比}%` : '-'}
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
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: THEME.textPrimary
                    }}>
                      {data.声量 !== '-' ? data.声量 : '-'}
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
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: THEME.textPrimary
                    }}>
                      {data.互动量 !== '-' ? (Number(data.互动量) > 10000 ? `${(Number(data.互动量)/10000).toFixed(1)}w` : data.互动量) : '-'}
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
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: THEME.textPrimary
                    }}>
                      {data.单帖互动量 !== '-' ? data.单帖互动量 : '-'}
                    </span>
                    {renderTrend(data.单帖互动量月环比)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 页脚说明 - 新增导出说明 */}
        <div style={{
          background: THEME.cardBg,
          borderRadius: THEME.radius.md,
          padding: '20px',
          marginBottom: '24px',
          boxShadow: THEME.shadow
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <AlertCircle size={20} color={THEME.primary} />
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: '13px',
                color: THEME.textSecondary,
                margin: 0,
                lineHeight: 1.6
              }}>
                <strong>数据说明：</strong>本数据基于小红书平台KOL/KOC投放表现统计，声量指内容发布数量，互动量指点赞、评论、收藏等用户行为总和。"-" 表示该等级本月无有效数据。
                <br />
                <strong>数据范围：</strong>仅展示标题为"{FILTER_TITLE}"的记录
                <br />
                <strong>导出说明：</strong>点击页面顶部的「导出全部数据到Excel」按钮，可将所有数据复制到剪贴板，直接粘贴到Excel/表格软件中即可使用（制表符分隔格式）。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}