/*
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
*/
/*
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface FeishuRecord {
  record_id: string;
  fields: {
    [key: string]: string | number;
    // 假设你的日期字段叫“日期”，可以根据实际字段名修改
    日期?: string;
  };
}

export default function FeishuDataTable() {
  const [data, setData] = useState<FeishuRecord[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/feishu/records');
        setData(res.data);
      } catch (error) {
        console.error('获取飞书数据失败:', error);
      }
    };
    fetchData();
  }, []);

  if (data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>暂无数据</div>;
  }

  // 提取所有表头
  const allHeaders = Object.keys(data[0].fields);
  // 将“日期”字段移到最前面
  const dateKey = '日期';
  const tableHeaders = allHeaders.includes(dateKey)
    ? [dateKey, ...allHeaders.filter(key => key !== dateKey)]
    : allHeaders;

  return (
    <div style={{ padding: '20px', maxWidth: '1800px', margin: '0 auto' }}>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#165DFF', color: 'white' }}>
              {tableHeaders.map((header) => (
                <th
                  key={header}
                  style={{
                    padding: '14px 12px',
                    textAlign: 'center',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    borderBottom: '2px solid #e8e8e8',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((record, index) => (
              <tr
                key={record.record_id}
                style={{
                  backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f7ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fafafa' : 'white';
                }}
              >
                {tableHeaders.map((key) => (
                  <td
                    key={key}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #e8e8e8',
                      textAlign: 'center',
                      color: '#333',
                    }}
                  >
                    {record.fields[key] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
*/
/*
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface FeishuRecord {
  record_id: string;
  fields: {
    日期?: string;
    值?: string | number;
    分子式?: string;
    分析指标?: string;
    拆分方式?: string;
    [key: string]: string | number | undefined;
  };
}

// 聚合后的数据结构
interface AggregatedData {
  date: string;
  molecules: Record<
    string,
    {
      总产量: string | number | '-';
      SOV: string | number | '-';
      总互动量: string | number | '-';
      SOE: string | number | '-';
    }
  >;
}

export default function FeishuDataTable() {
  const [rawData, setRawData] = useState<FeishuRecord[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[]>([]);
  // 定义图二中的分子式顺序
  const moleculeOrder = ['氮䓬斯汀氟替卡松', '糠酸莫米松', '布地奈德', '丙酸氟替卡松'];
  // 定义每个分子式下的指标顺序
  const metrics = ['总产量', 'SOV', '总互动量', 'SOE'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/feishu/records');
        setRawData(res.data);
      } catch (error) {
        console.error('获取飞书数据失败:', error);
      }
    };
    fetchData();
  }, []);

  // 聚合数据
  useEffect(() => {
    if (rawData.length === 0) return;

    const agg: Record<string, AggregatedData['molecules']> = {};

    rawData.forEach((record) => {
      const { 日期, 值, 分子式, 分析指标 } = record.fields;
      if (!日期 || !分子式 || !分析指标 || 值 === undefined) return;

      if (!agg[日期]) {
        agg[日期] = moleculeOrder.reduce((acc, mol) => {
          acc[mol] = { 总产量: '-', SOV: '-', 总互动量: '-', SOE: '-' };
          return acc;
        }, {} as AggregatedData['molecules']);
      }

      if (agg[日期][分子式] && metrics.includes(分析指标)) {
        agg[日期][分子式][分析指标 as keyof typeof agg[日期][分子式]] = 值;
      }
    });

    // 转换为最终的数组格式
    const result = Object.entries(agg).map(([date, molecules]) => ({
      date,
      molecules,
    }));

    setAggregatedData(result);
  }, [rawData]);

  if (aggregatedData.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>暂无数据</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1800px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 600 }}>全量数据</h2>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <thead>

            <tr style={{ backgroundColor: '#F5F5F5' }}>
              <th
                rowSpan={2}
                style={{
                  padding: '14px 12px',
                  textAlign: 'center',
                  fontWeight: 500,
                  backgroundColor: '#E0E0E0',
                  borderRight: '1px solid #ccc',
                  borderBottom: '1px solid #ccc',
                }}
              >
                分子式
              </th>
              {moleculeOrder.map((mol) => (
                <th
                  key={mol}
                  colSpan={4}
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    backgroundColor: mol === '氮䓬斯汀氟替卡松' ? '#F9C74F' : '#E0E0E0',
                    color: mol === '氮䓬斯汀氟替卡松' ? '#8B4513' : '#333',
                    borderRight: '1px solid #ccc',
                    borderBottom: '1px solid #ccc',
                  }}
                >
                  {mol}
                </th>
              ))}
            </tr>

            <tr style={{ backgroundColor: '#F5F5F5' }}>
              {moleculeOrder.map((mol) =>
                metrics.map((metric) => (
                  <th
                    key={`${mol}-${metric}`}
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      fontWeight: 500,
                      backgroundColor: mol === '氮䓬斯汀氟替卡松' ? '#F37F1B' : '#F5F5F5',
                      color: mol === '氮䓬斯汀氟替卡松' ? 'white' : '#333',
                      borderRight: '1px solid #ccc',
                      borderBottom: '1px solid #ccc',
                    }}
                  >
                    {metric}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {aggregatedData.map((item) => (
              <tr
                key={item.date}
                style={{
                  backgroundColor: 'white',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f7ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <td
                  style={{
                    padding: '12px 14px',
                    borderRight: '1px solid #e8e8e8',
                    borderBottom: '1px solid #e8e8e8',
                    textAlign: 'center',
                    color: '#333',
                    fontWeight: 500,
                  }}
                >
                  {item.date}
                </td>
                {moleculeOrder.map((mol) =>
                  metrics.map((metric) => (
                    <td
                      key={`${item.date}-${mol}-${metric}`}
                      style={{
                        padding: '12px 14px',
                        borderRight: '1px solid #e8e8e8',
                        borderBottom: '1px solid #e8e8e8',
                        textAlign: 'center',
                        color: '#333',
                      }}
                    >
                      {item.molecules[mol]?.[metric] || '-'}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
*/


