'use client'
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useMonthContext } from '@/app/(main)/context/MonthContext';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

// 修正：添加包含 null 的 Ref 类型定义
type EChartsReactRef = React.RefObject<ReactECharts | null>;

interface TableField {
  '值': string;
  '品牌': string;
  '分析指标': string;
  '拆分方式': string;
  '日期': string;
  '标题': string;
  '平台': string;
}

interface RawDataItem {
  fields: TableField;
  id: string;
  record_id: string;
}

interface BrandData {
  totalVoice: string;
  sov: string;
  totalInteract: string;
  soe: string;
}

interface ProcessedTableData {
  grouped: Record<string, Record<string, BrandData>>;
  sortedDates: string[];
  brands: string[];
}

interface PlatformBrandData extends BrandData {
  platform: string;
}

interface ProcessedPlatformData {
  grouped: Record<string, Record<string, BrandData>>;
  platforms: string[];
  brands: string[];
  selectedMonth: string;
}

type MainTabType = 'kpiOverview' | 'hcpNonHcp' | 'kolUgc' | 'voicePlatformDistribution';
type SubTabType = 'hcp' | 'nonHcp' | 'kol' | 'ugc';

// 修正：更新 renderCommonPanel 的 chartRefs 类型定义
interface ChartRefs {
  voice: EChartsReactRef;
  interact: EChartsReactRef;
  sovArea: EChartsReactRef;
  soeArea: EChartsReactRef;
}

const mainTabConfig = [
  { key: 'kpiOverview', label: 'KPI总览' },
  { key: 'hcpNonHcp', label: 'HCP/NON-HCP' },
  { key: 'kolUgc', label: 'KOL/UGC' },
  { key: 'voicePlatformDistribution', label: '声量及互动量平台分布' }
];

const subTabConfigs = {
  hcpNonHcp: [
    { key: 'hcp' as SubTabType, label: 'HCP' },
    { key: 'nonHcp' as SubTabType, label: 'NON-HCP' }
  ],
  kolUgc: [
    { key: 'kol' as SubTabType, label: 'KOL' },
    { key: 'ugc' as SubTabType, label: 'UGC' }
  ]
};

const parseMonthString = (monthStr: string): Date => {
  const [month, year] = monthStr.split('-');
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  const fullYear = parseInt(year, 10) + 2000;
  return new Date(fullYear, monthMap[month], 1);
};

const normalizeBrandName = (name: string): string => {
  if (!name) return '';
  return name.trim().replace(/\s+/g, '').replace(/　/g, '');
};

const getLineChartOption = (
  sortedDates: string[],
  grouped: Record<string, Record<string, BrandData>>,
  brands: string[],
  indicatorType: 'totalVoice' | 'totalInteract',
  yAxisName: string
) => {
  const series = brands.map((brand, index) => {
    const colors = ['#1890ff', '#722ed1', '#f5222d', '#fa8c16', '#a0d911', '#13c2c2'];
    const data = sortedDates.map(month => {
      const value = grouped[month]?.[brand]?.[indicatorType] || '-';
      if (value === '-' || value === '' || value === '无' || value === null || value === undefined) {
        return 0;
      }
      const numericValue = parseFloat(value.toString().replace(/[^\d.]/g, ''));
      return isNaN(numericValue) ? 0 : numericValue;
    });

    return {
      name: brand,
      type: 'line',
      data: data,
      smooth: true,
      itemStyle: { color: colors[index], borderWidth: 2 },
      lineStyle: { width: 2, color: colors[index] },
      symbol: 'circle',
      symbolSize: 8,
      emphasis: { symbolSize: 12 },
      connectNulls: true
    };
  });

  return {
    tooltip: {
      trigger: 'axis',
      textStyle: { fontSize: 12 },
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 10,
      formatter: function(params: any) {
        let result = `<div style="font-weight:600;margin-bottom:4px;">${params[0].axisValue}</div>`;
        params.forEach((param: any) => {
          result += `<div style="margin:2px 0;">
            <span style="display:inline-block;width:8px;height:8px;background:${param.color};border-radius:50%;margin-right:6px;"></span>
            ${param.seriesName}：${param.data === 0 ? '-' : param.data}
          </div>`;
        });
        return result;
      }
    },
    legend: { data: brands, textStyle: { fontSize: 12 }, bottom: 10, left: 'center' },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: sortedDates,
      axisLabel: { fontSize: 12 },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      name: '时间（月份）',
      nameTextStyle: { fontSize: 12, padding: [0, 0, 5, 0] }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 12 },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
      name: yAxisName,
      nameTextStyle: { fontSize: 12 },
      nameRotate: 90,
      nameLocation: 'middle',
      nameGap: 30,
      min: 0
    },
    series: series,
    responsive: true
  };
};

