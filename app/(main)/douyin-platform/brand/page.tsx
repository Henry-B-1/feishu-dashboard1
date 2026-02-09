'use client'
import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import styles from './page.module.css';

export default function SOVSOEPieChartPage() {
  const [rawData, setRawData] = useState([]);
  // 初始值设为Aug-25，保持原有逻辑
  const [selectedMonth, setSelectedMonth] = useState('Aug-25');
  const [loading, setLoading] = useState(true);
  const [sovPieData, setSovPieData] = useState([]);
  const [soePieData, setSoePieData] = useState([]);
  const [barData, setBarData] = useState({ brands: [], totalVoice: [], totalInteract: [] });
  const sovChartRef = useRef(null);
  const soeChartRef = useRef(null);
  const voiceBarChartRef = useRef(null);
  const interactBarChartRef = useRef(null);

  // ========== 全局统一样式配置（保留原有优化） ==========
  const CHART_STYLE_CONFIG = {
    container: {
      width: '48%',
      minWidth: '400px',
      height: '450px',
    },
    style: {
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      boxSizing: 'border-box',
      background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
      transition: 'all 0.2s ease',
    },
    parent: {
      width: '100%',
      display: 'flex',
      gap: '24px',
      flexWrap: 'wrap',
      alignItems: 'stretch',
      justifyContent: 'center',
      margin: '16px 0',
      boxSizing: 'border-box'
    }
  };

  const chartContainerStyle = {
    ...CHART_STYLE_CONFIG.container,
    ...CHART_STYLE_CONFIG.style
  };

  // 请求原始数据（保留原有逻辑）
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:3000/api/feishu/DOUYIN');
        setRawData(res.data);
      } catch (err) {
        console.error('数据请求失败：', err);
        alert('数据加载失败，请检查接口是否可用');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 格式化饼图数据（保留原有逻辑）
  const formatPieData = (indicatorType) => {
    if (rawData.length === 0) return [];
    const filteredData = rawData.filter(item => {
      const fields = item.fields;
      return (
        fields?.['标题'] === '重点品牌声量及互动量表现（抖音） ' &&
        fields?.['拆分方式'] === '全量数据' &&
        fields?.['分析指标'] === indicatorType &&
        fields?.['日期'] === selectedMonth &&
        !!fields?.['品牌']
      );
    });
    return filteredData.map(item => {
      const value = item.fields?.['值'] || '0%';
      return {
        name: item.fields['品牌'],
        value: Number(value.replace('%', ''))
      };
    });
  };

  // 格式化拆分后的柱状图数据（保留原有逻辑）
  const formatSplitBarData = () => {
    if (rawData.length === 0) return { brands: [], totalVoice: [], totalInteract: [] };
    const baseFiltered = rawData.filter(item => {
      const fields = item.fields;
      return (
        fields?.['标题'] === '重点品牌声量及互动量表现（抖音） ' &&
        fields?.['拆分方式'] === '全量数据' &&
        fields?.['日期'] === selectedMonth &&
        !!fields?.['品牌'] &&
        !!fields?.['值']
      );
    });
    const brands = [...new Set(baseFiltered.map(item => item.fields['品牌']))].filter(Boolean);
    const totalVoice = [];
    const totalInteract = [];

    brands.forEach(brand => {
      const voiceItem = baseFiltered.find(item =>
        item.fields['品牌'] === brand && item.fields['分析指标'] === '总声量'
      );
      const interactItem = baseFiltered.find(item =>
        item.fields['品牌'] === brand && item.fields['分析指标'] === '总互动量'
      );
      const voiceValue = Number(String(voiceItem?.fields['值'] || 0).replace(/[%|,]/g, '')) || 0;
      const interactValue = Number(String(interactItem?.fields['值'] || 0).replace(/[%|,]/g, '')) || 0;

      totalVoice.push(voiceValue);
      totalInteract.push(interactValue);
    });

    return { brands, totalVoice, totalInteract };
  };

  // ========== 核心修改1：生成1-12月完整月份列表 ==========
  // 定义25年1-12月的月份标识（与你的数据格式保持一致：英文简写-25）
  const fullMonthList = [
    'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
    'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'
  ];
  // 月份映射（用于自然排序，替代原有固定映射）
  const monthSortMap = Object.fromEntries(fullMonthList.map((month, index) => [month, index + 1]));

  // ========== 核心修改2：移除原有按指标过滤月份，保留全量月份 ==========
  // 无需再过滤，直接使用fullMonthList，保证12个月都显示
  const allMonthOptions = fullMonthList.sort((a, b) => monthSortMap[a] - monthSortMap[b]);

  // ECharts配置：饼图（保留原有优化）
  const getEchartsPieOption = (indicatorType, pieData) => {
    const colorPalette = [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#596164'
    ];
    return {
      title: {
        text: `重点品牌${indicatorType}值分布（全量数据）`,
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
        trigger: 'item',
        formatter: '{b}: {c}% ({d}%)',
        textStyle: { fontSize: 13 },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      },
      legend: {
        orient: 'horizontal',
        left: 'center',
        bottom: 15,
        textStyle: {
          fontSize: 13,
          color: '#475569',
          fontFamily: 'Inter, sans-serif'
        },
        itemGap: 18,
        itemWidth: 14,
        itemHeight: 14,
        padding: [0, 0, 5, 0]
      },
      series: [
        {
          name: `${indicatorType}值`,
          type: 'pie',
          radius: ['35%', '60%'],
          center: ['50%', '42%'],
          data: pieData,
          label: { show: false },
          labelLine: { show: false },
          color: colorPalette,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
          }
        }
      ],
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    };
  };

  // 通用柱状图配置（保留原有优化）
  const getEchartsSingleBarOption = (title, brands, values, color) => {
    return {
      title: {
        text: `${title}分布（全量数据·${selectedMonth}）`,
        left: 'center',
        top: 15,
        textStyle: {
          fontSize: 15,
          fontWeight: 600,
          color: '#1e293b',
          fontFamily: 'Inter, sans-serif'
        },
        align: 'center'
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(84, 112, 198, 0.1)'
          }
        }
      },
      xAxis: {
        type: 'category',
        data: brands,
        axisLabel: {
          fontSize: 13,
          fontWeight: 500,
          rotate: 15,
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
        top: '22%',
        containLabel: true
      },
      series: [
        {
          name: title,
          type: 'bar',
          data: values,
          barWidth: '45%',
          itemStyle: {
            color: color,
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
              color: color,
              opacity: 0.9
            }
          }
        }
      ],
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    };
  };

  // 监听数据/月份变化（保留原有逻辑）
  useEffect(() => {
    if (rawData.length === 0) return;
    setSovPieData(formatPieData('SOV'));
    setSoePieData(formatPieData('SOE'));
    setBarData(formatSplitBarData());
  }, [rawData, selectedMonth]);

  // 加载动画组件（保留原有优化）
  const LoadingSkeleton = ({ text }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      gap: '12px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e2e8f0',
        borderTop: '3px solid #5470c6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <span style={{
        fontSize: 14,
        color: '#64748b',
        fontWeight: 500
      }}>{text}</span>
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  // 空数据提示组件（保留原有优化）
  const EmptyDataTip = ({ text }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      gap: '12px',
      color: '#64748b'
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 12L12 16L16 12" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 8V16" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{
        fontSize: 14,
        fontWeight: 500
      }}>{text}</span>
    </div>
  );

  return (
    <div className={styles.chartContainer} style={{
      width: '100%',
      minHeight: '100vh',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      background: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>

      {/* 页面标题 + 月份选择器 组合栏（保留原有优化） */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '60px',
        padding: '12px 20px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 600,
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V12" stroke="#5470c6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 10V6C23 5.46957 22.7893 4.96086 22.4142 4.58579C22.0391 4.21071 21.5304 4 21 4H16L12 1L8 4H3C2.46957 4 1.96086 4.21071 1.58579 4.58579C1.21071 4.96086 1 5.46957 1 6V10" stroke="#5470c6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          重点品牌声量及互动量分析
        </h2>

        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            color: '#475569'
          }}>选择月份：</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: '10px 20px',
              minWidth: '140px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '14px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#5470c6';
              e.target.style.boxShadow = '0 0 0 3px rgba(84, 112, 198, 0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
            }}
          >
            {/* 渲染1-12月完整选项 */}
            {allMonthOptions.map(month => (
              <option
                key={month}
                value={month}
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  fontWeight: 500
                }}
              >
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 饼图区域（保留原有优化+交互） */}
      <div style={CHART_STYLE_CONFIG.parent}>
        <div
          style={chartContainerStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {loading ? (
            <LoadingSkeleton text="SOV数据加载中..." />
          ) : sovPieData.length === 0 ? (
            <EmptyDataTip text="当前月份无有效SOV数据" />
          ) : (
            <ReactECharts
              ref={sovChartRef}
              option={getEchartsPieOption('SOV', sovPieData)}
              style={{ width: '100%', height: '100%' }}
              onEvents={{ resize: () => sovChartRef.current?.getEchartsInstance().resize() }}
            />
          )}
        </div>

        <div
          style={chartContainerStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {loading ? (
            <LoadingSkeleton text="SOE数据加载中..." />
          ) : soePieData.length === 0 ? (
            <EmptyDataTip text="当前月份无有效SOE数据" />
          ) : (
            <ReactECharts
              ref={soeChartRef}
              option={getEchartsPieOption('SOE', soePieData)}
              style={{ width: '100%', height: '100%' }}
              onEvents={{ resize: () => soeChartRef.current?.getEchartsInstance().resize() }}
            />
          )}
        </div>
      </div>

      {/* 柱状图区域（保留原有优化+交互） */}
      <div style={CHART_STYLE_CONFIG.parent}>
        <div
          style={chartContainerStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {loading ? (
            <LoadingSkeleton text="总声量数据加载中..." />
          ) : barData.brands.length === 0 ? (
            <EmptyDataTip text="当前月份无有效总声量数据" />
          ) : (
            <ReactECharts
              ref={voiceBarChartRef}
              option={getEchartsSingleBarOption(
                '重点品牌总声量',
                barData.brands,
                barData.totalVoice,
                '#5470c6'
              )}
              style={{ width: '100%', height: '100%' }}
              onEvents={{ resize: () => voiceBarChartRef.current?.getEchartsInstance().resize() }}
            />
          )}
        </div>

        <div
          style={chartContainerStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {loading ? (
            <LoadingSkeleton text="总互动量数据加载中..." />
          ) : barData.brands.length === 0 ? (
            <EmptyDataTip text="当前月份无有效总互动量数据" />
          ) : (
            <ReactECharts
              ref={interactBarChartRef}
              option={getEchartsSingleBarOption(
                '重点品牌总互动量',
                barData.brands,
                barData.totalInteract,
                '#91cc75'
              )}
              style={{ width: '100%', height: '100%' }}
              onEvents={{ resize: () => interactBarChartRef.current?.getEchartsInstance().resize() }}
            />
          )}
        </div>
      </div>
    </div>
  );
}