/*
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface FeishuRecord {
  record_id: string;
  fields: {
    日期: string;
    值: string | number;
    分子式: string;
    分析指标: string;
    拆分方式: string;
  };
}

// 固定的分子式列表
const FORMULAS = ['氮䓬斯汀氟替卡松', '糠酸莫米松', '布地奈德', '丙酸氟替卡松'];
// 固定的分析指标列表
const METRICS = ['总产量', 'SOV', '总互动量', 'SOE'];

export default function AggregatedDataTable() {
  const [rawData, setRawData] = useState<FeishuRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 从 API 获取原始数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/feishu/records');
        setRawData(res.data);
      } catch (error) {
        console.error('获取飞书数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>;
  }

  if (rawData.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>暂无数据</div>;
  }

  // 1. 提取所有唯一的日期并排序
  const allDates = Array.from(new Set(rawData.map(item => item.fields.日期))).sort();

  // 2. 聚合数据：按日期和分子式分组，提取对应指标的值
  const aggregatedData = allDates.map(date => {
    const row: any = { 日期: date };
    FORMULAS.forEach(formula => {
      METRICS.forEach(metric => {
        const record = rawData.find(
          item =>
            item.fields.日期 === date &&
            item.fields.分子式 === formula &&
            item.fields.分析指标 === metric
        );
        row[`${formula}_${metric}`] = record?.fields.值 || '-';
      });
    });
    return row;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>全量数据</h1>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >

          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th
                rowSpan={2}
                style={{
                  padding: '14px 12px',
                  textAlign: 'center',
                  fontWeight: 500,
                  border: '1px solid #e8e8e8',
                  backgroundColor: '#e8e8e8',
                }}
              >
                日期
              </th>
              {FORMULAS.map((formula) => (
                <th
                  key={formula}
                  colSpan={4}
                  style={{
                    padding: '14px 12px',
                    textAlign: 'center',
                    fontWeight: 500,
                    border: '1px solid #e8e8e8',
                    backgroundColor: formula === '氮䓬斯汀氟替卡松' ? '#f7d08a' : '#f0f0f0',
                  }}
                >
                  {formula}
                </th>
              ))}
            </tr>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              {FORMULAS.map((formula) =>
                METRICS.map((metric) => (
                  <th
                    key={`${formula}_${metric}`}
                    style={{
                      padding: '12px 10px',
                      textAlign: 'center',
                      fontWeight: 500,
                      border: '1px solid #e8e8e8',
                      backgroundColor: formula === '氮䓬斯汀氟替卡松' ? '#f5b84b' : '#f0f0f0',
                      color: formula === '氮䓬斯汀氟替卡松' ? 'white' : '#333',
                    }}
                  >
                    {metric}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {aggregatedData.map((row, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f7ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fafafa' : 'white';
                }}
              >
                <td
                  style={{
                    padding: '12px 14px',
                    border: '1px solid #e8e8e8',
                    textAlign: 'center',
                    color: '#333',
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  {row.日期}
                </td>
                {FORMULAS.map((formula) =>
                  METRICS.map((metric) => (
                    <td
                      key={`${formula}_${metric}`}
                      style={{
                        padding: '12px 14px',
                        border: '1px solid #e8e8e8',
                        textAlign: 'center',
                        color: '#333',
                      }}
                    >
                      {row[`${formula}_${metric}`]}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
*/