const getAreaChartOption = (
  sortedDates: string[],
  grouped: Record<string, Record<string, BrandData>>,
  brands: string[],
  indicatorType: 'sov' | 'soe',
  yAxisName: string
) => {
  const series = brands.map((brand, index) => {
    const colors = ['#1890ff', '#722ed1', '#f5222d', '#fa8c16', '#a0d911', '#13c2c2'];
    const data = sortedDates.map(month => {
      const value = grouped[month]?.[brand]?.[indicatorType] || '-';
      if (value === '-' || value === '' || value === '无' || value === null || value === undefined) {
        return 0;
      }
      const numericValue = parseFloat(value.toString().replace(/[%]/g, ''));
      return isNaN(numericValue) ? 0 : numericValue;
    });

    return {
      name: brand,
      type: 'line',
      stack: 'total',
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: colors[index] },
          { offset: 1, color: `${colors[index]}33` }
        ]),
        opacity: 0.8
      },
      data: data,
      smooth: true,
      itemStyle: { color: colors[index], borderWidth: 2 },
      lineStyle: { width: 2, color: colors[index] },
      symbol: 'circle',
      symbolSize: 6,
      emphasis: { symbolSize: 10 },
      connectNulls: true
    };
  });

  return {
    tooltip: {
      trigger: 'axis',
      textStyle: { fontSize: 12 },
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 10,
      formatter: function(params: any) {
        let result = `<div style="font-weight:600;margin-bottom:4px;">${params[0].axisValue}</div>`;
        let total = 0;
        params.forEach((param: any) => {
          total += param.data;
          result += `<div style="margin:2px 0;">
            <span style="display:inline-block;width:8px;height:8px;background:${param.color};border-radius:50%;margin-right:6px;"></span>
            ${param.seriesName}：${param.data === 0 ? '-' : `${param.data}%`}
          </div>`;
        });
        result += `<div style="margin:2px 0;font-weight:600;">总计：${total.toFixed(1)}%</div>`;
        return result;
      }
    },
    legend: { data: brands, textStyle: { fontSize: 12 }, bottom: 10, left: 'center' },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: sortedDates,
      axisLabel: { fontSize: 12 },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      name: '时间（月份）',
      nameTextStyle: { fontSize: 12, padding: [0, 0, 5, 0] }
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%', fontSize: 12 },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
      name: yAxisName,
      nameTextStyle: { fontSize: 12 },
      nameRotate: 90,
      nameLocation: 'middle',
      nameGap: 30,
      min: 0,
      max: 100
    },
    series: series,
    responsive: true
  };
};

const getPlatformChartOption = (
  platforms: string[],
  grouped: Record<string, Record<string, BrandData>>,
  brands: string[],
  indicatorType: 'totalVoice' | 'totalInteract' | 'sov' | 'soe',
  yAxisName: string,
  isPercentage: boolean = false
) => {
  const series = brands.map((brand, index) => {
    const colors = ['#1890ff', '#722ed1', '#f5222d', '#fa8c16', '#a0d911', '#13c2c2'];
    const data = platforms.map(platform => {
      const value = grouped[platform]?.[brand]?.[indicatorType] || '-';
      if (value === '-' || value === '' || value === '无' || value === null || value === undefined) {
        return 0;
      }
      let numericValue;
      if (isPercentage) {
        numericValue = parseFloat(value.toString().replace(/[%]/g, ''));
      } else {
        numericValue = parseFloat(value.toString().replace(/[,]/g, '').replace(/[^\d.]/g, ''));
      }
      return isNaN(numericValue) ? 0 : numericValue;
    });

    return {
      name: brand,
      type: 'bar',
      stack: 'total',
      data: data,
      itemStyle: { color: colors[index], borderRadius: [0, 4, 4, 0] },
      emphasis: { itemStyle: { color: colors[index], opacity: 0.8 } }
    };
  });

  return {
    tooltip: {
      trigger: 'axis',
      textStyle: { fontSize: 12 },
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 10,
      formatter: function(params: any) {
        let result = `<div style="font-weight:600;margin-bottom:4px;">${params[0].axisValue}</div>`;
        let total = 0;
        params.forEach((param: any) => {
          total += param.data;
          const displayValue = param.data === 0 ? '-' : isPercentage ? `${param.data}%` : param.data;
          result += `<div style="margin:2px 0;">
            <span style="display:inline-block;width:8px;height:8px;background:${param.color};border-radius:50%;margin-right:6px;"></span>
            ${param.seriesName}：${displayValue}
          </div>`;
        });
        const totalDisplay = isPercentage ? `${total.toFixed(1)}%` : total;
        result += `<div style="margin:2px 0;font-weight:600;">总计：${totalDisplay}</div>`;
        return result;
      }
    },
    legend: { data: brands, textStyle: { fontSize: 11 }, right: 19, bottom: 0, orient: 'horizontal' },
    grid: { left: '3%', right: '7%', bottom: '13%', top: '8%', containLabel: true },
    yAxis: {
      type: 'category',
      data: platforms,
      axisLabel: { fontSize: 12, align: 'right' },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      name: '平台',
      nameTextStyle: { fontSize: 12 },
      nameRotate: 0,
      nameLocation: 'end',
      nameGap: 10
    },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: 12, formatter: isPercentage ? '{value}%' : '{value}' },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
      name: yAxisName,
      nameTextStyle: { fontSize: 12 },
      nameRotate: 0,
      nameLocation: 'middle',
      nameGap: 20,
      min: 0,
      max: isPercentage ? 100 : undefined
    },
    series: series,
    responsive: true
  };
};

const EmptyPanel: React.FC<{ title: string; subTitle?: string }> = ({ title, subTitle }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '600px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      marginTop: '16px',
      padding: '24px'
    }}>
      <div style={{ fontSize: '20px', color: '#64748b', marginBottom: '8px' }}>📊 {title}</div>
      {subTitle && <div style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '16px' }}>{subTitle}</div>}
      <div style={{ fontSize: '16px', color: '#94a3b8' }}>该模块正在开发中，敬请期待...</div>
    </div>
  );
};

