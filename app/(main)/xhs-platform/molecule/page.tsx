'use client'
import React, { useState, useEffect, useRef, RefObject } from 'react';
import axios from 'axios';
import { useMonthContext } from '@/app/(main)/context/MonthContext';
// 导入ECharts相关依赖
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

// 定义数据类型
interface TableField {
  '值': string;
  '分子式': string;
  '分析指标': string;
  '拆分方式': string;
  '日期': string;
  '标题': string;
  '平台': string; // 新增平台字段
}

interface RawDataItem {
  fields: TableField;
  id: string;
  record_id: string;
}

interface MoleculeData {
  totalVoice: string;
  sov: string;
  totalInteract: string;
  soe: string;
}

interface ProcessedTableData {
  grouped: Record<string, Record<string, MoleculeData>>;
  sortedDates: string[];
  molecules: string[];
}

// 新增平台分布数据类型
interface PlatformMoleculeData extends MoleculeData {
  platform: string;
}

interface ProcessedPlatformData {
  grouped: Record<string, Record<string, MoleculeData>>; // platform -> molecule -> data
  platforms: string[];
  molecules: string[];
  selectedMonth: string;
}

// 定义一级标签类型
type MainTabType = 'kpiOverview' | 'hcpNonHcp' | 'kolUgc' | 'voicePlatformDistribution';
// 🌟 修改：扩展二级标签类型，增加对比面板
type SubTabType = 'hcp' | 'nonHcp' | 'hcpNonHcpCompare' | 'kol' | 'ugc' | 'kolUgcCompare';

// 一级标签配置
const mainTabConfig = [
  { key: 'kpiOverview', label: 'KPI总览' },
  { key: 'hcpNonHcp', label: 'HCP/NON-HCP' },
  { key: 'kolUgc', label: 'KOL/UGC' },
  //{ key: 'voicePlatformDistribution', label: '声量及互动量平台分布' }
];

// 🌟 修改：更新二级标签配置，增加HCP/NON-HCP对比选项
const subTabConfigs = {
  hcpNonHcp: [
    { key: 'hcpNonHcpCompare' as SubTabType, label: 'HCP/NON-HCP对比' }, // 新增对比面板
    { key: 'hcp' as SubTabType, label: 'HCP' },
    { key: 'nonHcp' as SubTabType, label: 'NON-HCP' },

  ],
  kolUgc: [
   { key: 'kolUgcCompare' as SubTabType, label: 'KOL/UGC对比' },
    { key: 'kol' as SubTabType, label: 'KOL' },
    { key: 'ugc' as SubTabType, label: 'UGC' },

  ]
};

// 辅助函数：将月份字符串（如Aug-25）转换为可排序的日期对象
const parseMonthString = (monthStr: string): Date => {
  const [month, year] = monthStr.split('-');
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  const fullYear = parseInt(year, 10) + 2000;
  return new Date(fullYear, monthMap[month], 1);
};

// 辅助函数：标准化分子式名称（去除空格、统一格式）
const normalizeMoleculeName = (name: string): string => {
  if (!name) return '';
  // 去除首尾空格、替换全角空格、统一字符
  return name.trim().replace(/\s+/g, '').replace(/　/g, '');
};

// 通用折线图配置构建函数
const getLineChartOption = (
  sortedDates: string[],
  grouped: Record<string, Record<string, MoleculeData>>,
  molecules: string[],
  indicatorType: 'totalVoice' | 'totalInteract',
  yAxisName: string
) => {
  // 为每个分子式构建数据系列
  const series = molecules.map((mol, index) => {
    // 为每个分子式分配颜色
    const colors = ['#1890ff', '#722ed1', '#f5222d', '#fa8c16'];
    // 提取该分子式在各月份的对应指标数据
    const data = sortedDates.map(month => {
      const value = grouped[month]?.[mol]?.[indicatorType] || '-';
      // 增强的数值转换逻辑：处理各种异常值
      if (value === '-' || value === '' || value === '无' || value === null || value === undefined) {
        return 0; // 空值显示为0，也可以用null让折线断开
      }
      // 移除所有非数字字符（除了小数点）
      const numericValue = parseFloat(value.toString().replace(/[^\d.]/g, ''));
      return isNaN(numericValue) ? 0 : numericValue;
    });

    return {
      name: mol,
      type: 'line',
      data: data,
      smooth: true, // 平滑曲线
      itemStyle: {
        color: colors[index],
        borderWidth: 2
      },
      lineStyle: {
        width: 2,
        color: colors[index]
      },
      symbol: 'circle', // 拐点样式
      symbolSize: 8, // 拐点大小
      emphasis: {
        symbolSize: 12 // 鼠标悬停时拐点大小
      },
      // 确保空值也显示折线（可选）
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
    legend: {
      data: molecules,
      textStyle: { fontSize: 12 },
      bottom: 0,
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%', // 留出图例空间
      top: '10%',
      containLabel: true
    },
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
      nameRotate: 0,
      nameLocation: 'end',
      nameGap: 13,
      // 确保Y轴从0开始，避免数据失真
      min: 0
    },
    series: series,
    responsive: true
  };
};

// 堆叠面积图配置构建函数
const getAreaChartOption = (
  sortedDates: string[],
  grouped: Record<string, Record<string, MoleculeData>>,
  molecules: string[],
  indicatorType: 'sov' | 'soe',
  yAxisName: string
) => {
  // 为每个分子式构建数据系列
  const series = molecules.map((mol, index) => {
    // 为每个分子式分配颜色（与折线图保持一致）
    const colors = ['#1890ff', '#722ed1', '#f5222d', '#fa8c16'];
    // 提取该分子式在各月份的对应指标数据
    const data = sortedDates.map(month => {
      const value = grouped[month]?.[mol]?.[indicatorType] || '-';
      // 处理百分比数据，转换为小数（如 25% → 25）
      if (value === '-' || value === '' || value === '无' || value === null || value === undefined) {
        return 0;
      }
      // 移除百分号并转换为数字
      const numericValue = parseFloat(value.toString().replace(/[%]/g, ''));
      return isNaN(numericValue) ? 0 : numericValue;
    });

    return {
      name: mol,
      type: 'line',
      stack: 'total', // 堆叠标识，确保同一stack的系列会堆叠
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: colors[index] },
          { offset: 1, color: `${colors[index]}33` } // 半透明效果
        ]),
        opacity: 0.8
      },
      data: data,
      smooth: true, // 平滑曲线
      itemStyle: {
        color: colors[index],
        borderWidth: 2
      },
      lineStyle: {
        width: 2,
        color: colors[index]
      },
      symbol: 'circle', // 拐点样式
      symbolSize: 6, // 拐点大小
      emphasis: {
        symbolSize: 10 // 鼠标悬停时拐点大小
      },
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
    legend: {
      data: molecules,
      textStyle: { fontSize: 12 },
      bottom: 0,
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%', // 留出图例空间
      top: '10%',
      containLabel: true
    },
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
      axisLabel: {
        fontSize: 12,
        formatter: '{value}%' // 显示百分比符号
      },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
      name: yAxisName,
      nameTextStyle: { fontSize: 12 },
      nameRotate: 0,
      nameLocation: 'end',
      nameGap: 13,
      // 百分比Y轴范围0-100
      min: 0,
      max: 100
    },
    series: series,
    responsive: true
  };
};

// 新增：平台分布专用图表配置函数（改为横向堆叠条形图）
// 平台分布专用图表配置函数（改为纵向堆叠柱状图，X轴为分子式）
const getPlatformChartOption = (
  platforms: string[],
  grouped: Record<string, Record<string, MoleculeData>>,
  molecules: string[],
  indicatorType: 'totalVoice' | 'totalInteract' | 'sov' | 'soe',
  yAxisName: string,
  isPercentage: boolean = false
) => {
  // 为每个平台构建数据系列（原逻辑是为每个分子式构建）
  const series = platforms.map((platform, index) => {
    const colors = [
      '#1890ff', '#722ed1', '#f5222d', '#fa8c16',
      '#36cfc9', '#a0c4ff', '#ffc6ff', '#ffd6a5'
    ]; // 扩展颜色以适配多平台
    // 提取该平台在各分子式的对应指标数据
    const data = molecules.map(molecule => {
      // 查找该平台下对应分子式的数据
      const value = grouped[platform]?.[molecule]?.[indicatorType] || '-';

      if (value === '-' || value === '' || value === '无' || value === null || value === undefined) {
        return 0;
      }

      let numericValue;
      if (isPercentage) {
        // 处理百分比数据
        numericValue = parseFloat(value.toString().replace(/[%]/g, ''));
      } else {
        // 处理普通数值（移除千分位逗号等）
        numericValue = parseFloat(value.toString().replace(/[,]/g, '').replace(/[^\d.]/g, ''));
      }

      return isNaN(numericValue) ? 0 : numericValue;
    });

    return {
      name: platform, // 系列名称改为平台
      type: 'bar',
      stack: 'total', // 堆叠效果
      data: data,
      itemStyle: {
        color: colors[index % colors.length], // 循环使用颜色
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: colors[index % colors.length],
          opacity: 0.8
        }
      }
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
        // 添加总计行
        const totalDisplay = isPercentage ? `${total.toFixed(1)}%` : total;
        result += `<div style="margin:2px 0;font-weight:600;">总计：${totalDisplay}</div>`;
        return result;
      }
    },
    legend: {
      data: platforms, // 图例显示平台名称
      textStyle: { fontSize: 12 },
      bottom: 0, // 图例移到顶部
      left: 'center',
      orient: 'horizontal'
    },
    grid: {
      left: '6%',
      right: '4%',
      bottom: '20%',
      top: '10%', // 留出顶部图例空间
      containLabel: true
    },
    // 调整坐标轴配置：X轴显示分子式，Y轴显示数值
    xAxis: {
      type: 'category',
      data: molecules, // 分子式显示在X轴
      axisLabel: {
        fontSize: 11,
        rotate: 0, // 轻微旋转防止文字重叠
        align: 'center',
        interval: 0
      },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      name: '',
      nameTextStyle: { fontSize: 12 },
      nameRotate: 0,
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        formatter: isPercentage ? '{value}%' : '{value}'
      },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
      name: yAxisName,
      nameTextStyle: { fontSize: 12 },
      nameRotate: 0, // Y轴名称旋转90度
      nameLocation: 'end',
      nameGap: 20,
      min: 0,
      max: isPercentage ? 100 : undefined
    },
    series: series,
    responsive: true
  };
};

