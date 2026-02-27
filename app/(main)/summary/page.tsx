'use client'

import { useState, useMemo, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  TrendingUp, Users, Eye, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity,
  BarChart2, PieChart, MessageSquare,
  ChevronDown, ChevronUp, CheckCircle,
  Download, Check, Search, Target
} from 'lucide-react';

// 复用原有主题配置，保持视觉一致性
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

// 定义数据类型
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

interface TrendData {
  month: string;
  totalVoice: number;
  totalInteraction: number;
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

// 模拟数据（可替换为真实API数据）
const MOCK_DATA = {
  // 全平台汇总数据
  platformSummary: [
    {
      platform: '全平台',
      totalVoice: 125680,
      voiceMoM: 8.2,
      totalInteraction: 3256800,
      interactionMoM: 12.5,
      sov: 42.3,
      sovMoM: 3.1,
      soe: 38.7,
      soeMoM: 4.2
    },
    {
      platform: '抖音',
      totalVoice: 68520,
      voiceMoM: 15.3,
      totalInteraction: 1852000,
      interactionMoM: 18.7,
      sov: 45.2,
      sovMoM: 5.8,
      soe: 42.1,
      soeMoM: 6.3
    },
    {
      platform: '小红书',
      totalVoice: 57160,
      voiceMoM: -2.1,
      totalInteraction: 1404800,
      interactionMoM: 5.2,
      sov: 39.4,
      sovMoM: -1.2,
      soe: 35.3,
      soeMoM: 2.1
    }
  ] as PlatformSummary[],

  // 趋势数据（近6个月）
  trendData: [
    { month: '2025-06', totalVoice: 85200, totalInteraction: 2156000 },
    { month: '2025-07', totalVoice: 92500, totalInteraction: 2385000 },
    { month: '2025-08', totalVoice: 98700, totalInteraction: 2568000 },
    { month: '2025-09', totalVoice: 105200, totalInteraction: 2752000 },
    { month: '2025-10', totalVoice: 116200, totalInteraction: 2895000 },
    { month: '2025-11', totalVoice: 125680, totalInteraction: 3256800 }
  ] as TrendData[],

  // 平台分析数据（来自用户提供的表格）
  platformAnalysis: [
    {
      platform: '抖音',
      moleculeAnalysis: [
        {
          title: '氮卓斯汀氟替卡松',
          content: ['在迪敏思的推动下，声量较上月明显提升。']
        },
        {
          title: '糠酸莫米松',
          content: ['本月出现大量无品牌HCP的投放，推动分子式整体互动量明显提升。']
        },
        {
          title: '竞品表现',
          content: ['除糠酸莫米松外，其余竞品分子式本月的讨论声量均出现小幅度下滑。']
        }
      ],
      brandAnalysis: [
        {
          title: '迪敏思',
          content: [
            '本月新增大量孵化期的医生博主，带动品牌声量明显增长',
            '其品牌互动量在各竞品品牌中持续占据主导地位'
          ]
        },
        {
          title: '其他品牌',
          content: ['其余品牌本月未进行品牌投放动作，主要讨论声量均集中于UGC中。']
        }
      ]
    },
    {
      platform: '小红书',
      moleculeAnalysis: [
        {
          title: '氮卓斯汀氟替卡松',
          content: [
            '声量及互动量份额持续稳步增长',
            '本月互动量份额超过糠酸莫米松，跃居第二'
          ]
        },
        {
          title: '糠酸莫米松 & 布地奈德',
          content: [
            '糠酸莫米松声量与上月持平',
            '布地奈德声量呈小幅下滑',
            '二者仍占据品类声量份额主导地位'
          ]
        }
      ],
      brandAnalysis: [
        {
          title: '舒霏敏',
          content: ['本月加码KOL及KOC的投放力度，推动品牌整体互动量大幅上升。']
        },
        {
          title: '开瑞坦 & 辅舒良',
          content: ['本月未采取明显的投放动作，品牌整体互动量维持在较低水平。']
        }
      ]
    }
  ] as PlatformAnalysis[]
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

// 趋势指示器组件
const TrendIndicator = ({ value }: { value: number }) => {
  if (value === 0) return <span className="text-gray-400">0%</span>;
  if (value > 0) {
    return (
      <span className="flex items-center text-green-600 font-medium">
        <ArrowUpRight size={14} className="mr-1" />
        {value}%
      </span>
    );
  } else {
    return (
      <span className="flex items-center text-red-600 font-medium">
        <ArrowDownRight size={14} className="mr-1" />
        {Math.abs(value)}%
      </span>
    );
  }
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
        <CheckCircle size={14} color={THEME.success} style={{ marginTop: '4px' }} />
        <span style={{ color: THEME.textSecondary, fontSize: '14px' }}>
          {item}
        </span>
      </div>
    ))}
  </div>
);