/*
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface FeishuRecord {
  record_id: string;
  fields: {
    日期?: string;
    值?: string | number;
    分子式?: string;
    分析指标?: string;
    拆分方式?: string;
  };
}

// 固定表头配置
const FIXED_FORMULAS = ['氮䓬斯汀氟替卡松', '糠酸莫米松', '布地奈德', '丙酸氟替卡松'];
const FIXED_METRICS = ['总产量', 'SOV', '总互动量', 'SOE'];

export default function AggregatedDataTable() {
  const [data, setData] = useState<FeishuRecord[]>([]);
  const [aggregatedData, setAggregatedData] = useState<Record<string, any>>({});
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/feishu/records');
        const rawData = res.data;

        // 1. 筛选出“拆分方式”为“全量数据”的记录
        const filteredData = rawData.filter(
          (record: FeishuRecord) => record.fields.拆分方式 === '全量数据'
        );

        // 2. 聚合数据：按 分子式 -> 分析指标 -> 日期 组织
        const agg: Record<string, any> = {};
        const dateSet = new Set<string>();

        filteredData.forEach((record) => {
          const { 日期, 值, 分子式, 分析指标 } = record.fields;
          if (日期 && 值 && 分子式 && 分析指标) {
            dateSet.add(日期);
            if (!agg[分子式]) agg[分子式] = {};
            if (!agg[分子式][分析指标]) agg[分子式][分析指标] = {};
            agg[分子式][分析指标][日期] = 值;
          }
        });

        // 3. 提取并排序所有日期
        const sortedDates = Array.from(dateSet).sort((a, b) => {
          const [aMonth, aYear] = a.split('-');
          const [bMonth, bYear] = b.split('-');
          return (parseInt(aYear) - parseInt(bYear)) ||
                 (['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(aMonth) -
                  ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(bMonth));
        });

        setData(filteredData);
        setAggregatedData(agg);
        setDates(sortedDates);
      } catch (error) {
        console.error('获取飞书数据失败:', error);
      }
    };
    fetchData();
  }, []);

  if (dates.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>暂无数据</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>全量数据</h1>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >

          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th
                rowSpan={2}
                style={{
                  padding: '14px 12px',
                  textAlign: 'center',
                  border: '1px solid #e8e8e8',
                  backgroundColor: '#e8e8e8',
                  fontWeight: 600
                }}
              >
                分子式
              </th>
              {FIXED_FORMULAS.map((formula) => (
                <th
                  key={formula}
                  colSpan={FIXED_METRICS.length}
                  style={{
                    padding: '14px 12px',
                    textAlign: 'center',
                    border: '1px solid #e8e8e8',
                    backgroundColor: formula === '氮䓬斯汀氟替卡松' ? '#f9d076' : '#f5f5f5',
                    fontWeight: 600
                  }}
                >
                  {formula}
                </th>
              ))}
            </tr>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              {FIXED_FORMULAS.map((formula) =>
                FIXED_METRICS.map((metric) => (
                  <th
                    key={`${formula}-${metric}`}
                    style={{
                      padding: '12px 8px',
                      textAlign: 'center',
                      border: '1px solid #e8e8e8',
                      backgroundColor: formula === '氮䓬斯汀氟替卡松' ? '#f7b940' : '#f5f5f5',
                      color: formula === '氮䓬斯汀氟替卡松' ? 'white' : '#333',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {metric}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {dates.map((date) => (
              <tr
                key={date}
                style={{
                  backgroundColor: dates.indexOf(date) % 2 === 0 ? '#fafafa' : 'white',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f7ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = dates.indexOf(date) % 2 === 0 ? '#fafafa' : 'white';
                }}
              >
                <td
                  style={{
                    padding: '12px 14px',
                    border: '1px solid #e8e8e8',
                    textAlign: 'center',
                    fontWeight: 500
                  }}
                >
                  {date}
                </td>
                {FIXED_FORMULAS.map((formula) =>
                  FIXED_METRICS.map((metric) => (
                    <td
                      key={`${date}-${formula}-${metric}`}
                      style={{
                        padding: '12px 14px',
                        border: '1px solid #e8e8e8',
                        textAlign: 'center',
                        color: '#333'
                      }}
                    >
                      {aggregatedData?.[formula]?.[metric]?.[date] || '-'}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
*/