// 🌟 替换：HCP/NON-HCP对比面板组件
const HcpNonHcpComparePanel: React.FC<{
  copyBtnHovered: string | null;
  setCopyBtnHovered: (key: string | null) => void;
  setCopySuccess: (msg: string) => void;
  refreshKey: number;
  getCopyBtnStyle: (disabled: boolean, btnKey: string) => React.CSSProperties;
  copyTableData: (tableData: ProcessedTableData, panelName: string) => void;
  tableStyles: any;
}> = ({
  copyBtnHovered,
  setCopyBtnHovered,
  setCopySuccess,
  refreshKey,
  getCopyBtnStyle,
  copyTableData,
  tableStyles
}) => {
  // 对比面板专用数据状态
  const [hcpCompareData, setHcpCompareData] = useState<ProcessedTableData>({
    grouped: {},
    sortedDates: [],
    molecules: []
  });
  const [nonHcpCompareData, setNonHcpCompareData] = useState<ProcessedTableData>({
    grouped: {},
    sortedDates: [],
    molecules: []
  });

  // 加载状态
  const [hcpLoading, setHcpLoading] = useState(false);
  const [nonHcpLoading, setNonHcpLoading] = useState(false);

  // 数据处理函数（复用主组件的逻辑）
  const processTableData = (rawData: RawDataItem[], splitType: string): ProcessedTableData => {
    const filtered = rawData.filter(item =>
      item.fields?.['标题'] === '重点分子式声量及互动量表现（红书） ' &&
      item.fields?.['拆分方式'] === splitType && // 根据传入的拆分方式筛选
      item.fields?.['分子式']
    );

    const grouped: Record<string, Record<string, MoleculeData>> = {};
    const dates = new Set<string>();
    // 定义标准分子式名称（用于匹配）
    const standardMolecules = [
      '氮䓬斯汀氟替卡松',
      '糠酸莫米松',
      '布地奈德',
      '丙酸氟替卡松'
    ];
    // 创建名称映射（处理可能的名称变体）
    const moleculeNameMap: Record<string, string> = {
      '氮䓬斯汀氟替卡松': '氮䓬斯汀氟替卡松',
      '糠酸莫米松': '糠酸莫米松',
      '糠酸莫米松鼻喷雾剂': '糠酸莫米松',
      '布地奈德': '布地奈德',
      '布地奈德鼻喷雾剂': '布地奈德',
      '丙酸氟替卡松': '丙酸氟替卡松',
      '丙酸氟替卡松鼻喷雾剂': '丙酸氟替卡松'
    };

    filtered.forEach(item => {
      const date = item.fields['日期'];
      let molecule = item.fields['分子式'];
      const indicator = item.fields['分析指标'];
      const value = item.fields['值'] || '-';

      if (!date || !molecule) return;

      // 标准化分子式名称并映射到标准名称
      const normalizedName = normalizeMoleculeName(molecule);
      // 查找匹配的标准名称
      const matchedName = moleculeNameMap[normalizedName] ||
                          Object.entries(moleculeNameMap).find(([key]) =>
                            normalizedName.includes(key) || key.includes(normalizedName)
                          )?.[1] ||
                          normalizedName;

      // 只处理标准列表中的分子式
      if (!standardMolecules.includes(matchedName)) return;

      if (!grouped[date]) {
        grouped[date] = {};
        standardMolecules.forEach(mol => {
          grouped[date][mol] = { totalVoice: '-', sov: '-', totalInteract: '-', soe: '-' };
        });
      }

      dates.add(date);

      // 确保值是有效的（处理百分比、空值等）
      let processedValue = value;
      if (processedValue === '' || processedValue === '无') {
        processedValue = '-';
      }

      switch (indicator) {
        case '总声量':
          grouped[date][matchedName].totalVoice = processedValue;
          break;
        case 'SOV':
          grouped[date][matchedName].sov = processedValue;
          break;
        case '总互动量':
          grouped[date][matchedName].totalInteract = processedValue;
          break;
        case 'SOE':
          grouped[date][matchedName].soe = processedValue;
          break;
      }
    });

    const sortedDates = Array.from(dates).sort((a, b) => {
      return parseMonthString(a).getTime() - parseMonthString(b).getTime();
    });

    return { grouped, sortedDates, molecules: standardMolecules };
  };

  // 加载对比数据
  useEffect(() => {
    const fetchCompareData = async () => {
      try {
        // 加载HCP数据
        setHcpLoading(true);
        const hcpRes = await axios.get('http://localhost:3000/api/feishu/XHSHCP');
        const hcpProcessed = processTableData(hcpRes.data as RawDataItem[], 'HCP');
        setHcpCompareData(hcpProcessed);

        // 加载NON-HCP数据
        setNonHcpLoading(true);
        const nonHcpRes = await axios.get('http://localhost:3000/api/feishu/XHSNONHCP');
        const nonHcpProcessed = processTableData(nonHcpRes.data as RawDataItem[], 'NON-HCP');
        setNonHcpCompareData(nonHcpProcessed);
      } catch (err) {
        console.error('对比数据加载失败:', err);
        setCopySuccess('数据加载失败，请刷新重试');
        setTimeout(() => setCopySuccess(''), 2000);
      } finally {
        setHcpLoading(false);
        setNonHcpLoading(false);
      }
    };

    fetchCompareData();
  }, [refreshKey]);

  // 渲染单个表格（复用样式）
  const renderTable = (
    tableData: ProcessedTableData,
    loading: boolean,
    title: string
  ) => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '120px',
          color: '#64748b',
          background: '#fff',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          {title}数据加载中...
        </div>
      );
    }

    return (
      <div style={{ marginBottom: '32px' }}>
        {/* 表格标题和复制按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#475569' }}>{title} 数据表格</span>
          <button
            style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `compare-${title}`)}
            onClick={() => copyTableData(tableData, title)}
            disabled={loading || tableData.sortedDates.length === 0}
            onMouseEnter={() => setCopyBtnHovered(`compare-${title}`)}
            onMouseLeave={() => setCopyBtnHovered(null)}
          >
            复制{title}表格数据到 Excel
          </button>
        </div>

        {/* 表格内容 - 和HCP/NON-HCP面板样式完全一致 */}
        <div style={tableStyles.container}>
          <table style={tableStyles.table}>
            <thead>
              <tr style={tableStyles.headerRow1}>
                <th
                  rowSpan={3}
                  style={{ ...tableStyles.headerCell, width: '80px' }}
                >
                  月份
                </th>
                {tableData.molecules.map(mol => (
                  <th
                    key={mol}
                    colSpan={4}
                    style={{ ...mol === '氮䓬斯汀氟替卡松' ? tableStyles.diminsiHeaderCell :tableStyles.headerCell, }}
                  >
                    {mol}
                  </th>
                ))}
              </tr>
              <tr style={tableStyles.headerRow2}>
                {tableData.molecules.map(mol => (
                  <React.Fragment key={mol}>
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
                    {tableData.molecules.map(mol => {
                      const data = tableData.grouped[date][mol];
                      return (
                        <React.Fragment key={mol}>
                          <td style={tableStyles.cell}>{data.totalVoice}</td>
                          <td
                            style={{
                              ...tableStyles.cell,
                              color: data.sov.includes('%') ? '#16a34a' : '#1e293b'
                            }}
                          >
                            {data.sov}
                          </td>
                          <td style={tableStyles.cell}>{data.totalInteract}</td>
                          <td
                            style={{
                              ...tableStyles.cell,
                              color: data.soe.includes('%') ? '#16a34a' : '#1e293b'
                            }}
                          >
                            {data.soe}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableData.molecules.length * 4 + 1} style={tableStyles.cell}>
                    暂无相关数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 批量复制两个表格数据
  const copyAllCompareData = () => {
    if (hcpCompareData.sortedDates.length === 0 || nonHcpCompareData.sortedDates.length === 0) {
      setCopySuccess('暂无数据可复制');
      setTimeout(() => setCopySuccess(''), 1500);
      return;
    }

    // 构建HCP数据
    const hcpHeader = ['HCP - 月份'];
    hcpCompareData.molecules.forEach(mol => {
      hcpHeader.push(`${mol}-总声量`, `${mol}-SOV`, `${mol}-总互动量`, `${mol}-SOE`);
    });
    const hcpLines = [hcpHeader.join('\t')];
    hcpCompareData.sortedDates.forEach(date => {
      const row = [date];
      hcpCompareData.molecules.forEach(mol => {
        const data = hcpCompareData.grouped[date][mol];
        row.push(data.totalVoice, data.sov, data.totalInteract, data.soe);
      });
      hcpLines.push(row.join('\t'));
    });

    // 构建NON-HCP数据
    const nonHcpHeader = ['\nNON-HCP - 月份'];
    nonHcpCompareData.molecules.forEach(mol => {
      nonHcpHeader.push(`${mol}-总声量`, `${mol}-SOV`, `${mol}-总互动量`, `${mol}-SOE`);
    });
    const nonHcpLines = [nonHcpHeader.join('\t')];
    nonHcpCompareData.sortedDates.forEach(date => {
      const row = [date];
      nonHcpCompareData.molecules.forEach(mol => {
        const data = nonHcpCompareData.grouped[date][mol];
        row.push(data.totalVoice, data.sov, data.totalInteract, data.soe);
      });
      nonHcpLines.push(row.join('\t'));
    });

    // 合并并复制
    const allData = [...hcpLines, ...nonHcpLines].join('\n');
    navigator.clipboard.writeText(allData).then(() => {
      setCopySuccess('HCP/NON-HCP对比数据已复制，可粘贴到Excel');
      setTimeout(() => setCopySuccess(''), 2000);
    }).catch(() => {
      setCopySuccess('复制失败，请手动复制');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  return (
    <div style={{ padding: '8px 0' }}>
      {/* 对比面板标题和批量复制按钮 */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          fontSize: '18px',
          color: '#1e293b',
          fontWeight: 600,
          margin: 0
        }}>
          HCP/NON-HCP 数据对比
        </h2>
        <button
          style={getCopyBtnStyle(
            hcpLoading || nonHcpLoading ||
            hcpCompareData.sortedDates.length === 0 ||
            nonHcpCompareData.sortedDates.length === 0,
            'compare-all'
          )}
          onClick={copyAllCompareData}
          disabled={
            hcpLoading || nonHcpLoading ||
            hcpCompareData.sortedDates.length === 0 ||
            nonHcpCompareData.sortedDates.length === 0
          }
          onMouseEnter={() => setCopyBtnHovered('compare-all')}
          onMouseLeave={() => setCopyBtnHovered(null)}
        >
          复制全部对比数据到 Excel
        </button>
      </div>

      {/* HCP表格（上） */}
      {renderTable(hcpCompareData, hcpLoading, 'HCP')}

      {/* NON-HCP表格（下） */}
      {renderTable(nonHcpCompareData, nonHcpLoading, 'NON-HCP')}
    </div>
  );
};



// 🌟 新增：KOL/UGC对比面板组件
const KolUgcComparePanel: React.FC<{
  copyBtnHovered: string | null;
  setCopyBtnHovered: (key: string | null) => void;
  setCopySuccess: (msg: string) => void;
  refreshKey: number;
  getCopyBtnStyle: (disabled: boolean, btnKey: string) => React.CSSProperties;
  copyTableData: (tableData: ProcessedTableData, panelName: string) => void;
  tableStyles: any;
}> = ({
  copyBtnHovered,
  setCopyBtnHovered,
  setCopySuccess,
  refreshKey,
  getCopyBtnStyle,
  copyTableData,
  tableStyles
}) => {
  // 对比面板专用数据状态
  const [kolCompareData, setKolCompareData] = useState<ProcessedTableData>({
    grouped: {},
    sortedDates: [],
    molecules: []
  });
  const [ugcCompareData, setUgcCompareData] = useState<ProcessedTableData>({
    grouped: {},
    sortedDates: [],
    molecules: []
  });

  // 加载状态
  const [kolLoading, setKolLoading] = useState(false);
  const [ugcLoading, setUgcLoading] = useState(false);

  // 数据处理函数（复用主组件的逻辑）
  const processTableData = (rawData: RawDataItem[], splitType: string): ProcessedTableData => {
    const filtered = rawData.filter(item =>
      item.fields?.['标题'] === '重点分子式声量及互动量表现（红书） ' &&
      item.fields?.['拆分方式'] === splitType && // 根据传入的拆分方式筛选
      item.fields?.['分子式']
    );

    const grouped: Record<string, Record<string, MoleculeData>> = {};
    const dates = new Set<string>();
    // 定义标准分子式名称（用于匹配）
    const standardMolecules = [
      '氮䓬斯汀氟替卡松',
      '糠酸莫米松',
      '布地奈德',
      '丙酸氟替卡松'
    ];
    // 创建名称映射（处理可能的名称变体）
    const moleculeNameMap: Record<string, string> = {
      '氮䓬斯汀氟替卡松': '氮䓬斯汀氟替卡松',
      '糠酸莫米松': '糠酸莫米松',
      '糠酸莫米松鼻喷雾剂': '糠酸莫米松',
      '布地奈德': '布地奈德',
      '布地奈德鼻喷雾剂': '布地奈德',
      '丙酸氟替卡松': '丙酸氟替卡松',
      '丙酸氟替卡松鼻喷雾剂': '丙酸氟替卡松'
    };

    filtered.forEach(item => {
      const date = item.fields['日期'];
      let molecule = item.fields['分子式'];
      const indicator = item.fields['分析指标'];
      const value = item.fields['值'] || '-';

      if (!date || !molecule) return;

      // 标准化分子式名称并映射到标准名称
      const normalizedName = normalizeMoleculeName(molecule);
      // 查找匹配的标准名称
      const matchedName = moleculeNameMap[normalizedName] ||
                          Object.entries(moleculeNameMap).find(([key]) =>
                            normalizedName.includes(key) || key.includes(normalizedName)
                          )?.[1] ||
                          normalizedName;

      // 只处理标准列表中的分子式
      if (!standardMolecules.includes(matchedName)) return;

      if (!grouped[date]) {
        grouped[date] = {};
        standardMolecules.forEach(mol => {
          grouped[date][mol] = { totalVoice: '-', sov: '-', totalInteract: '-', soe: '-' };
        });
      }

      dates.add(date);

      // 确保值是有效的（处理百分比、空值等）
      let processedValue = value;
      if (processedValue === '' || processedValue === '无') {
        processedValue = '-';
      }

      switch (indicator) {
        case '总声量':
          grouped[date][matchedName].totalVoice = processedValue;
          break;
        case 'SOV':
          grouped[date][matchedName].sov = processedValue;
          break;
        case '总互动量':
          grouped[date][matchedName].totalInteract = processedValue;
          break;
        case 'SOE':
          grouped[date][matchedName].soe = processedValue;
          break;
      }
    });

    const sortedDates = Array.from(dates).sort((a, b) => {
      return parseMonthString(a).getTime() - parseMonthString(b).getTime();
    });

    return { grouped, sortedDates, molecules: standardMolecules };
  };

  // 加载对比数据
  useEffect(() => {
    const fetchCompareData = async () => {
      try {
        // 加载KOL数据
        setKolLoading(true);
        const kolRes = await axios.get('http://localhost:3000/api/feishu/XHSKOL');
        const kolProcessed = processTableData(kolRes.data as RawDataItem[], 'KOL');
        setKolCompareData(kolProcessed);

        // 加载UGC数据
        setUgcLoading(true);
        const ugcRes = await axios.get('http://localhost:3000/api/feishu/XHSUGC');
        const ugcProcessed = processTableData(ugcRes.data as RawDataItem[], 'UGC');
        setUgcCompareData(ugcProcessed);
      } catch (err) {
        console.error('KOL/UGC对比数据加载失败:', err);
        setCopySuccess('数据加载失败，请刷新重试');
        setTimeout(() => setCopySuccess(''), 2000);
      } finally {
        setKolLoading(false);
        setUgcLoading(false);
      }
    };

    fetchCompareData();
  }, [refreshKey]);

  // 渲染单个表格（复用样式）
  const renderTable = (
    tableData: ProcessedTableData,
    loading: boolean,
    title: string
  ) => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '120px',
          color: '#64748b',
          background: '#fff',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          {title}数据加载中...
        </div>
      );
    }

    return (
      <div style={{ marginBottom: '32px' }}>
        {/* 表格标题和复制按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#475569' }}>{title} 数据表格</span>
          <button
            style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `kolugc-compare-${title}`)}
            onClick={() => copyTableData(tableData, title)}
            disabled={loading || tableData.sortedDates.length === 0}
            onMouseEnter={() => setCopyBtnHovered(`kolugc-compare-${title}`)}
            onMouseLeave={() => setCopyBtnHovered(null)}
          >
            复制{title}表格数据到 Excel
          </button>
        </div>

        {/* 表格内容 - 和HCP/NON-HCP面板样式完全一致 */}
        <div style={tableStyles.container}>
          <table style={tableStyles.table}>
            <thead>
              <tr style={tableStyles.headerRow1}>
                <th
                  rowSpan={3}
                  style={{ ...tableStyles.headerCell, width: '80px' }}
                >
                  月份
                </th>
                {tableData.molecules.map(mol => (
                  <th
                    key={mol}
                    colSpan={4}
                    style={{ ...mol === '氮䓬斯汀氟替卡松' ? tableStyles.diminsiHeaderCell :tableStyles.headerCell, }}
                  >
                    {mol}
                  </th>
                ))}
              </tr>
              <tr style={tableStyles.headerRow2}>
                {tableData.molecules.map(mol => (
                  <React.Fragment key={mol}>
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
                    {tableData.molecules.map(mol => {
                      const data = tableData.grouped[date][mol];
                      return (
                        <React.Fragment key={mol}>
                          <td style={tableStyles.cell}>{data.totalVoice}</td>
                          <td
                            style={{
                              ...tableStyles.cell,
                              color: data.sov.includes('%') ? '#16a34a' : '#1e293b'
                            }}
                          >
                            {data.sov}
                          </td>
                          <td style={tableStyles.cell}>{data.totalInteract}</td>
                          <td
                            style={{
                              ...tableStyles.cell,
                              color: data.soe.includes('%') ? '#16a34a' : '#1e293b'
                            }}
                          >
                            {data.soe}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableData.molecules.length * 4 + 1} style={tableStyles.cell}>
                    暂无相关数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 批量复制两个表格数据
  const copyAllCompareData = () => {
    if (kolCompareData.sortedDates.length === 0 || ugcCompareData.sortedDates.length === 0) {
      setCopySuccess('暂无数据可复制');
      setTimeout(() => setCopySuccess(''), 1500);
      return;
    }

    // 构建KOL数据
    const kolHeader = ['KOL - 月份'];
    kolCompareData.molecules.forEach(mol => {
      kolHeader.push(`${mol}-总声量`, `${mol}-SOV`, `${mol}-总互动量`, `${mol}-SOE`);
    });
    const kolLines = [kolHeader.join('\t')];
    kolCompareData.sortedDates.forEach(date => {
      const row = [date];
      kolCompareData.molecules.forEach(mol => {
        const data = kolCompareData.grouped[date][mol];
        row.push(data.totalVoice, data.sov, data.totalInteract, data.soe);
      });
      kolLines.push(row.join('\t'));
    });

    // 构建UGC数据
    const ugcHeader = ['\nUGC - 月份'];
    ugcCompareData.molecules.forEach(mol => {
      ugcHeader.push(`${mol}-总声量`, `${mol}-SOV`, `${mol}-总互动量`, `${mol}-SOE`);
    });
    const ugcLines = [ugcHeader.join('\t')];
    ugcCompareData.sortedDates.forEach(date => {
      const row = [date];
      ugcCompareData.molecules.forEach(mol => {
        const data = ugcCompareData.grouped[date][mol];
        row.push(data.totalVoice, data.sov, data.totalInteract, data.soe);
      });
      ugcLines.push(row.join('\t'));
    });

    // 合并并复制
    const allData = [...kolLines, ...ugcLines].join('\n');
    navigator.clipboard.writeText(allData).then(() => {
      setCopySuccess('KOL/UGC对比数据已复制，可粘贴到Excel');
      setTimeout(() => setCopySuccess(''), 2000);
    }).catch(() => {
      setCopySuccess('复制失败，请手动复制');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  return (
    <div style={{ padding: '8px 0' }}>
      {/* 对比面板标题和批量复制按钮 */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          fontSize: '18px',
          color: '#1e293b',
          fontWeight: 600,
          margin: 0
        }}>
          KOL/UGC 数据对比
        </h2>
        <button
          style={getCopyBtnStyle(
            kolLoading || ugcLoading ||
            kolCompareData.sortedDates.length === 0 ||
            ugcCompareData.sortedDates.length === 0,
            'kolugc-compare-all'
          )}
          onClick={copyAllCompareData}
          disabled={
            kolLoading || ugcLoading ||
            kolCompareData.sortedDates.length === 0 ||
            ugcCompareData.sortedDates.length === 0
          }
          onMouseEnter={() => setCopyBtnHovered('kolugc-compare-all')}
          onMouseLeave={() => setCopyBtnHovered(null)}
        >
          复制全部对比数据到 Excel
        </button>
      </div>

      {/* KOL表格（上） */}
      {renderTable(kolCompareData, kolLoading, 'KOL')}

      {/* UGC表格（下） */}
      {renderTable(ugcCompareData, ugcLoading, 'UGC')}
    </div>
  );
};





export default function MoleculeTablePage() {
  const { selectedMonth } = useMonthContext();
  // 主数据（KPI总览）
  const [kpiTableData, setKpiTableData] = useState<ProcessedTableData>({
    grouped: {},
    sortedDates: [],
    molecules: []
  });
  // HCP数据
  const [hcpTableData, setHcpTableData] = useState<ProcessedTableData>({
    grouped: {},
    sortedDates: [],
    molecules: []
  });
  // NON-HCP数据
  const [nonHcpTableData, setNonHcpTableData] = useState<ProcessedTableData>({
    grouped: {},
    sortedDates: [],
    molecules: []
  });
  // KOL数据
  const [kolTableData, setKolTableData] = useState<ProcessedTableData>({
    grouped: {},
    sortedDates: [],
    molecules: []
  });
  // UGC数据（新增）
  const [ugcTableData, setUgcTableData] = useState<ProcessedTableData>({
    grouped: {},
    sortedDates: [],
    molecules: []
  });

  // 新增：平台分布数据
  const [platformTableData, setPlatformTableData] = useState<ProcessedPlatformData>({
    grouped: {},
    platforms: [],
    molecules: [],
    selectedMonth: selectedMonth
  });

  // 加载状态
  const [kpiLoading, setKpiLoading] = useState(true);
  const [hcpLoading, setHcpLoading] = useState(false);
  const [nonHcpLoading, setNonHcpLoading] = useState(false);
  const [kolLoading, setKolLoading] = useState(false);
  const [ugcLoading, setUgcLoading] = useState(false);
  const [platformLoading, setPlatformLoading] = useState(false); // 新增平台加载状态

  // 一级标签切换状态
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('kpiOverview');
  // 🌟 修改：初始化二级标签为hcp（保持原有逻辑）
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('hcp');

  // 复制成功提示
  const [copySuccess, setCopySuccess] = useState('');

  // 刷新控制
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // 按钮hover状态管理
  const [copyBtnHovered, setCopyBtnHovered] = useState<string | null>(null);
  const [tabBtnHovered, setTabBtnHovered] = useState<string | null>(null);
  const [subTabBtnHovered, setSubTabBtnHovered] = useState<string | null>(null);

  // 图表引用 - 修复类型问题：使用类型断言
  const kpiVoiceChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const kpiInteractChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const kpiSovAreaChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const kpiSoeAreaChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;

  const hcpVoiceChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const hcpInteractChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const hcpSovAreaChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const hcpSoeAreaChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;

  const nonHcpVoiceChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const nonHcpInteractChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const nonHcpSovAreaChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const nonHcpSoeAreaChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;

  // KOL图表引用
  const kolVoiceChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const kolInteractChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const kolSovAreaChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const kolSoeAreaChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;

  // UGC图表引用（新增）
  const ugcVoiceChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const ugcInteractChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const ugcSovAreaChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const ugcSoeAreaChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;

  // 新增：平台分布图表引用
  const platformVoiceChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const platformInteractChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const platformSovChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;
  const platformSoeChartRef = useRef<ReactECharts>(null) as RefObject<ReactECharts>;

  // 切换一级标签时重置二级标签为默认值
  useEffect(() => {
    if (activeMainTab === 'hcpNonHcp') {
      setActiveSubTab('hcpNonHcpCompare');
    } else if (activeMainTab === 'kolUgc') {
      setActiveSubTab('kolUgcCompare');
    }
  }, [activeMainTab]);

  // ====================== 【核心：复制功能】 ======================
  // 复制文本到剪贴板的通用函数
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

  // 复制通用表格数据（月份+分子式+各项指标）
  const copyTableData = (tableData: ProcessedTableData, panelName: string) => {
    if (tableData.sortedDates.length === 0 || tableData.molecules.length === 0) {
      setCopySuccess('暂无数据可复制');
      setTimeout(() => setCopySuccess(''), 1500);
      return;
    }

    // 构建表头
    const header = ['月份'];
    tableData.molecules.forEach(mol => {
      header.push(`${mol}-总声量`, `${mol}-SOV`, `${mol}-总互动量`, `${mol}-SOE`);
    });

    const lines = [header.join('\t')];

    // 构建数据行
    tableData.sortedDates.forEach(date => {
      const row = [date];
      tableData.molecules.forEach(mol => {
        const data = tableData.grouped[date][mol];
        row.push(data.totalVoice, data.sov, data.totalInteract, data.soe);
      });
      lines.push(row.join('\t'));
    });

    copyToClipboard(lines.join('\n'), `${panelName} 表格数据已复制，可直接粘贴到 Excel`);
  };

  // 复制平台分布数据
  const copyPlatformData = (platformData: ProcessedPlatformData) => {
    if (platformData.platforms.length === 0 || platformData.molecules.length === 0) {
      setCopySuccess('暂无数据可复制');
      setTimeout(() => setCopySuccess(''), 1500);
      return;
    }

    // 构建表头
    const header = ['平台'];
    platformData.molecules.forEach(mol => {
      header.push(`${mol}-总声量`, `${mol}-SOV`, `${mol}-总互动量`, `${mol}-SOE`);
    });

    const lines = [header.join('\t')];

    // 构建数据行
    platformData.platforms.forEach(platform => {
      const row = [platform];
      platformData.molecules.forEach(mol => {
        const data = platformData.grouped[platform]?.[mol] || {
          totalVoice: '-', sov: '-', totalInteract: '-', soe: '-'
        };
        row.push(data.totalVoice, data.sov, data.totalInteract, data.soe);
      });
      lines.push(row.join('\t'));
    });

    copyToClipboard(lines.join('\n'), `平台分布数据（${platformData.selectedMonth}）已复制，可直接粘贴到 Excel`);
  };

  // 复制单个图表数据（折线图/面积图）
  const copyChartData = (
    tableData: ProcessedTableData,
    indicatorType: 'totalVoice' | 'totalInteract' | 'sov' | 'soe',
    indicatorName: string,
    panelName: string
  ) => {
    if (tableData.sortedDates.length === 0 || tableData.molecules.length === 0) {
      setCopySuccess('暂无数据可复制');
      setTimeout(() => setCopySuccess(''), 1500);
      return;
    }

    // 构建表头
    const header = ['月份', ...tableData.molecules];
    const lines = [header.join('\t')];

    // 构建数据行
    tableData.sortedDates.forEach(date => {
      const row = [date];
      tableData.molecules.forEach(mol => {
        const value = tableData.grouped[date][mol][indicatorType];
        row.push(value);
      });
      lines.push(row.join('\t'));
    });

    copyToClipboard(lines.join('\n'), `${panelName} - ${indicatorName} 数据已复制，可直接粘贴到 Excel`);
  };

  // 复制平台图表数据
  const copyPlatformChartData = (
    platformData: ProcessedPlatformData,
    indicatorType: 'totalVoice' | 'totalInteract' | 'sov' | 'soe',
    indicatorName: string
  ) => {
    if (platformData.platforms.length === 0 || platformData.molecules.length === 0) {
      setCopySuccess('暂无数据可复制');
      setTimeout(() => setCopySuccess(''), 1500);
      return;
    }

    // 构建表头
    const header = ['平台', ...platformData.molecules];
    const lines = [header.join('\t')];

    // 构建数据行
    platformData.platforms.forEach(platform => {
      const row = [platform];
      platformData.molecules.forEach(mol => {
        const data = platformData.grouped[platform]?.[mol] || {
          totalVoice: '-', sov: '-', totalInteract: '-', soe: '-'
        };
        row.push(data[indicatorType]);
      });
      lines.push(row.join('\t'));
    });

    copyToClipboard(lines.join('\n'), `平台分布 - ${indicatorName} 数据（${platformData.selectedMonth}）已复制，可直接粘贴到 Excel`);
  };

  // ====================== 【刷新功能】 ======================
  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setRefreshing(false), 800);
  };

  // ==============================================================

  // 数据处理函数：通用数据处理逻辑（抽离复用）
  const processTableData = (rawData: RawDataItem[], splitType: string): ProcessedTableData => {
    const filtered = rawData.filter(item =>
      item.fields?.['标题'] === '重点分子式声量及互动量表现（红书） ' &&
      item.fields?.['拆分方式'] === splitType && // 根据传入的拆分方式筛选
      item.fields?.['分子式']
    );

    const grouped: Record<string, Record<string, MoleculeData>> = {};
    const dates = new Set<string>();
    // 定义标准分子式名称（用于匹配）
    const standardMolecules = [
      '氮䓬斯汀氟替卡松',
      '糠酸莫米松',
      '布地奈德',
      '丙酸氟替卡松'
    ];
    // 创建名称映射（处理可能的名称变体）
    const moleculeNameMap: Record<string, string> = {
      '氮䓬斯汀氟替卡松': '氮䓬斯汀氟替卡松',
      '糠酸莫米松': '糠酸莫米松',
      '糠酸莫米松鼻喷雾剂': '糠酸莫米松',
      '布地奈德': '布地奈德',
      '布地奈德鼻喷雾剂': '布地奈德',
      '丙酸氟替卡松': '丙酸氟替卡松',
      '丙酸氟替卡松鼻喷雾剂': '丙酸氟替卡松'
    };

    filtered.forEach(item => {
      const date = item.fields['日期'];
      let molecule = item.fields['分子式'];
      const indicator = item.fields['分析指标'];
      const value = item.fields['值'] || '-';

      if (!date || !molecule) return;

      // 标准化分子式名称并映射到标准名称
      const normalizedName = normalizeMoleculeName(molecule);
      // 查找匹配的标准名称
      const matchedName = moleculeNameMap[normalizedName] ||
                          Object.entries(moleculeNameMap).find(([key]) =>
                            normalizedName.includes(key) || key.includes(normalizedName)
                          )?.[1] ||
                          normalizedName;

      // 只处理标准列表中的分子式
      if (!standardMolecules.includes(matchedName)) return;

      if (!grouped[date]) {
        grouped[date] = {};
        standardMolecules.forEach(mol => {
          grouped[date][mol] = { totalVoice: '-', sov: '-', totalInteract: '-', soe: '-' };
        });
      }

      dates.add(date);

      // 确保值是有效的（处理百分比、空值等）
      let processedValue = value;
      if (processedValue === '' || processedValue === '无') {
        processedValue = '-';
      }

      switch (indicator) {
        case '总声量':
          grouped[date][matchedName].totalVoice = processedValue;
          break;
        case 'SOV':
          grouped[date][matchedName].sov = processedValue;
          break;
        case '总互动量':
          grouped[date][matchedName].totalInteract = processedValue;
          break;
        case 'SOE':
          grouped[date][matchedName].soe = processedValue;
          break;
      }
    });

    const sortedDates = Array.from(dates).sort((a, b) => {
      return parseMonthString(a).getTime() - parseMonthString(b).getTime();
    });

    return { grouped, sortedDates, molecules: standardMolecules };
  };

  // 新增：平台分布数据处理函数
  const processPlatformData = (rawData: RawDataItem[], splitType: string, targetMonth: string): ProcessedPlatformData => {
    const filtered = rawData.filter(item =>
      item.fields?.['标题'] === '重点分子式声量及互动量表现（红书） ' &&
      item.fields?.['拆分方式'] === splitType &&
      item.fields?.['日期'] === targetMonth && // 筛选指定月份
      item.fields?.['分子式'] &&
      item.fields?.['平台']
    );

    const grouped: Record<string, Record<string, MoleculeData>> = {};
    const platforms = new Set<string>();
    const standardMolecules = [
      '氮䓬斯汀氟替卡松',
      '糠酸莫米松',
      '布地奈德',
      '丙酸氟替卡松'
    ];

    const moleculeNameMap: Record<string, string> = {
      '氮䓬斯汀氟替卡松': '氮䓬斯汀氟替卡松',
      '糠酸莫米松': '糠酸莫米松',
      '糠酸莫米松鼻喷雾剂': '糠酸莫米松',
      '布地奈德': '布地奈德',
      '布地奈德鼻喷雾剂': '布地奈德',
      '丙酸氟替卡松': '丙酸氟替卡松',
      '丙酸氟替卡松鼻喷雾剂': '丙酸氟替卡松'
    };

    filtered.forEach(item => {
      const platform = item.fields['平台'];
      let molecule = item.fields['分子式'];
      const indicator = item.fields['分析指标'];
      const value = item.fields['值'] || '-';

      if (!platform || !molecule) return;

      // 标准化分子式名称
      const normalizedName = normalizeMoleculeName(molecule);
      const matchedName = moleculeNameMap[normalizedName] ||
                          Object.entries(moleculeNameMap).find(([key]) =>
                            normalizedName.includes(key) || key.includes(normalizedName)
                          )?.[1] ||
                          normalizedName;

      if (!standardMolecules.includes(matchedName)) return;

      if (!grouped[platform]) {
        grouped[platform] = {};
        standardMolecules.forEach(mol => {
          grouped[platform][mol] = { totalVoice: '-', sov: '-', totalInteract: '-', soe: '-' };
        });
      }

      platforms.add(platform);

      let processedValue = value;
      if (processedValue === '' || processedValue === '无') {
        processedValue = '-';
      }

      switch (indicator) {
        case '总声量':
          grouped[platform][matchedName].totalVoice = processedValue;
          break;
        case 'SOV':
          grouped[platform][matchedName].sov = processedValue;
          break;
        case '总互动量':
          grouped[platform][matchedName].totalInteract = processedValue;
          break;
        case 'SOE':
          grouped[platform][matchedName].soe = processedValue;
          break;
      }
    });

    // 平台排序（可自定义排序规则）
    const sortedPlatforms = Array.from(platforms).sort();

    return {
      grouped,
      platforms: sortedPlatforms,
      molecules: standardMolecules,
      selectedMonth: targetMonth
    };
  };

  // 获取KPI总览数据（拆分方式：全量数据）
  useEffect(() => {
    if (activeMainTab === 'kpiOverview') {
      const fetchKpiData = async () => {
        try {
          setKpiLoading(true);
          const res = await axios.get('http://localhost:3000/api/feishu/XHS');
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

  // 获取HCP数据（拆分方式：HCP）
  useEffect(() => {
    if (activeMainTab === 'hcpNonHcp' && activeSubTab === 'hcp') {
      const fetchHcpData = async () => {
        try {
          setHcpLoading(true);
          const res = await axios.get('http://localhost:3000/api/feishu/XHSHCP');
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

  // 获取NON-HCP数据（拆分方式：NON-HCP）
  useEffect(() => {
    if (activeMainTab === 'hcpNonHcp' && activeSubTab === 'nonHcp') {
      const fetchNonHcpData = async () => {
        try {
          setNonHcpLoading(true);
          const res = await axios.get('http://localhost:3000/api/feishu/XHSNONHCP');
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

  // 获取KOL数据（拆分方式：KOL）
  useEffect(() => {
    if (activeMainTab === 'kolUgc' && activeSubTab === 'kol') {
      const fetchKolData = async () => {
        try {
          setKolLoading(true);
          const res = await axios.get('http://localhost:3000/api/feishu/XHSKOL');
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

  // 获取UGC数据（拆分方式：UGC）- 新增
  useEffect(() => {
    if (activeMainTab === 'kolUgc' && activeSubTab === 'ugc') {
      const fetchUgcData = async () => {
        try {
          setUgcLoading(true);
          const res = await axios.get('http://localhost:3000/api/feishu/XHSUGC');
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

  // 新增：获取平台分布数据
  useEffect(() => {
    if (activeMainTab === 'voicePlatformDistribution') {
      const fetchPlatformData = async () => {
        try {
          setPlatformLoading(true);
          // 请根据实际接口地址修改
          const res = await axios.get('http://localhost:3000/api/feishu/XHSDistribution');
          const processedPlatformData = processPlatformData(
            res.data as RawDataItem[],
            '声量及互动量平台分布',
            selectedMonth // 使用从context获取的选中月份
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

  // 监听窗口大小变化，重绘所有图表保证响应式
  useEffect(() => {
    const resizeHandler = () => {
      // KPI图表重绘
      kpiVoiceChartRef.current?.getEchartsInstance().resize();
      kpiInteractChartRef.current?.getEchartsInstance().resize();
      kpiSovAreaChartRef.current?.getEchartsInstance().resize();
      kpiSoeAreaChartRef.current?.getEchartsInstance().resize();

      // HCP图表重绘
      hcpVoiceChartRef.current?.getEchartsInstance().resize();
      hcpInteractChartRef.current?.getEchartsInstance().resize();
      hcpSovAreaChartRef.current?.getEchartsInstance().resize();
      hcpSoeAreaChartRef.current?.getEchartsInstance().resize();

      // NON-HCP图表重绘
      nonHcpVoiceChartRef.current?.getEchartsInstance().resize();
      nonHcpInteractChartRef.current?.getEchartsInstance().resize();
      nonHcpSovAreaChartRef.current?.getEchartsInstance().resize();
      nonHcpSoeAreaChartRef.current?.getEchartsInstance().resize();

      // KOL图表重绘
      kolVoiceChartRef.current?.getEchartsInstance().resize();
      kolInteractChartRef.current?.getEchartsInstance().resize();
      kolSovAreaChartRef.current?.getEchartsInstance().resize();
      kolSoeAreaChartRef.current?.getEchartsInstance().resize();

      // UGC图表重绘 - 新增
      ugcVoiceChartRef.current?.getEchartsInstance().resize();
      ugcInteractChartRef.current?.getEchartsInstance().resize();
      ugcSovAreaChartRef.current?.getEchartsInstance().resize();
      ugcSoeAreaChartRef.current?.getEchartsInstance().resize();

      // 新增：平台分布图表重绘
      platformVoiceChartRef.current?.getEchartsInstance().resize();
      platformInteractChartRef.current?.getEchartsInstance().resize();
      platformSovChartRef.current?.getEchartsInstance().resize();
      platformSoeChartRef.current?.getEchartsInstance().resize();
    };

    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  // 表格样式配置
  const tableStyles = {
    container: {
      marginTop: '20px',
      overflowX: 'auto' as const,
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      lineHeight: '1.2',

    },
    headerRow1: {
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      lineHeight: '1.2'
    },
    headerRow2: {
      backgroundColor: '#4b5563',
      color: '#ffffff',
      lineHeight: '1.2',

    },
    bodyRow: {
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      lineHeight: '1.2'
    },
    cell: {
      border: '1px solid #d1d5db',
      padding: '6px 8px',
      textAlign: 'center' as const
    },
    headerCell: {
      border: '1px solid #d1d5db',
      padding: '6px 8px',
      textAlign: 'center' as const,
      fontWeight: 600
    },
    diminsiHeaderCell: {
    border: '1px solid #d1d5db',
    padding: '6px 8px',
    textAlign: 'center' as const,
    fontWeight: 600,
    backgroundColor: '#ffb900', // 琥珀色表头
    color: '#44403c', // 深色文字
  },
    subHeaderCell: {
      border: '1px solid #d1d5db',
      padding: '4px 6px',
      textAlign: 'center' as const,
      fontWeight: 500
    }
  };

  // 复制按钮样式 - 修复hover问题：使用状态控制样式
  const getCopyBtnStyle = (disabled: boolean, btnKey: string) => {
    const baseStyle: React.CSSProperties = {
      padding: '6px 14px',
      fontSize: 13,
      borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
      borderRadius: 8,
      background: '#fff',
      cursor: 'pointer',
      transition: 'all 0.2s',
      margin: '0 8px 8px 0'
    };

    if (disabled) {
      return {
        ...baseStyle,
        cursor: 'not-allowed',
        opacity: 0.6,
        background: '#f1f5f9',
        borderColor: '#e2e8f0'
      };
    }

    if (copyBtnHovered === btnKey) {
      return {
        ...baseStyle,
        background: '#f8fafc',
        borderColor: '#cbd5e1'
      };
    }

    return baseStyle;
  };

  // 通用面板渲染函数（复用表格+图表布局）
  const renderCommonPanel = (
    tableData: ProcessedTableData,
    loading: boolean,
    chartRefs: {
      voice: RefObject<ReactECharts>,
      interact: RefObject<ReactECharts>,
      sovArea: RefObject<ReactECharts>,
      soeArea: RefObject<ReactECharts>
    },
    panelTitle: string
  ) => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '120px',
          color: '#64748b'
        }}>
          {panelTitle}数据加载中...
        </div>
      );
    }

    return (
      <>
        {/* 表格区域 + 复制按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#475569' }}>{panelTitle} 数据表格</span>
          <button
            style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `table-${panelTitle}`)}
            onClick={() => copyTableData(tableData, panelTitle)}
            disabled={loading || tableData.sortedDates.length === 0}
            onMouseEnter={() => setCopyBtnHovered(`table-${panelTitle}`)}
            onMouseLeave={() => setCopyBtnHovered(null)}
          >
            复制完整表格数据到 Excel
          </button>
        </div>

        {/* 表格区域 */}
        <div style={tableStyles.container}>
          <table style={tableStyles.table}>
            <thead>
              <tr style={tableStyles.headerRow1}>
                <th
                  rowSpan={3}
                  style={{ ...tableStyles.headerCell, width: '80px' }}
                >
                  月份
                </th>
                {tableData.molecules.map(mol => (
                  <th
                    key={mol}
                    colSpan={4}
                    style={{ ...mol === '氮䓬斯汀氟替卡松' ? tableStyles.diminsiHeaderCell :tableStyles.headerCell, }}
                  >
                    {mol}
                  </th>
                ))}
              </tr>
              <tr style={tableStyles.headerRow2}>
                {tableData.molecules.map(mol => (
                  <React.Fragment key={mol}>
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
                    {tableData.molecules.map(mol => {
                      const data = tableData.grouped[date][mol];
                      return (
                        <React.Fragment key={mol}>
                          <td style={tableStyles.cell}>{data.totalVoice}</td>
                          <td
                            style={{
                              ...tableStyles.cell,
                              color: data.sov.includes('%') ? '#16a34a' : '#1e293b'
                            }}
                          >
                            {data.sov}
                          </td>
                          <td style={tableStyles.cell}>{data.totalInteract}</td>
                          <td
                            style={{
                              ...tableStyles.cell,
                              color: data.soe.includes('%') ? '#16a34a' : '#1e293b'
                            }}
                          >
                            {data.soe}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableData.molecules.length * 4 + 1} style={tableStyles.cell}>
                    暂无相关数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 第一组图表：总声量折线图 + SOV堆叠面积图 */}
        <div style={{
          marginTop: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* 折线图行 */}
          <div style={{
            display: 'flex',
            gap: '24px',
            width: '100%'
          }}>
                         {/* 总声量趋势图 */}
             <div style={{ flex: 1, minWidth: '48%', background: '#fff', borderRadius: 8, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                 <div style={{ fontSize: 15, fontWeight: 500 }}>{panelTitle} - 总声量趋势</div>
                 <button
                   style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `voice-${panelTitle}`)}
                   onClick={() => copyChartData(tableData, 'totalVoice', '总声量', panelTitle)}
                   disabled={loading || tableData.sortedDates.length === 0}
                   onMouseEnter={() => setCopyBtnHovered(`voice-${panelTitle}`)}
                   onMouseLeave={() => setCopyBtnHovered(null)}
                 >
                   复制数据
                 </button>
               </div>
               <ReactECharts
                 ref={chartRefs.voice}
                 option={getLineChartOption(
                   tableData.sortedDates,
                   tableData.grouped,
                   tableData.molecules,
                   'totalVoice',
                   '总声量'
                 )}
                 style={{ height: '380px' }}
               />
             </div>

             {/* 总互动量趋势图 */}
             <div style={{ flex: 1, minWidth: '48%', background: '#fff', borderRadius: 8, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                 <div style={{ fontSize: 15, fontWeight: 500 }}>总互动量趋势</div>
                 <button
                                      style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `interact-${panelTitle}`)}
                   onClick={() => copyChartData(tableData, 'totalInteract', '总互动量', panelTitle)}
                   disabled={loading || tableData.sortedDates.length === 0}
                   onMouseEnter={() => setCopyBtnHovered(`interact-${panelTitle}`)}
                   onMouseLeave={() => setCopyBtnHovered(null)}
                 >
                   复制数据
                 </button>
               </div>
               <ReactECharts
                 ref={chartRefs.interact}
                 option={getLineChartOption(
                   tableData.sortedDates,
                   tableData.grouped,
                   tableData.molecules,
                   'totalInteract',
                   '总互动量'
                 )}
                 style={{ height: '380px' }}
               />
             </div>
           </div>

           {/* 面积图行 */}
           <div style={{
             display: 'flex',
             gap: '24px',
             width: '100%'
           }}>
             {/* SOV堆叠面积图 */}
             <div style={{ flex: 1, minWidth: '48%', background: '#fff', borderRadius: 8, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                 <div style={{ fontSize: 15, fontWeight: 500 }}>SOV占比趋势</div>
                 <button
                   style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `sov-${panelTitle}`)}
                   onClick={() => copyChartData(tableData, 'sov', 'SOV', panelTitle)}
                   disabled={loading || tableData.sortedDates.length === 0}
                   onMouseEnter={() => setCopyBtnHovered(`sov-${panelTitle}`)}
                   onMouseLeave={() => setCopyBtnHovered(null)}
                 >
                   复制数据
                 </button>
               </div>
               <ReactECharts
                 ref={chartRefs.sovArea}
                 option={getAreaChartOption(
                   tableData.sortedDates,
                   tableData.grouped,
                   tableData.molecules,
                   'sov',
                   'SOV（%）'
                 )}
                 style={{ height: '380px' }}
               />
             </div>

             {/* SOE堆叠面积图 */}
             <div style={{ flex: 1, minWidth: '48%', background: '#fff', borderRadius: 8, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                 <div style={{ fontSize: 15, fontWeight: 500 }}>SOE占比趋势</div>
                 <button
                   style={getCopyBtnStyle(loading || tableData.sortedDates.length === 0, `soe-${panelTitle}`)}
                   onClick={() => copyChartData(tableData, 'soe', 'SOE', panelTitle)}
                   disabled={loading || tableData.sortedDates.length === 0}
                   onMouseEnter={() => setCopyBtnHovered(`soe-${panelTitle}`)}
                   onMouseLeave={() => setCopyBtnHovered(null)}
                 >
                   复制数据
                 </button>
               </div>
               <ReactECharts
                 ref={chartRefs.soeArea}
                 option={getAreaChartOption(
                   tableData.sortedDates,
                   tableData.grouped,
                   tableData.molecules,
                   'soe',
                   'SOE（%）'
                 )}
                 style={{ height: '380px' }}
               />
             </div>
           </div>
         </div>
       </>
     );
   };

   // 平台分布面板渲染函数
   const renderPlatformPanel = (
     platformData: ProcessedPlatformData,
     loading: boolean
   ) => {
     if (loading) {
       return (
         <div style={{
           display: 'flex',
           justifyContent: 'center',
           alignItems: 'center',
           height: '120px',
           color: '#64748b'
         }}>
           平台分布数据加载中...
         </div>
       );
     }

     return (
       <>
         {/* 表格区域 + 复制按钮 */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
           <span style={{ fontSize: '15px', fontWeight: 500, color: '#475569' }}>
             声量及互动量平台分布数据表格（{platformData.selectedMonth}）
           </span>
           <button
             style={getCopyBtnStyle(loading || platformData.platforms.length === 0, 'table-platform')}
             onClick={() => copyPlatformData(platformData)}
             disabled={loading || platformData.platforms.length === 0}
             onMouseEnter={() => setCopyBtnHovered('table-platform')}
             onMouseLeave={() => setCopyBtnHovered(null)}
           >
             复制完整表格数据到 Excel
           </button>
         </div>

         {/* 平台分布表格 */}
         <div style={tableStyles.container}>
           <table style={tableStyles.table}>
             <thead>
               <tr style={tableStyles.headerRow1}>
                 <th
                   rowSpan={3}
                   style={{ ...tableStyles.headerCell, width: '120px' }}
                 >
                   平台
                 </th>
                 {platformData.molecules.map(mol => (
                   <th
                     key={mol}
                     colSpan={4}
                     style={{ ...mol === '氮䓬斯汀氟替卡松' ? tableStyles.diminsiHeaderCell :tableStyles.headerCell, }}
                   >
                     {mol}
                   </th>
                 ))}
               </tr>
               <tr style={tableStyles.headerRow2}>
                 {platformData.molecules.map(mol => (
                   <React.Fragment key={mol}>
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
               {platformData.platforms.length > 0 ? (
                 platformData.platforms.map(platform => (
                   <tr key={platform} style={tableStyles.bodyRow}>
                     <td style={{ ...tableStyles.cell, fontWeight: 500 }}>{platform}</td>
                     {platformData.molecules.map(mol => {
                       const data = platformData.grouped[platform]?.[mol] || {
                         totalVoice: '-', sov: '-', totalInteract: '-', soe: '-'
                       };
                       return (
                         <React.Fragment key={mol}>
                           <td style={tableStyles.cell}>{data.totalVoice}</td>
                           <td
                             style={{
                               ...tableStyles.cell,
                               color: data.sov.includes('%') ? '#16a34a' : '#1e293b'
                             }}
                           >
                             {data.sov}
                           </td>
                           <td style={tableStyles.cell}>{data.totalInteract}</td>
                           <td
                             style={{
                               ...tableStyles.cell,
                               color: data.soe.includes('%') ? '#16a34a' : '#1e293b'
                             }}
                           >
                             {data.soe}
                           </td>
                         </React.Fragment>
                       );
                     })}
                   </tr>
                 ))
               ) : (
                 <tr>
                   <td colSpan={platformData.molecules.length * 4 + 1} style={tableStyles.cell}>
                     暂无相关数据
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>

         {/* 平台分布图表区域 */}
         <div style={{
           marginTop: '32px',
           display: 'flex',
           flexDirection: 'column',
           gap: '16px'
         }}>
           {/* 第一组图表：总声量 + 总互动量 */}
           <div style={{
             display: 'flex',
             gap: '24px',
             width: '100%'
           }}>
             {/* 总声量平台分布 */}
             <div style={{ flex: 1, minWidth: '48%', background: '#fff', borderRadius: 8, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                 <div style={{ fontSize: 15, fontWeight: 500 }}>总声量平台分布</div>
                 <button
                   style={getCopyBtnStyle(loading || platformData.platforms.length === 0, 'voice-platform')}
                   onClick={() => copyPlatformChartData(platformData, 'totalVoice', '总声量')}
                   disabled={loading || platformData.platforms.length === 0}
                   onMouseEnter={() => setCopyBtnHovered('voice-platform')}
                   onMouseLeave={() => setCopyBtnHovered(null)}
                 >
                   复制数据
                 </button>
               </div>
               <ReactECharts
                 ref={platformVoiceChartRef}
                 option={getPlatformChartOption(
                   platformData.platforms,
                   platformData.grouped,
                   platformData.molecules,
                   'totalVoice',
                   '总声量',
                   false
                 )}
                 style={{ height: '400px' }}
               />
             </div>

             {/* 总互动量平台分布 */}
             <div style={{ flex: 1, minWidth: '48%', background: '#fff', borderRadius: 8, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                 <div style={{ fontSize: 15, fontWeight: 500 }}>总互动量平台分布</div>
                 <button
                   style={getCopyBtnStyle(loading || platformData.platforms.length === 0, 'interact-platform')}
                   onClick={() => copyPlatformChartData(platformData, 'totalInteract', '总互动量')}
                   disabled={loading || platformData.platforms.length === 0}
                   onMouseEnter={() => setCopyBtnHovered('interact-platform')}
                   onMouseLeave={() => setCopyBtnHovered(null)}
                 >
                   复制数据
                 </button>
               </div>
               <ReactECharts
                 ref={platformInteractChartRef}
                 option={getPlatformChartOption(
                   platformData.platforms,
                   platformData.grouped,
                   platformData.molecules,
                   'totalInteract',
                   '总互动量',
                   false
                 )}
                 style={{ height: '400px' }}
               />
             </div>
           </div>

           {/* 第二组图表：SOV + SOE */}
           <div style={{
             display: 'flex',
             gap: '24px',
             width: '100%'
           }}>
             {/* SOV平台分布 */}
             <div style={{ flex: 1, minWidth: '48%', background: '#fff', borderRadius: 8, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                 <div style={{ fontSize: 15, fontWeight: 500 }}>SOV平台分布</div>
                 <button
                   style={getCopyBtnStyle(loading || platformData.platforms.length === 0, 'sov-platform')}
                   onClick={() => copyPlatformChartData(platformData, 'sov', 'SOV')}
                   disabled={loading || platformData.platforms.length === 0}
                   onMouseEnter={() => setCopyBtnHovered('sov-platform')}
                   onMouseLeave={() => setCopyBtnHovered(null)}
                 >
                   复制数据
                 </button>
               </div>
               <ReactECharts
                 ref={platformSovChartRef}
                 option={getPlatformChartOption(
                   platformData.platforms,
                   platformData.grouped,
                   platformData.molecules,
                   'sov',
                   'SOV（%）',
                   true
                 )}
                 style={{ height: '400px' }}
               />
             </div>

             {/* SOE平台分布 */}
             <div style={{ flex: 1, minWidth: '48%', background: '#fff', borderRadius: 8, padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                 <div style={{ fontSize: 15, fontWeight: 500 }}>SOE平台分布</div>
                 <button
                   style={getCopyBtnStyle(loading || platformData.platforms.length === 0, 'soe-platform')}
                   onClick={() => copyPlatformChartData(platformData, 'soe', 'SOE')}
                   disabled={loading || platformData.platforms.length === 0}
                   onMouseEnter={() => setCopyBtnHovered('soe-platform')}
                   onMouseLeave={() => setCopyBtnHovered(null)}
                 >
                   复制数据
                 </button>
               </div>
               <ReactECharts
                 ref={platformSoeChartRef}
                 option={getPlatformChartOption(
                   platformData.platforms,
                   platformData.grouped,
                   platformData.molecules,
                   'soe',
                   'SOE（%）',
                   true
                 )}
                 style={{ height: '400px' }}
               />
             </div>
           </div>
         </div>
       </>
     );
   };

   // 标签按钮样式
   const getTabBtnStyle = (isActive: boolean, btnKey: string, isSubTab = false) => {
     const baseStyle: React.CSSProperties = {
       padding: isSubTab ? '6px 16px' : '8px 20px',
       fontSize: isSubTab ? 14 : 15,
       border: 'none',
       borderRadius: 6,
       cursor: 'pointer',
       transition: 'all 0.2s',
       fontWeight: 500,
       marginRight: isSubTab ? 8 : 12
     };

     if (isActive) {
       return {
         ...baseStyle,
         background: '#1890ff',
         color: '#fff',
         boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)'
       };
     }

     const hoverKey = isSubTab ? `sub-${btnKey}` : `main-${btnKey}`;
     if ((!isSubTab && tabBtnHovered === hoverKey) || (isSubTab && subTabBtnHovered === hoverKey)) {
       return {
         ...baseStyle,
         background: '#f0f7ff',
         color: '#1890ff'
       };
     }

     return {
       ...baseStyle,
       background: '#f9fafb',
       color: '#475569'
     };
   };

   return (
     <div style={{
       padding: '24px',
       background: '#f8fafc',
       minHeight: '100vh',
       fontFamily: 'Inter, sans-serif'
     }}>
       {/* 顶部标题和刷新按钮 */}
       <div style={{
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center',
         marginBottom: '24px'
       }}>
         <h1 style={{
           fontSize: '22px',
           color: '#1e293b',
           fontWeight: 600,
           margin: 0
         }}>
           重点分子式声量及互动量分析
         </h1>
         <div style={{ display: 'flex', alignItems: 'center' }}>
           <button
             style={{
               padding: '8px 16px',
               fontSize: 14,
               border: '1px solid #e2e8f0',
               borderRadius: 8,
               background: refreshing ? '#f0f7ff' : '#fff',
               color: '#1890ff',
               cursor: refreshing ? 'not-allowed' : 'pointer',
               display: 'flex',
               alignItems: 'center',
               gap: 8,
               transition: 'all 0.2s'
             }}
             onClick={handleRefresh}
             disabled={refreshing}
           >
             <span>{refreshing ? '刷新中...' : '刷新数据'}</span>
             <svg
               xmlns="http://www.w3.org/2000/svg"
               width="16"
               height="16"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="2"
               strokeLinecap="round"
               strokeLinejoin="round"
               style={{
                 transform: refreshing ? 'rotate(180deg)' : 'rotate(0)',
                 transition: 'transform 0.5s ease'
               }}
             >
               <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
               <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
             </svg>
           </button>
         </div>
       </div>

       {/* 复制成功提示 */}
       {copySuccess && (
         <div style={{
           position: 'fixed',
           top: '20px',
           right: '20px',
           background: '#10b981',
           color: '#fff',
           padding: '10px 16px',
           borderRadius: '8px',
           boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
           zIndex: 1000,
           fontSize: '14px'
         }}>
           {copySuccess}
         </div>
       )}

       {/* 一级标签栏 */}
       <div style={{
         display: 'flex',
         marginBottom: '24px',
         alignItems: 'center'
       }}>
         {mainTabConfig.map((tab) => (
           <button
             key={tab.key}
             style={getTabBtnStyle(activeMainTab === tab.key, tab.key)}
             onClick={() => setActiveMainTab(tab.key as MainTabType)}
             onMouseEnter={() => setTabBtnHovered(`main-${tab.key}`)}
             onMouseLeave={() => setTabBtnHovered(null)}
           >
             {tab.label}
           </button>
         ))}
       </div>

       {/* 二级标签栏（仅在HCP/NON-HCP和KOL/UGC标签下显示） */}
       {(activeMainTab === 'hcpNonHcp' || activeMainTab === 'kolUgc') && (
         <div style={{
           display: 'flex',
           marginBottom: '24px',
           paddingLeft: '4px'
         }}>
           {subTabConfigs[activeMainTab].map((tab) => (
             <button
               key={tab.key}
               style={getTabBtnStyle(activeSubTab === tab.key, tab.key, true)}
               onClick={() => setActiveSubTab(tab.key as SubTabType)}
               onMouseEnter={() => setSubTabBtnHovered(`sub-${tab.key}`)}
               onMouseLeave={() => setSubTabBtnHovered(null)}
             >
               {tab.label}
             </button>
           ))}
         </div>
       )}

       {/* 主内容区域 */}
       <div style={{
         background: '#fff',
         borderRadius: '12px',
         padding: '24px',
         boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
       }}>
         {/* KPI总览面板 */}
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

         {/* HCP面板 */}
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

         {/* NON-HCP面板 */}
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

         {/* HCP/NON-HCP对比面板 */}
         {activeMainTab === 'hcpNonHcp' && activeSubTab === 'hcpNonHcpCompare' && (
           <HcpNonHcpComparePanel
             copyBtnHovered={copyBtnHovered}
             setCopyBtnHovered={setCopyBtnHovered}
             setCopySuccess={setCopySuccess}
             refreshKey={refreshKey}
             getCopyBtnStyle={getCopyBtnStyle}
             copyTableData={copyTableData}
             tableStyles={tableStyles}
           />
         )}

         {/* KOL面板 */}
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

         {/* UGC面板 */}
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



                  {/* KOL/UGC对比面板 */}
         {activeMainTab === 'kolUgc' && activeSubTab === 'kolUgcCompare' && (
           <KolUgcComparePanel
             copyBtnHovered={copyBtnHovered}
             setCopyBtnHovered={setCopyBtnHovered}
             setCopySuccess={setCopySuccess}
             refreshKey={refreshKey}
             getCopyBtnStyle={getCopyBtnStyle}
             copyTableData={copyTableData}
             tableStyles={tableStyles}
           />
         )}



         {/* 平台分布面板 */}
         {activeMainTab === 'voicePlatformDistribution' && renderPlatformPanel(
           platformTableData,
           platformLoading
         )}
       </div>
     </div>
   );
}