export default function SummaryPage() {
  // 状态管理
  const [activePlatform, setActivePlatform] = useState<string>('全平台');
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 当前选中平台的数据
  const currentSummary = useMemo(() => {
    return MOCK_DATA.platformSummary.find(item => item.platform === activePlatform) || MOCK_DATA.platformSummary[0];
  }, [activePlatform]);

  // 生成ECharts配置
  const getTrendChartOption = (): EChartsOption => {
    const months = MOCK_DATA.trendData.map(item => item.month);
    const voiceData = MOCK_DATA.trendData.map(item => item.totalVoice);
    const interactionData = MOCK_DATA.trendData.map(item => item.totalInteraction);

    return {
      title: {
        text: `全平台声量与互动量趋势（${activePlatform}）`,
        left: 'center',
        top: 15,
        textStyle: {
          fontSize: 15,
          fontWeight: 600,
          color: '#1e293b',
          fontFamily: 'Inter, sans-serif'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        textStyle: { fontSize: 13 },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10
      },
      legend: {
        data: ['总声量', '总互动量'],
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
        data: months,
        axisLabel: {
          fontSize: 13,
          fontWeight: 500,
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
      yAxis: [
        {
          type: 'value',
          name: '总声量',
          position: 'left',
          axisLabel: {
            fontSize: 13,
            color: THEME.primary,
            formatter: '{value}'
          },
          axisLine: {
            lineStyle: {
              color: THEME.primary,
              width: 1
            }
          },
          splitLine: {
            lineStyle: {
              color: '#f1f5f9',
              width: 1
            }
          }
        },
        {
          type: 'value',
          name: '总互动量',
          position: 'right',
          axisLabel: {
            fontSize: 13,
            color: THEME.success,
            formatter: function(value: number) {
              return (value / 10000).toFixed(1) + 'w';
            }
          },
          axisLine: {
            lineStyle: {
              color: THEME.success,
              width: 1
            }
          },
          splitLine: { show: false }
        }
      ],
      grid: {
        left: '8%',
        right: '8%',
        bottom: '12%',
        top: '18%',
        containLabel: true
      },
      series: [
        {
          name: '总声量',
          type: 'line',
          data: voiceData,
          smooth: true,
          itemStyle: {
            color: THEME.primary
          },
          lineStyle: {
            width: 2
          },
          emphasis: {
            itemStyle: {
              color: THEME.primaryDark,
              borderWidth: 2
            }
          }
        },
        {
          name: '总互动量',
          type: 'line',
          yAxisIndex: 1,
          data: interactionData,
          smooth: true,
          itemStyle: {
            color: THEME.success
          },
          lineStyle: {
            width: 2
          },
          emphasis: {
            itemStyle: {
              color: '#059669',
              borderWidth: 2
            }
          }
        }
      ],
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    };
  };

  // 复制到剪贴板工具函数
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

  // 处理导出到Excel
  const handleExportToExcel = async () => {
    try {
      const headers = ['平台', '总声量', '声量环比', '总互动量', '互动量环比', 'SOV', 'SOV环比', 'SOE', 'SOE环比'];
      const rows = [headers.join('\t')];

      MOCK_DATA.platformSummary.forEach(item => {
        const row = [
          item.platform,
          item.totalVoice,
          `${item.voiceMoM}%`,
          item.totalInteraction,
          `${item.interactionMoM}%`,
          `${item.sov}%`,
          `${item.sovMoM}%`,
          `${item.soe}%`,
          `${item.soeMoM}%`
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

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: THEME.background,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* 页面头部 - 修改为简洁样式 */}
      <div style={{
        background: THEME.cardBg, // 简洁的白色背景
        borderBottom: `1px solid ${THEME.border}`, // 底部浅灰边框
        padding: '32px 24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' // 轻微阴影增加层次感
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: THEME.textPrimary, // 改为深色文字
                margin: 0,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>

                数据总览
              </h1>
              <p style={{
                fontSize: '14px',
                color: THEME.textSecondary, // 浅灰色描述文字
                margin: 0,
                lineHeight: 1.6
              }}>
                全平台声量、互动量、SOV、SOE及趋势分析
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {/* 导出按钮 - 调整为简洁样式 */}
              <button
                onClick={handleExportToExcel}
                disabled={exportStatus !== 'idle'}
                style={{
                  background: `${THEME.primary}10`, // 主题色浅背景
                  color: THEME.primary, // 主题色文字
                  border: `1px solid ${THEME.primary}20`, // 浅色边框
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
                onMouseEnter={(e) => {
                  if (exportStatus === 'idle') {
                    e.currentTarget.style.background = `${THEME.primary}20`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (exportStatus === 'idle') {
                    e.currentTarget.style.background = `${THEME.primary}10`;
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

                    复制数据到Excel
                  </>
                )}
              </button>

              {/* 平台选择器 - 调整为简洁样式 */}
              <div style={{
                background: THEME.background, // 浅灰背景
                padding: '8px 16px',
                borderRadius: THEME.radius.md,
                border: `1px solid ${THEME.border}` // 浅灰边框
              }}>
                <select
                  value={activePlatform}
                  onChange={(e) => setActivePlatform(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: THEME.textPrimary, // 深色文字
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '180px'
                  }}
                >
                  {MOCK_DATA.platformSummary.map((item) => (
                    <option key={item.platform} value={item.platform} style={{ color: '#111827' }}>
                      {item.platform}
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


        {/* 核心指标卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* 总声量 */}
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

                总声量
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: THEME.textPrimary,
                  letterSpacing: '-0.025em'
                }}>
                  {currentSummary.totalVoice.toLocaleString()}
                </span>
                <TrendIndicator value={currentSummary.voiceMoM} />
              </div>
              <span style={{
                fontSize: '12px',
                color: THEME.textTertiary,
                lineHeight: 1.4
              }}>
                较上月环比变化
              </span>
            </div>
          </div>

          {/* 总互动量 */}
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

                总互动量
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: THEME.textPrimary,
                  letterSpacing: '-0.025em'
                }}>
                  {(currentSummary.totalInteraction / 10000).toFixed(1)}w
                </span>
                <TrendIndicator value={currentSummary.interactionMoM} />
              </div>
              <span style={{
                fontSize: '12px',
                color: THEME.textTertiary,
                lineHeight: 1.4
              }}>
                较上月环比变化
              </span>
            </div>
          </div>

          {/* SOV */}
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

                SOV（声量份额）
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: THEME.textPrimary,
                  letterSpacing: '-0.025em'
                }}>
                  {currentSummary.sov}%
                </span>
                <TrendIndicator value={currentSummary.sovMoM} />
              </div>
              <span style={{
                fontSize: '12px',
                color: THEME.textTertiary,
                lineHeight: 1.4
              }}>
                较上月环比变化
              </span>
            </div>
          </div>

          {/* SOE */}
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

                SOE（互动量份额）
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: THEME.textPrimary,
                  letterSpacing: '-0.025em'
                }}>
                  {currentSummary.soe}%
                </span>
                <TrendIndicator value={currentSummary.soeMoM} />
              </div>
              <span style={{
                fontSize: '12px',
                color: THEME.textTertiary,
                lineHeight: 1.4
              }}>
                较上月环比变化
              </span>
            </div>
          </div>
        </div>


        <CollapsibleCard
          title="声量与互动量趋势"
          icon={TrendingUp}
          defaultOpen={true}
        >
          <div style={{ height: '400px' }}>
            <ReactECharts
              option={getTrendChartOption()}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </CollapsibleCard>

        {/* 平台分析模块 */}
        {MOCK_DATA.platformAnalysis.map((platformData, index) => (
          <CollapsibleCard
            key={index}
            title={`${platformData.platform}平台分析`}
            icon={Users}
            defaultOpen={true}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '24px',
              marginTop: '16px'
            }}>
              {/* 重点分子式分析 */}
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

              {/* 重点品牌分析 */}
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
          </CollapsibleCard>
        ))}

        {/* 页脚说明 */}
        <div style={{
          background: THEME.cardBg,
          borderRadius: THEME.radius.md,
          padding: '20px',
          boxShadow: THEME.shadow,
          border: `1px solid ${THEME.border}`,
          marginTop: '16px'
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
                <strong>说明：</strong>本页面为鼻炎品类数据总览，包含全平台核心指标、趋势分析及平台专项分析。
                数据基于2025年11月统计，环比对比为上月（2025年10月）数据。点击顶部导出按钮可将数据复制到Excel。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}