/*
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

// 飞书数据结构
interface FeishuRecord {
  record_id: string;
  fields: {
    日期?: string;
    分子式?: string;
    分析指标?: string;
    值?: string | number;
    拆分方式?: string;
    [key: string]: string | number | undefined;
  };
}

// 聚合后的数据结构
interface AggregatedData {
  [date: string]: {
    [formula: string]: {
      [metric: string]: string | number | undefined;
    };
  };
}

// 固定的表头配置
const FORMULAS = ['氮䓬斯汀氟替卡松', '糠酸莫米松', '布地奈德', '丙酸氟替卡松'];
const METRICS = ['总声量', 'SOV', '总互动量', 'SOE'];

export default function FeishuDataTable() {
  const [aggregatedData, setAggregatedData] = useState<AggregatedData>({});
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/feishu/records');
        const rawData: FeishuRecord[] = res.data;

        // 1. 筛选出“拆分方式”为“全量数据”的记录
        const filteredData = rawData.filter(
          (record) => record.fields.拆分方式 === '全量数据'
        );

        // 2. 聚合数据
        const data: AggregatedData = {};
        const dateSet = new Set<string>();

        filteredData.forEach((record) => {
          const date = record.fields.日期;
          const formula = record.fields.分子式;
          const metric = record.fields.分析指标;
          const value = record.fields.值;

          if (date && formula && metric) {
            dateSet.add(date);
            if (!data[date]) data[date] = {};
            if (!data[date][formula]) data[date][formula] = {};
            data[date][formula][metric] = value;
          }
        });

        // 3. 对日期进行排序
        const sortedDates = Array.from(dateSet).sort((a, b) => {
          const [aMonth, aYear] = a.split('-');
          const [bMonth, bYear] = b.split('-');
          return `${aYear}${aMonth}`.localeCompare(`${bYear}${bMonth}`);
        });

        setAggregatedData(data);
        setDates(sortedDates);
      } catch (error) {
        console.error('获取飞书数据失败:', error);
      }
    };
    fetchData();
  }, []);

  if (dates.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>暂无数据</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1800px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>全量数据</h2>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <thead>

            <tr>
              <th
                rowSpan={2}
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '14px 12px',
                  textAlign: 'center',
                  border: '1px solid #e8e8e8',
                  fontWeight: 600,
                }}
              >
                日期
              </th>
              {FORMULAS.map((formula) => (
                <th
                  key={formula}
                  colSpan={METRICS.length}
                  style={{
                    backgroundColor: formula === '氮䓬斯汀氟替卡松' ? '#f2c98a' : '#f0f0f0',
                    padding: '12px',
                    textAlign: 'center',
                    border: '1px solid #e8e8e8',
                    fontWeight: 600,
                  }}
                >
                  {formula}
                </th>
              ))}
            </tr>

            <tr>
              {FORMULAS.map((formula) =>
                METRICS.map((metric) => (
                  <th
                    key={`${formula}-${metric}`}
                    style={{
                      backgroundColor: formula === '氮䓬斯汀氟替卡松' ? '#e8b66c' : '#f5f5f5',
                      color: formula === '氮䓬斯汀氟替卡松' ? 'white' : '#333',
                      padding: '10px 8px',
                      textAlign: 'center',
                      border: '1px solid #e8e8e8',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {metric}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => (
              <tr
                key={date}
                style={{
                  backgroundColor: dates.indexOf(date) % 2 === 0 ? '#fafafa' : 'white',
                }}
              >
                <td
                  style={{
                    padding: '12px 14px',
                    border: '1px solid #e8e8e8',
                    textAlign: 'center',
                    fontWeight: 500,
                  }}
                >
                  {date}
                </td>
                {FORMULAS.map((formula) =>
                  METRICS.map((metric) => (
                    <td
                      key={`${date}-${formula}-${metric}`}
                      style={{
                        padding: '12px 10px',
                        border: '1px solid #e8e8e8',
                        textAlign: 'center',
                        color: '#333',
                      }}
                    >
                      {aggregatedData[date]?.[formula]?.[metric] || '-'}
                    </td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


*/

'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

// 飞书数据结构
interface FeishuRecord {
  record_id: string;
  fields: {
    日期?: string;
    分子式?: string;
    分析指标?: string;
    值?: string | number;
    拆分方式?: string;
    [key: string]: string | number | undefined;
  };
}