export default function BrandTablePage() {
  const { selectedMonth } = useMonthContext();
  const [kpiTableData, setKpiTableData] = useState<ProcessedTableData>({ grouped: {}, sortedDates: [], brands: [] });
  const [hcpTableData, setHcpTableData] = useState<ProcessedTableData>({ grouped: {}, sortedDates: [], brands: [] });
  const [nonHcpTableData, setNonHcpTableData] = useState<ProcessedTableData>({ grouped: {}, sortedDates: [], brands: [] });
  const [kolTableData, setKolTableData] = useState<ProcessedTableData>({ grouped: {}, sortedDates: [], brands: [] });
  const [ugcTableData, setUgcTableData] = useState<ProcessedTableData>({ grouped: {}, sortedDates: [], brands: [] });
  const [platformTableData, setPlatformTableData] = useState<ProcessedPlatformData>({
    grouped: {}, platforms: [], brands: [], selectedMonth: selectedMonth
  });

  const [kpiLoading, setKpiLoading] = useState(true);
  const [hcpLoading, setHcpLoading] = useState(false);
  const [nonHcpLoading, setNonHcpLoading] = useState(false);
  const [kolLoading, setKolLoading] = useState(false);
  const [ugcLoading, setUgcLoading] = useState(false);
  const [platformLoading, setPlatformLoading] = useState(false);

  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('kpiOverview');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('hcp');
  const [copySuccess, setCopySuccess] = useState('');

  // ====================== 刷新触发器（核心） ======================
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => {
    // 清空所有数据
    setKpiTableData({ grouped: {}, sortedDates: [], brands: [] });
    setHcpTableData({ grouped: {}, sortedDates: [], brands: [] });
    setNonHcpTableData({ grouped: {}, sortedDates: [], brands: [] });
    setKolTableData({ grouped: {}, sortedDates: [], brands: [] });
    setUgcTableData({ grouped: {}, sortedDates: [], brands: [] });
    setPlatformTableData({ grouped: {}, platforms: [], brands: [], selectedMonth });
    // 触发重刷
    setRefreshKey(prev => prev + 1);
  };

  // 修正：使用新的 Ref 类型定义（包含 null）
  const kpiVoiceChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const kpiInteractChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const kpiSovAreaChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const kpiSoeAreaChartRef: EChartsReactRef = useRef<ReactECharts>(null);

  const hcpVoiceChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const hcpInteractChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const hcpSovAreaChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const hcpSoeAreaChartRef: EChartsReactRef = useRef<ReactECharts>(null);

  const nonHcpVoiceChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const nonHcpInteractChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const nonHcpSovAreaChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const nonHcpSoeAreaChartRef: EChartsReactRef = useRef<ReactECharts>(null);

  const kolVoiceChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const kolInteractChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const kolSovAreaChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const kolSoeAreaChartRef: EChartsReactRef = useRef<ReactECharts>(null);

  const ugcVoiceChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const ugcInteractChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const ugcSovAreaChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const ugcSoeAreaChartRef: EChartsReactRef = useRef<ReactECharts>(null);

  const platformVoiceChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const platformInteractChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const platformSovChartRef: EChartsReactRef = useRef<ReactECharts>(null);
  const platformSoeChartRef: EChartsReactRef = useRef<ReactECharts>(null);

  useEffect(() => {
    if (activeMainTab === 'hcpNonHcp') setActiveSubTab('hcp');
    if (activeMainTab === 'kolUgc') setActiveSubTab('kol');
  }, [activeMainTab]);

  // 修正：添加按钮 hover 状态管理
  const [copyBtnHovered, setCopyBtnHovered] = useState<string | null>(null);

  const copyToClipboard = (text: string, tip: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(tip);
      setTimeout(() => setCopySuccess(''), 1500);
    }).catch(err => {
      console.error('复制失败:', err);
      setCopySuccess('复制失败，请手动复制');
      setTimeout(() => setCopySuccess(''), 1500);
    });
  };

  const copyTableData = (tableData: ProcessedTableData, panelName: string) => {
    if (tableData.sortedDates.length === 0 || tableData.brands.length === 0) {
      setCopySuccess('暂无数据可复制');
      setTimeout(() => setCopySuccess(''), 1500);
      return;
    }
    const header = ['月份'];
    tableData.brands.forEach(brand => {
      header.push(`${brand}-总声量`, `${brand}-SOV`, `${brand}-总互动量`, `${brand}-SOE`);
    });
    const lines = [header.join('\t')];
    tableData.sortedDates.forEach(date => {
      const row = [date];
      tableData.brands.forEach(brand => {
        const data = tableData.grouped[date][brand];
        row.push(data.totalVoice, data.sov, data.totalInteract, data.soe);
      });
      lines.push(row.join('\t'));
    });
    copyToClipboard(lines.join('\n'), `${panelName} 表格数据已复制，可直接粘贴到 Excel`);
  };

  const copyPlatformData = (platformData: ProcessedPlatformData) => {
    if (platformData.platforms.length === 0 || platformData.brands.length === 0) {
      setCopySuccess('暂无数据可复制');
      setTimeout(() => setCopySuccess(''), 1500);
      return;
    }
    const header = ['平台'];
    platformData.brands.forEach(brand => {
      header.push(`${brand}-总声量`, `${brand}-SOV`, `${brand}-总互动量`, `${brand}-SOE`);
    });
    const lines = [header.join('\t')];
    platformData.platforms.forEach(platform => {
      const row = [platform];
      platformData.brands.forEach(brand => {
        const data = platformData.grouped[platform]?.[brand] || { totalVoice: '-', sov: '-', totalInteract: '-', soe: '-' };
        row.push(data.totalVoice, data.sov, data.totalInteract, data.soe);
      });
      lines.push(row.join('\t'));
    });
    copyToClipboard(lines.join('\n'), `平台分布数据（${platformData.selectedMonth}）已复制，可直接粘贴到 Excel`);
  };

  const copyChartData = (
    tableData: ProcessedTableData,
    indicatorType: 'totalVoice' | 'totalInteract' | 'sov' | 'soe',
    indicatorName: string,
    panelName: string
  ) => {
    if (tableData.sortedDates.length === 0 || tableData.brands.length === 0) {
      setCopySuccess('暂无数据可复制');
      setTimeout(() => setCopySuccess(''), 1500);
      return;
    }
    const header = ['月份', ...tableData.brands];
    const lines = [header.join('\t')];
    tableData.sortedDates.forEach(date => {
      const row = [date];
      tableData.brands.forEach(brand => {
        const value = tableData.grouped[date][brand][indicatorType];
        row.push(value);
      });
      lines.push(row.join('\t'));
    });
    copyToClipboard(lines.join('\n'), `${panelName} - ${indicatorName} 数据已复制，可直接粘贴到 Excel`);
  };

  const copyPlatformChartData = (
    platformData: ProcessedPlatformData,
    indicatorType: 'totalVoice' | 'totalInteract' | 'sov' | 'soe',
    indicatorName: string
  ) => {
    if (platformData.platforms.length === 0 || platformData.brands.length === 0) {
      setCopySuccess('暂无数据可复制');
      setTimeout(() => setCopySuccess(''), 1500);
      return;
    }
    const header = ['平台', ...platformData.brands];
    const lines = [header.join('\t')];
    platformData.platforms.forEach(platform => {
      const row = [platform];
      platformData.brands.forEach(brand => {
        const data = platformData.grouped[platform]?.[brand] || { totalVoice: '-', sov: '-', totalInteract: '-', soe: '-' };
        row.push(data[indicatorType]);
      });
      lines.push(row.join('\t'));
    });
    copyToClipboard(lines.join('\n'), `平台分布 - ${indicatorName} 数据（${platformData.selectedMonth}）已复制，可直接粘贴到 Excel`);
  };

  // 修正：移除 &:hover 语法，改用动态样式
  const getCopyBtnStyle = (disabled: boolean, id: string) => {
    const baseStyle: React.CSSProperties = {
      padding: '6px 14px',
      fontSize: 13,
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      background: '#fff',
      cursor: 'pointer',
      transition: 'all 0.2s',
      margin: '0 8px 8px 0',
    };

    if (disabled) {
      return {
        ...baseStyle,
        cursor: 'not-allowed',
        opacity: 0.6,
        backgroundColor: '#f1f5f9'
      };
    }

    if (copyBtnHovered === id) {
      return {
        ...baseStyle,
        backgroundColor: '#f8fafc',
        borderColor: '#cbd5e1'
      };
    }

    return baseStyle;
  };

  const processTableData = (rawData: RawDataItem[], splitType: string): ProcessedTableData => {
    const filtered = rawData.filter(item =>
      item.fields?.['标题'] === '重点品牌声量及互动量表现（全平台） ' &&
      item.fields?.['拆分方式'] === splitType && item.fields?.['品牌']
    );
    const grouped: Record<string, Record<string, BrandData>> = {};
    const dates = new Set<string>();
    const standardBrands = ['迪敏思', '雷诺考特', '舒霏敏', '内舒拿', '辅舒良', '开瑞坦'];
    const brandNameMap: Record<string, string> = {
      '迪敏思': '迪敏思', '雷诺考特': '雷诺考特', '舒霏敏': '舒霏敏',
      '内舒拿': '内舒拿', '辅舒良': '辅舒良', '开瑞坦': '开瑞坦'
    };
    filtered.forEach(item => {
      const date = item.fields['日期'];
      let brand = item.fields['品牌'];
      const indicator = item.fields['分析指标'];
      const value = item.fields['值'] || '-';
      if (!date || !brand) return;
      const normalizedName = normalizeBrandName(brand);
      const matchedName = brandNameMap[normalizedName] ||
        Object.entries(brandNameMap).find(([key]) =>
          normalizedName.includes(key) || key.includes(normalizedName)
        )?.[1] || normalizedName;
      if (!standardBrands.includes(matchedName)) return;
      if (!grouped[date]) {
        grouped[date] = {};
        standardBrands.forEach(b => {
          grouped[date][b] = { totalVoice: '-', sov: '-', totalInteract: '-', soe: '-' };
        });
      }
      dates.add(date);
      let processedValue = value === '' || value === '无' ? '-' : value;
      switch (indicator) {
        case '总声量': grouped[date][matchedName].totalVoice = processedValue; break;
        case 'SOV': grouped[date][matchedName].sov = processedValue; break;
        case '总互动量': grouped[date][matchedName].totalInteract = processedValue; break;
        case 'SOE': grouped[date][matchedName].soe = processedValue; break;
      }
    });
    const sortedDates = Array.from(dates).sort((a, b) => parseMonthString(a).getTime() - parseMonthString(b).getTime());
    return { grouped, sortedDates, brands: standardBrands };
  };

  const processPlatformData = (rawData: RawDataItem[], splitType: string, targetMonth: string): ProcessedPlatformData => {
    const filtered = rawData.filter(item =>
      item.fields?.['标题'] === '重点品牌声量及互动量表现（全平台） ' &&
      item.fields?.['拆分方式'] === splitType &&
      item.fields?.['日期'] === targetMonth &&
      item.fields?.['品牌'] && item.fields?.['平台']
    );
    const grouped: Record<string, Record<string, BrandData>> = {};
    const platforms = new Set<string>();
    const standardBrands = ['迪敏思', '雷诺考特', '舒霏敏', '内舒拿', '辅舒良', '开瑞坦'];
    const brandNameMap: Record<string, string> = {
      '迪敏思': '迪敏思', '雷诺考特': '雷诺考特', '舒霏敏': '舒霏敏',
      '内舒拿': '内舒拿', '辅舒良': '辅舒良', '开瑞坦': '开瑞坦'
    };
    filtered.forEach(item => {
      const platform = item.fields['平台'];
      let brand = item.fields['品牌'];
      const indicator = item.fields['分析指标'];
      const value = item.fields['值'] || '-';
      if (!platform || !brand) return;
      const normalizedName = normalizeBrandName(brand);
      const matchedName = brandNameMap[normalizedName] ||
        Object.entries(brandNameMap).find(([key]) =>
          normalizedName.includes(key) || key.includes(normalizedName)
        )?.[1] || normalizedName;
      if (!standardBrands.includes(matchedName)) return;
      if (!grouped[platform]) {
        grouped[platform] = {};
        standardBrands.forEach(b => {
          grouped[platform][b] = { totalVoice: '-', sov: '-', totalInteract: '-', soe: '-' };
        });
      }
      platforms.add(platform);
      let processedValue = value === '' || value === '无' ? '-' : value;
      switch (indicator) {
        case '总声量': grouped[platform][matchedName].totalVoice = processedValue; break;
        case 'SOV': grouped[platform][matchedName].sov = processedValue; break;
        case '总互动量': grouped[platform][matchedName].totalInteract = processedValue; break;
        case 'SOE': grouped[platform][matchedName].soe = processedValue; break;
      }
    });
    const sortedPlatforms = Array.from(platforms).sort();
    return { grouped, platforms: sortedPlatforms, brands: standardBrands, selectedMonth: targetMonth };
  };

  // 所有 useEffect 最后加 [refreshKey]
  useEffect(() => {
    if (activeMainTab === 'kpiOverview') {
      const fetchKpiData = async () => {
        try {
          setKpiLoading(true);
          const res = await axios.get('http://localhost:3000/api/feishu/recordsBrand');
          const processedTableData = processTableData(res.data as RawDataItem[], '全量数据');
          setKpiTableData(processedTableData);
        } catch (err) {
          console.error('KPI数据加载失败:', err);
        } finally {
          setKpiLoading(false);
        }
      };
      fetchKpiData();
    }
  }, [activeMainTab, refreshKey]);

  useEffect(() => {
    if (activeMainTab === 'hcpNonHcp' && activeSubTab === 'hcp') {
      const fetchHcpData = async () => {
        try {
          setHcpLoading(true);
          const res = await axios.get('http://localhost:3000/api/feishu/recordsBrandHCP');
          const processedTableData = processTableData(res.data as RawDataItem[], 'HCP');
          setHcpTableData(processedTableData);
        } catch (err) {
          console.error('HCP数据加载失败:', err);
        } finally {
          setHcpLoading(false);
        }
      };
      fetchHcpData();
    }
  }, [activeMainTab, activeSubTab, refreshKey]);

  useEffect(() => {
    if (activeMainTab === 'hcpNonHcp' && activeSubTab === 'nonHcp') {
      const fetchNonHcpData = async () => {
        try {
          setNonHcpLoading(true);
          const res = await axios.get('http://localhost:3000/api/feishu/recordsBrandNONHCP');
          const processedTableData = processTableData(res.data as RawDataItem[], 'NON-HCP');
          setNonHcpTableData(processedTableData);
        } catch (err) {
          console.error('NON-HCP数据加载失败:', err);
        } finally {
          setNonHcpLoading(false);
        }
      };
      fetchNonHcpData();
    }
  }, [activeMainTab, activeSubTab, refreshKey]);

  useEffect(() => {
    if (activeMainTab === 'kolUgc' && activeSubTab === 'kol') {
      const fetchKolData = async () => {
        try {
          setKolLoading(true);
          const res = await axios.get('http://localhost:3000/api/feishu/recordsBrandKOL');
          const processedTableData = processTableData(res.data as RawDataItem[], 'KOL');
          setKolTableData(processedTableData);
        } catch (err) {
          console.error('KOL数据加载失败:', err);
        } finally {
          setKolLoading(false);
        }
      };
      fetchKolData();
    }
  }, [activeMainTab, activeSubTab, refreshKey]);

  useEffect(() => {
    if (activeMainTab === 'kolUgc' && activeSubTab === 'ugc') {
      const fetchUgcData = async () => {
        try {
          setUgcLoading(true);
          const res = await axios.get('http://localhost:3000/api/feishu/recordsBrandUGC');
          const processedTableData = processTableData(res.data as RawDataItem[], 'UGC');
          setUgcTableData(processedTableData);
        } catch (err) {
          console.error('UGC数据加载失败:', err);
        } finally {
          setUgcLoading(false);
        }
      };
      fetchUgcData();
    }
  }, [activeMainTab, activeSubTab, refreshKey]);

  useEffect(() => {
    if (activeMainTab === 'voicePlatformDistribution') {
      const fetchPlatformData = async () => {
        try {
          setPlatformLoading(true);
          const res = await axios.get('http://localhost:3000/api/feishu/recordsBrandDistribution');
          const processedPlatformData = processPlatformData(
            res.data as RawDataItem[],
            '声量及互动量平台分布',
            selectedMonth
          );
          setPlatformTableData(processedPlatformData);
        } catch (err) {
          console.error('平台分布数据加载失败:', err);
        } finally {
          setPlatformLoading(false);
        }
      };
      fetchPlatformData();
    }
  }, [activeMainTab, selectedMonth, refreshKey]);

  useEffect(() => {
    const resizeHandler = () => {
      // 修正：添加 null 检查
      kpiVoiceChartRef.current?.getEchartsInstance()?.resize();
      kpiInteractChartRef.current?.getEchartsInstance()?.resize();
      kpiSovAreaChartRef.current?.getEchartsInstance()?.resize();
      kpiSoeAreaChartRef.current?.getEchartsInstance()?.resize();

      hcpVoiceChartRef.current?.getEchartsInstance()?.resize();
      hcpInteractChartRef.current?.getEchartsInstance()?.resize();
      hcpSovAreaChartRef.current?.getEchartsInstance()?.resize();
      hcpSoeAreaChartRef.current?.getEchartsInstance()?.resize();

      nonHcpVoiceChartRef.current?.getEchartsInstance()?.resize();
      nonHcpInteractChartRef.current?.getEchartsInstance()?.resize();
      nonHcpSovAreaChartRef.current?.getEchartsInstance()?.resize();
      nonHcpSoeAreaChartRef.current?.getEchartsInstance()?.resize();

      kolVoiceChartRef.current?.getEchartsInstance()?.resize();
      kolInteractChartRef.current?.getEchartsInstance()?.resize();
      kolSovAreaChartRef.current?.getEchartsInstance()?.resize();
      kolSoeAreaChartRef.current?.getEchartsInstance()?.resize();

      ugcVoiceChartRef.current?.getEchartsInstance()?.resize();
      ugcInteractChartRef.current?.getEchartsInstance()?.resize();
      ugcSovAreaChartRef.current?.getEchartsInstance()?.resize();
      ugcSoeAreaChartRef.current?.getEchartsInstance()?.resize();

      platformVoiceChartRef.current?.getEchartsInstance()?.resize();
      platformInteractChartRef.current?.getEchartsInstance()?.resize();
      platformSovChartRef.current?.getEchartsInstance()?.resize();
      platformSoeChartRef.current?.getEchartsInstance()?.resize();
    };
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  const tableStyles = {
    container: { marginTop: '24px', overflowX: 'auto' as const, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: '1.2' },
    headerRow1: { backgroundColor: '#facc15', color: '#1e293b', lineHeight: '1.2' },
    headerRow2: { backgroundColor: '#4b5563', color: '#ffffff', lineHeight: '1.2' },
    bodyRow: { backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', lineHeight: '1.2' },
    cell: { border: '1px solid #d1d5db', padding: '6px 8px', textAlign: 'center' as const },
    headerCell: { border: '1px solid #d1d5db', padding: '6px 8px', textAlign: 'center' as const, fontWeight: 600 },
    subHeaderCell: { border: '1px solid #d1d5db', padding: '4px 6px', textAlign: 'center' as const, fontWeight: 500 }
  };

  const renderCommonPanel = (
    tableData: ProcessedTableData,
    loading: boolean,
    chartRefs: ChartRefs,
    panelTitle: string
  ) => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '120px', color: '#64748b' }}>
          {panelTitle}数据加载中...
        </div>
      );
    }
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#475569' }}>{panelTitle} 数据表格</span>
          <button
            style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `copy-table-${panelTitle}`)}
            onClick={() => copyTableData(tableData, panelTitle)}
            disabled={loading || tableData.sortedDates.length === 0}
            onMouseEnter={() => setCopyBtnHovered(`copy-table-${panelTitle}`)}
            onMouseLeave={() => setCopyBtnHovered(null)}
          >
            复制完整表格数据到 Excel
          </button>
        </div>
        <div style={tableStyles.container}>
          <table style={tableStyles.table}>
            <thead>
              <tr style={tableStyles.headerRow1}>
                <th rowSpan={3} style={{ ...tableStyles.headerCell, width: '80px' }}>月份</th>
                {tableData.brands.map(brand => (
                  <th key={brand} colSpan={4} style={tableStyles.headerCell}>{brand}</th>
                ))}
              </tr>
              <tr style={tableStyles.headerRow2}>
                {tableData.brands.map(brand => (
                  <React.Fragment key={brand}>
                    <th style={tableStyles.subHeaderCell}>总声量</th>
                    <th style={tableStyles.subHeaderCell}>SOV</th>
                    <th style={tableStyles.subHeaderCell}>总互动量</th>
                    <th style={tableStyles.subHeaderCell}>SOE</th>
                  </React.Fragment>
                ))}
              </tr>
              <tr style={tableStyles.headerRow2} />
            </thead>
            <tbody>
              {tableData.sortedDates.length > 0 ? (
                tableData.sortedDates.map(date => (
                  <tr key={date} style={tableStyles.bodyRow}>
                    <td style={{ ...tableStyles.cell, fontWeight: 500 }}>{date}</td>
                    {tableData.brands.map(brand => {
                      const data = tableData.grouped[date][brand];
                      return (
                        <React.Fragment key={brand}>
                          <td style={tableStyles.cell}>{data.totalVoice}</td>
                          <td style={{ ...tableStyles.cell, color: data.sov.includes('%') ? '#16a34a' : '#1e293b' }}>{data.sov}</td>
                          <td style={tableStyles.cell}>{data.totalInteract}</td>
                          <td style={{ ...tableStyles.cell, color: data.soe.includes('%') ? '#16a34a' : '#1e293b' }}>{data.soe}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableData.brands.length * 4 + 1} style={tableStyles.cell}>暂无相关数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
            <div style={{ flex: 1, borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0, paddingBottom: '8px' }}>
                  {panelTitle} - 各品牌总声量趋势图
                </h3>
                <button
                  style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `copy-voice-${panelTitle}`)}
                  onClick={() => copyChartData(tableData, 'totalVoice', '总声量', panelTitle)}
                  disabled={loading || tableData.sortedDates.length === 0}
                  onMouseEnter={() => setCopyBtnHovered(`copy-voice-${panelTitle}`)}
                  onMouseLeave={() => setCopyBtnHovered(null)}
                >
                  复制数据
                </button>
              </div>
              <ReactECharts
                ref={chartRefs.voice}
                option={getLineChartOption(tableData.sortedDates, tableData.grouped, tableData.brands, 'totalVoice', '总声量')}
                style={{ height: '340px' }}
              />
            </div>
            <div style={{ flex: 1, borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0, paddingBottom: '8px' }}>
                  {panelTitle} - 各品牌总互动量趋势图
                </h3>
                <button
                  style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `copy-interact-${panelTitle}`)}
                  onClick={() => copyChartData(tableData, 'totalInteract', '总互动量', panelTitle)}
                  disabled={loading || tableData.sortedDates.length === 0}
                  onMouseEnter={() => setCopyBtnHovered(`copy-interact-${panelTitle}`)}
                  onMouseLeave={() => setCopyBtnHovered(null)}
                >
                  复制数据
                </button>
              </div>
              <ReactECharts
                ref={chartRefs.interact}
                option={getLineChartOption(tableData.sortedDates, tableData.grouped, tableData.brands, 'totalInteract', '总互动量')}
                style={{ height: '340px' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
            <div style={{ flex: 1, borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0, paddingBottom: '8px' }}>
                  {panelTitle} - 各品牌 SOV 份额
                </h3>
                <button
                  style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `copy-sov-${panelTitle}`)}
                  onClick={() => copyChartData(tableData, 'sov', 'SOV', panelTitle)}
                  disabled={loading || tableData.sortedDates.length === 0}
                  onMouseEnter={() => setCopyBtnHovered(`copy-sov-${panelTitle}`)}
                  onMouseLeave={() => setCopyBtnHovered(null)}
                >
                  复制数据
                </button>
              </div>
              <ReactECharts
                ref={chartRefs.sovArea}
                option={getAreaChartOption(tableData.sortedDates, tableData.grouped, tableData.brands, 'sov', 'SOV（%）')}
                style={{ height: '340px' }}
              />
            </div>
            <div style={{ flex: 1, borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0, paddingBottom: '8px' }}>
                  {panelTitle} - 各品牌 SOE 份额
                </h3>
                <button
                  style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `copy-soe-${panelTitle}`)}
                  onClick={() => copyChartData(tableData, 'soe', 'SOE', panelTitle)}
                  disabled={loading || tableData.sortedDates.length === 0}
                  onMouseEnter={() => setCopyBtnHovered(`copy-soe-${panelTitle}`)}
                  onMouseLeave={() => setCopyBtnHovered(null)}
                >
                  复制数据
                </button>
              </div>
              <ReactECharts
                ref={chartRefs.soeArea}
                option={getAreaChartOption(tableData.sortedDates, tableData.grouped, tableData.brands, 'soe', 'SOE（%）')}
                style={{ height: '340px' }}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderPlatformPanel = () => {
    if (platformLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '120px', color: '#64748b' }}>
          平台分布数据加载中...
        </div>
      );
    }
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#475569' }}>
            平台分布数据表格（{selectedMonth}）
          </span>
          <button
            style={getCopyBtnStyle(platformLoading || platformTableData.platforms.length === 0, 'copy-platform-all')}
            onClick={() => copyPlatformData(platformTableData)}
            disabled={platformLoading || platformTableData.platforms.length === 0}
            onMouseEnter={() => setCopyBtnHovered('copy-platform-all')}
            onMouseLeave={() => setCopyBtnHovered(null)}
          >
            复制完整平台数据到 Excel
          </button>
        </div>
        <div style={tableStyles.container}>
          <table style={tableStyles.table}>
            <thead>
              <tr style={tableStyles.headerRow1}>
                <th rowSpan={3} style={{ ...tableStyles.headerCell, width: '100px' }}>平台</th>
                {platformTableData.brands.map(brand => (
                  <th key={brand} colSpan={4} style={tableStyles.headerCell}>{brand}</th>
                ))}
              </tr>
              <tr style={tableStyles.headerRow2}>
                {platformTableData.brands.map(brand => (
                  <React.Fragment key={brand}>
                    <th style={tableStyles.subHeaderCell}>总声量</th>
                    <th style={tableStyles.subHeaderCell}>SOV</th>
                    <th style={tableStyles.subHeaderCell}>总互动量</th>
                    <th style={tableStyles.subHeaderCell}>SOE</th>
                  </React.Fragment>
                ))}
              </tr>
              <tr style={tableStyles.headerRow2} />
            </thead>
            <tbody>
              {platformTableData.platforms.length > 0 ? (
                platformTableData.platforms.map(platform => (
                  <tr key={platform} style={tableStyles.bodyRow}>
                    <td style={{ ...tableStyles.cell, fontWeight: 500 }}>{platform}</td>
                    {platformTableData.brands.map(brand => {
                      const data = platformTableData.grouped[platform]?.[brand] || { totalVoice: '-', sov: '-', totalInteract: '-', soe: '-' };
                      return (
                        <React.Fragment key={brand}>
                          <td style={tableStyles.cell}>{data.totalVoice}</td>
                          <td style={{ ...tableStyles.cell, color: data.sov.includes('%') ? '#16a34a' : '#1e293b' }}>{data.sov}</td>
                          <td style={tableStyles.cell}>{data.totalInteract}</td>
                          <td style={{ ...tableStyles.cell, color: data.soe.includes('%') ? '#16a34a' : '#1e293b' }}>{data.soe}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={platformTableData.brands.length * 4 + 1} style={tableStyles.cell}>暂无相关数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
            <div style={{ flex: 1, borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0, paddingBottom: '8px' }}>
                  平台分布 - 各品牌总声量
                </h3>
                <button
                  style={getCopyBtnStyle(platformLoading || platformTableData.platforms.length === 0, 'copy-platform-voice')}
                  onClick={() => copyPlatformChartData(platformTableData, 'totalVoice', '总声量')}
                  disabled={platformLoading || platformTableData.platforms.length === 0}
                  onMouseEnter={() => setCopyBtnHovered('copy-platform-voice')}
                  onMouseLeave={() => setCopyBtnHovered(null)}
                >
                  复制数据
                </button>
              </div>
              <ReactECharts
                ref={platformVoiceChartRef}
                option={getPlatformChartOption(
                  platformTableData.platforms,
                  platformTableData.grouped,
                  platformTableData.brands,
                  'totalVoice',
                  '总声量',
                  false
                )}
                style={{ height: '340px' }}
              />
            </div>

            <div style={{ flex: 1, borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0, paddingBottom: '8px' }}>
                  平台分布 - 各品牌总互动量
                </h3>
                <button
                  style={getCopyBtnStyle(platformLoading || platformTableData.platforms.length === 0, 'copy-platform-interact')}
                  onClick={() => copyPlatformChartData(platformTableData, 'totalInteract', '总互动量')}
                  disabled={platformLoading || platformTableData.platforms.length === 0}
                  onMouseEnter={() => setCopyBtnHovered('copy-platform-interact')}
                  onMouseLeave={() => setCopyBtnHovered(null)}
                >
                  复制数据
                </button>
              </div>
              <ReactECharts
                ref={platformInteractChartRef}
                option={getPlatformChartOption(
                  platformTableData.platforms,
                  platformTableData.grouped,
                  platformTableData.brands,
                  'totalInteract',
                  '总互动量',
                  false
                )}
                style={{ height: '340px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
            <div style={{ flex: 1, borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0, paddingBottom: '8px' }}>
                  平台分布 - 各品牌 SOV 份额
                </h3>
                <button
                  style={getCopyBtnStyle(platformLoading || platformTableData.platforms.length === 0, 'copy-platform-sov')}
                  onClick={() => copyPlatformChartData(platformTableData, 'sov', 'SOV')}
                  disabled={platformLoading || platformTableData.platforms.length === 0}
                  onMouseEnter={() => setCopyBtnHovered('copy-platform-sov')}
                  onMouseLeave={() => setCopyBtnHovered(null)}
                >
                  复制数据
                </button>
              </div>
              <ReactECharts
                ref={platformSovChartRef}
                option={getPlatformChartOption(
                  platformTableData.platforms,
                  platformTableData.grouped,
                  platformTableData.brands,
                  'sov',
                  'SOV（%）',
                  true
                )}
                style={{ height: '340px' }}
              />
            </div>

            <div style={{ flex: 1, borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0, paddingBottom: '8px' }}>
                  平台分布 - 各品牌 SOE 份额
                </h3>
                <button
                  style={getCopyBtnStyle(platformLoading || platformTableData.platforms.length === 0, 'copy-platform-soe')}
                  onClick={() => copyPlatformChartData(platformTableData, 'soe', 'SOE')}
                  disabled={platformLoading || platformTableData.platforms.length === 0}
                  onMouseEnter={() => setCopyBtnHovered('copy-platform-soe')}
                  onMouseLeave={() => setCopyBtnHovered(null)}
                >
                  复制数据
                </button>
              </div>
              <ReactECharts
                ref={platformSoeChartRef}
                option={getPlatformChartOption(
                  platformTableData.platforms,
                  platformTableData.grouped,
                  platformTableData.brands,
                  'soe',
                  'SOE（%）',
                  true
                )}
                style={{ height: '340px' }}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* 顶部标题 + 刷新按钮 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
          重点品牌声量互动分析看板
        </h2>
        <button
          onClick={handleRefresh}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#fff';
          }}
        >
          刷新数据
        </button>
      </div>

      {/* 复制成功提示 */}
      {copySuccess && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          padding: '12px 16px',
          backgroundColor: '#16a34a',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {copySuccess}
        </div>
      )}

      {/* 主标签页 */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '12px'
      }}>
        {mainTabConfig.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveMainTab(tab.key as MainTabType)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: activeMainTab === tab.key ? 600 : 400,
              border: 'none',
              borderRadius: '8px',
              backgroundColor: activeMainTab === tab.key ? '#1890ff' : '#fff',
              color: activeMainTab === tab.key ? '#fff' : '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 子标签页 */}
      {(activeMainTab === 'hcpNonHcp' || activeMainTab === 'kolUgc') && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px'
        }}>
          {subTabConfigs[activeMainTab].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: activeSubTab === tab.key ? 600 : 400,
                border: '1px solid',
                borderColor: activeSubTab === tab.key ? '#1890ff' : '#e2e8f0',
                borderRadius: '8px',
                backgroundColor: activeSubTab === tab.key ? '#e6f7ff' : '#fff',
                color: activeSubTab === tab.key ? '#1890ff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 内容渲染 */}
      {activeMainTab === 'kpiOverview' && renderCommonPanel(
        kpiTableData,
        kpiLoading,
        {
          voice: kpiVoiceChartRef,
          interact: kpiInteractChartRef,
          sovArea: kpiSovAreaChartRef,
          soeArea: kpiSoeAreaChartRef
        },
        'KPI总览'
      )}

      {activeMainTab === 'hcpNonHcp' && activeSubTab === 'hcp' && renderCommonPanel(
        hcpTableData,
        hcpLoading,
        {
          voice: hcpVoiceChartRef,
          interact: hcpInteractChartRef,
          sovArea: hcpSovAreaChartRef,
          soeArea: hcpSoeAreaChartRef
        },
        'HCP'
      )}

            {activeMainTab === 'hcpNonHcp' && activeSubTab === 'nonHcp' && renderCommonPanel(
        nonHcpTableData,
        nonHcpLoading,
        {
          voice: nonHcpVoiceChartRef,
          interact: nonHcpInteractChartRef,
          sovArea: nonHcpSovAreaChartRef,
          soeArea: nonHcpSoeAreaChartRef
        },
        'NON-HCP'
      )}

      {activeMainTab === 'kolUgc' && activeSubTab === 'kol' && renderCommonPanel(
        kolTableData,
        kolLoading,
        {
          voice: kolVoiceChartRef,
          interact: kolInteractChartRef,
          sovArea: kolSovAreaChartRef,
          soeArea: kolSoeAreaChartRef
        },
        'KOL'
      )}

      {activeMainTab === 'kolUgc' && activeSubTab === 'ugc' && renderCommonPanel(
        ugcTableData,
        ugcLoading,
        {
          voice: ugcVoiceChartRef,
          interact: ugcInteractChartRef,
          sovArea: ugcSovAreaChartRef,
          soeArea: ugcSoeAreaChartRef
        },
        'UGC'
      )}

      {activeMainTab === 'voicePlatformDistribution' && renderPlatformPanel()}

      {/* 兜底空面板 */}
      {!['kpiOverview', 'hcpNonHcp', 'kolUgc', 'voicePlatformDistribution'].includes(activeMainTab) && (
        <EmptyPanel title="暂无数据" subTitle="请选择有效的数据分类标签" />
      )}
    </div>
  );
}