// 聚合后的数据结构
interface AggregatedData {
  [date: string]: {
    [formula: string]: {
      [metric: string]: string | number | undefined;
    };
  };
}

// 固定表头配置
const FORMULAS = ['氮䓬斯汀氟替卡松', '糠酸莫米松', '布地奈德', '丙酸氟替卡松'];
const METRICS = ['总声量', 'SOV', '总互动量', 'SOE'];

export default function FeishuDataTable() {
  const [aggregatedData, setAggregatedData] = useState<AggregatedData>({});
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/feishu/records');
        const rawData: FeishuRecord[] = res.data;

        // 1. 筛选出“拆分方式”为“全量数据”的记录
        const filteredData = rawData.filter(
          (record) => record.fields.拆分方式 === '全量数据'
        );

        // 2. 聚合数据：严格按照表头初始化
        const data: AggregatedData = {};
        const dateSet = new Set<string>();

        filteredData.forEach((record) => {
          const date = record.fields.日期;
          const formula = record.fields.分子式;
          const metric = record.fields.分析指标;
          const value = record.fields.值;

          if (date && formula && metric) {
            dateSet.add(date);
            // 初始化层级结构，确保所有表头位置都有默认值
            if (!data[date]) {
              data[date] = {};
              FORMULAS.forEach(f => {
                data[date][f] = {};
                METRICS.forEach(m => {
                  data[date][f][m] = '-';
                });
              });
            }
            // 只更新在表头配置里存在的分子式和分析指标
            if (FORMULAS.includes(formula) && METRICS.includes(metric)) {
              data[date][formula][metric] = value;
            }
          }
        });

        // 3. 对日期进行排序
        const sortedDates = Array.from(dateSet).sort((a, b) => {
          const [aMonth, aYear] = a.split('-');
          const [bMonth, bYear] = b.split('-');
          return `${aYear}${aMonth}`.localeCompare(`${bYear}${bMonth}`);
        });

        setAggregatedData(data);
        setDates(sortedDates);
      } catch (error) {
        console.error('获取飞书数据失败:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1800px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}></h2>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <thead>
            {/* 第一行：分子式表头 */}
            <tr>
              <th
                rowSpan={2}
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '14px 12px',
                  textAlign: 'center',
                  border: '1px solid #e8e8e8',
                  fontWeight: 600,
                }}
              >
                日期
              </th>
              {FORMULAS.map((formula) => (
                <th
                  key={formula}
                  colSpan={METRICS.length}
                  style={{
                    backgroundColor: formula === '氮䓬斯汀氟替卡松' ? '#f2c98a' : '#f0f0f0',
                    padding: '12px',
                    textAlign: 'center',
                    border: '1px solid #e8e8e8',
                    fontWeight: 600,
                  }}
                >
                  {formula}
                </th>
              ))}
            </tr>
            {/* 第二行：分析指标表头 */}
            <tr>
              {FORMULAS.map((formula) =>
                METRICS.map((metric) => (
                  <th
                    key={`${formula}-${metric}`}
                    style={{
                      backgroundColor: formula === '氮䓬斯汀氟替卡松' ? '#e8b66c' : '#f5f5f5',
                      color: formula === '氮䓬斯汀氟替卡松' ? 'white' : '#333',
                      padding: '10px 8px',
                      textAlign: 'center',
                      border: '1px solid #e8e8e8',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {metric}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {dates.length > 0 ? (
              dates.map((date) => (
                <tr
                  key={date}
                  style={{
                    backgroundColor: dates.indexOf(date) % 2 === 0 ? '#fafafa' : 'white',
                  }}
                >
                  <td
                    style={{
                      padding: '12px 14px',
                      border: '1px solid #e8e8e8',
                      textAlign: 'center',
                      fontWeight: 500,
                    }}
                  >
                    {date}
                  </td>
                  {/* 严格按表头顺序渲染数据 */}
                  {FORMULAS.map((formula) =>
                    METRICS.map((metric) => (
                      <td
                        key={`${date}-${formula}-${metric}`}
                        style={{
                          padding: '12px 10px',
                          border: '1px solid #e8e8e8',
                          textAlign: 'center',
                          color: '#333',
                        }}
                      >
                        {aggregatedData[date]?.[formula]?.[metric] || '-'}
                      </td>
                    ))
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={1 + FORMULAS.length * METRICS.length}
                  style={{ padding: '20px', textAlign: 'center', border: '1px solid #e8e8e8' }}
                >
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}