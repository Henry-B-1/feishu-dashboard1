'use client'

import { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Database, Target, MessageSquare,
  BarChart2, Info, Tag, Users, CheckCircle,
  ChevronDown, ChevronUp, Search, Loader2, AlertCircle
} from 'lucide-react';
// 导入月份上下文
import { useMonthContext } from '../context/MonthContext';

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
interface PlatformMetric {
  platform: string;
  calculation: string;
}

// 定义接口返回的数据类型
interface FeishuRecord {
  fields: Record<string, any>;
  id: string;
  record_id: string;
}

// 可折叠卡片组件（保留原有逻辑）
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

// 关键词标签组件（保留原有逻辑）
const KeywordTag = ({ text }: { text: string }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: `${THEME.primary}10`,
    color: THEME.primary,
    padding: '6px 12px',
    borderRadius: THEME.radius.sm,
    fontSize: '14px',
    fontWeight: 500,
    margin: '0 8px 8px 0'
  }}>
    <Tag size={12} />
    {text}
  </span>
);

// 计算方式表格组件（保留原有逻辑）
const MetricTable = ({
  data,
  header
}: {
  data: PlatformMetric[];
  header: string[];
}) => (
  <div style={{
    overflowX: 'auto',
    marginTop: '16px',
    borderRadius: THEME.radius.sm,
    border: `1px solid ${THEME.border}`
  }}>
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px'
    }}>
      <thead>
        <tr style={{
          background: THEME.background,
          borderBottom: `2px solid ${THEME.border}`
        }}>
          {header.map((item, index) => (
            <th
              key={index}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: 600,
                color: THEME.textPrimary,
                whiteSpace: 'nowrap'
              }}
            >
              {item}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr
            key={index}
            style={{
              borderBottom: `1px solid ${THEME.border}`,
              backgroundColor: index % 2 === 0 ? 'white' : `${THEME.background}80`,
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${THEME.primary}5`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : `${THEME.background}80`;
            }}
          >
            <td style={{
              padding: '12px 16px',
              fontWeight: 500,
              color: THEME.textPrimary,
              whiteSpace: 'nowrap'
            }}>
              {item.platform}
            </td>
            <td style={{
              padding: '12px 16px',
              color: THEME.textSecondary,
              lineHeight: 1.5
            }}>
              {item.calculation}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// 逻辑说明项组件（保留原有逻辑）
const LogicItem = ({ text }: { text: string }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px',
    lineHeight: 1.6
  }}>
    <CheckCircle size={16} color={THEME.success} style={{
      marginTop: '2px',
      flexShrink: 0
    }} />
    <span style={{
      color: THEME.textSecondary
    }}>
      {text}
    </span>
  </div>
);

// 加载状态组件
const LoadingState = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: THEME.textSecondary
  }}>
    <Loader2 size={40} color={THEME.primary} className="animate-spin" />
    <p style={{ marginTop: '20px', fontSize: '16px' }}>正在加载统计标准数据...</p>
  </div>
);

// 错误状态组件
const ErrorState = ({ message }: { message: string }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: THEME.danger
  }}>
    <AlertCircle size={40} color={THEME.danger} />
    <p style={{ marginTop: '20px', fontSize: '16px', textAlign: 'center' }}>{message}</p>
    <button
      style={{
        marginTop: '20px',
        padding: '10px 24px',
        background: THEME.primary,
        color: 'white',
        border: 'none',
        borderRadius: THEME.radius.sm,
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500
      }}
      onClick={() => window.location.reload()}
    >
      重新加载
    </button>
  </div>
);

// 空数据状态组件
const EmptyState = ({ month }: { month: string }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: THEME.textSecondary
  }}>
    <Info size={40} color={THEME.textSecondary} />
    <p style={{ marginTop: '20px', fontSize: '16px', textAlign: 'center' }}>
      暂无 {month} 月份的统计标准数据
    </p>
  </div>
);

export default function DefinitionPage() {
  // 获取月份上下文
  const { selectedMonth } = useMonthContext();

  // 状态管理
  const [data, setData] = useState<FeishuRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. 从接口获取数据
  useEffect(() => {
    const fetchDefinitionData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/feishu/defination');

        if (!response.ok) {
          throw new Error(`请求失败：${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('获取统计标准数据失败：', err);
        setError(err instanceof Error ? err.message : '获取数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchDefinitionData();
  }, []); // 仅初始化时请求一次全量数据

  // 2. 根据选中的月份筛选数据
  const filteredData = useMemo(() => {
    if (!selectedMonth || data.length === 0) return [];

    // 月份格式转换：Jan-26 → 2026/1/1-2026/1/31 （根据你的数据格式调整）
    const monthMap: Record<string, string> = {
      'Jan-26': '2026/1/1-2026/1/31',
      'Nov-25': '2025/11/01 - 2025/11/30',
      // 可扩展其他月份
    };

    const targetTime = monthMap[selectedMonth] || selectedMonth;
    return data.filter(record =>
      record.fields['数据抓取时间:'] === targetTime ||
      record.fields['日期'] === selectedMonth
    );
  }, [selectedMonth, data]);

  // 3. 格式化筛选后的数据为页面所需结构
  const formattedData = useMemo(() => {
    if (filteredData.length === 0) return null;

    // 初始化默认结构
    const formatted = {
      basicInfo: {
        title: "重点分子式及品牌声量&互动量统计标准",
        captureTime: "",
      },
      captureScope: [] as string[],
      keywords: {
        molecule: [] as string[],
        brand: [] as string[],
      },
      judgmentLogic: {
        molecule: [] as string[],
        brand: [] as string[],
      },
      metricExplanation: {
        voice: "",
        interaction: "",
      },
      voiceCalculation: [] as PlatformMetric[],
      interactionCalculation: [] as PlatformMetric[],
    };

    // 遍历筛选后的数据，填充对应字段
    filteredData.forEach(record => {
      const fields = record.fields;

      // 数据抓取范围
      if (fields['数据抓取平台']) {
        formatted.captureScope = fields['数据抓取平台'];
        formatted.basicInfo.captureTime = fields['数据抓取时间:'] || '';
      }

      // 分子式关键词
      if (fields['分子式关键词']) {
        formatted.keywords.molecule = fields['分子式关键词'];
      }

      // 品牌关键词
      if (fields['品牌关键词']) {
        formatted.keywords.brand = fields['品牌关键词'];
      }

      // 分子式判定逻辑
      if (fields['分子式']) {
        formatted.judgmentLogic.molecule = fields['分子式'].split('\n');
      }

      // 品牌判定逻辑
      if (fields['品牌']) {
        formatted.judgmentLogic.brand = fields['品牌'].split('\n');
      }

      // 声量说明
      if (fields['声量']) {
        formatted.metricExplanation.voice = fields['声量'];
      }

      // 互动量说明
      if (fields['互动量']) {
        formatted.metricExplanation.interaction = fields['互动量'];
      }

      // 声量/互动量计算方式
      if (fields['主贴平台']) {
        // 声量计算
        if (fields['声量计算方式'] && fields['声量计算方式'].trim()) {
          formatted.voiceCalculation.push({
            platform: fields['主贴平台'],
            calculation: fields['声量计算方式']
          });
        }

        // 互动量计算
        if (fields['互动量计算方式'] && fields['互动量计算方式'].trim()) {
          formatted.interactionCalculation.push({
            platform: fields['主贴平台'],
            calculation: fields['互动量计算方式']
          });
        }
      }
    });

    return formatted;
  }, [filteredData]);

  // 加载状态渲染
  if (loading) return <LoadingState />;

  // 错误状态渲染
  if (error) return <ErrorState message={error} />;

  // 空数据状态渲染
  if (!formattedData) return <EmptyState month={selectedMonth} />;

  // 正常渲染页面
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
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'white',
            margin: 0,
            marginBottom: '12px',
            lineHeight: 1.3
          }}>
            {formattedData.basicInfo.title}
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px'
          }}>
            <Calendar size={16} />
            <span>{formattedData.basicInfo.captureTime || '暂无数据时间'}</span>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div style={{
        maxWidth: '1200px',
        margin: '20px auto 0',
        padding: '0 24px 40px'
      }}>
        {/* 数据抓取范围 */}
        <CollapsibleCard
          title="数据抓取范围"
          icon={Database}
          defaultOpen={true}
        >
          <div style={{ marginTop: '16px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              {formattedData.captureScope.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: THEME.background,
                  borderRadius: THEME.radius.sm,
                  border: `1px solid ${THEME.border}`
                }}>
                  <Target size={16} color={THEME.primary} />
                  <span style={{
                    color: THEME.textSecondary,
                    fontSize: '14px'
                  }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        {/* 关键词配置 */}
        <CollapsibleCard
          title="关键词配置"
          icon={Tag}
          defaultOpen={true}
        >
          <div style={{ marginTop: '16px' }}>
            {/* 分子式关键词 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: THEME.textPrimary,
                margin: '0 0 12px 0'
              }}>
                分子式关键词
              </h4>
              <div style={{ flexWrap: 'wrap', display: 'flex' }}>
                {formattedData.keywords.molecule.map((keyword, index) => (
                  <KeywordTag key={index} text={keyword} />
                ))}
              </div>
            </div>

            {/* 品牌关键词 */}
            <div>
              <h4 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: THEME.textPrimary,
                margin: '0 0 12px 0'
              }}>
                品牌关键词
              </h4>
              <div style={{ flexWrap: 'wrap', display: 'flex' }}>
                {formattedData.keywords.brand.map((keyword, index) => (
                  <KeywordTag key={index} text={keyword} />
                ))}
              </div>
            </div>
          </div>
        </CollapsibleCard>

        {/* 判定逻辑 */}
        <CollapsibleCard
          title="分子式及品牌判定逻辑"
          icon={Users}
          defaultOpen={true}
        >
          <div style={{ marginTop: '16px' }}>
            {/* 分子式判定逻辑 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: THEME.textPrimary,
                margin: '0 0 12px 0'
              }}>
                分子式判定逻辑
              </h4>
              <div style={{
                padding: '16px',
                background: THEME.background,
                borderRadius: THEME.radius.sm,
                border: `1px solid ${THEME.border}`
              }}>
                {formattedData.judgmentLogic.molecule.map((item, index) => (
                  <LogicItem key={index} text={item} />
                ))}
              </div>
            </div>

            {/* 品牌判定逻辑 */}
            <div>
              <h4 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: THEME.textPrimary,
                margin: '0 0 12px 0'
              }}>
                品牌判定逻辑
              </h4>
              <div style={{
                padding: '16px',
                background: THEME.background,
                borderRadius: THEME.radius.sm,
                border: `1px solid ${THEME.border}`
              }}>
                {formattedData.judgmentLogic.brand.map((item, index) => (
                  <LogicItem key={index} text={item} />
                ))}
              </div>
            </div>
          </div>
        </CollapsibleCard>

        {/* 数据监测说明 */}
        <CollapsibleCard
          title="数据监测说明"
          icon={Info}
          defaultOpen={true}
        >
          <div style={{ marginTop: '16px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              {/* 声量说明 */}
              <div style={{
                padding: '16px',
                background: THEME.background,
                borderRadius: THEME.radius.sm,
                border: `1px solid ${THEME.border}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  color: THEME.primary,
                  fontWeight: 600,
                  fontSize: '15px'
                }}>
                  <MessageSquare size={18} />
                  声量
                </div>
                <p style={{
                  color: THEME.textSecondary,
                  margin: 0,
                  lineHeight: 1.6,
                  fontSize: '14px'
                }}>
                  {formattedData.metricExplanation.voice}
                </p>
              </div>

              {/* 互动量说明 */}
              <div style={{
                padding: '16px',
                background: THEME.background,
                borderRadius: THEME.radius.sm,
                border: `1px solid ${THEME.border}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  color: THEME.success,
                  fontWeight: 600,
                  fontSize: '15px'
                }}>
                  <BarChart2 size={18} />
                  互动量
                </div>
                <p style={{
                  color: THEME.textSecondary,
                  margin: 0,
                  lineHeight: 1.6,
                  fontSize: '14px'
                }}>
                  {formattedData.metricExplanation.interaction}
                </p>
              </div>
            </div>
          </div>
        </CollapsibleCard>

        {/* 声量计算方式 */}
        <CollapsibleCard
          title="声量计算方式"
          icon={MessageSquare}
          defaultOpen={true}
        >
          <MetricTable
            data={formattedData.voiceCalculation}
            header={['主帖平台', '声量计算规则']}
          />
        </CollapsibleCard>

        {/* 互动量计算方式 */}
        <CollapsibleCard
          title="互动量计算方式"
          icon={BarChart2}
          defaultOpen={true}
        >
          <MetricTable
            data={formattedData.interactionCalculation}
            header={['主帖平台', '互动量计算规则']}
          />
        </CollapsibleCard>
      </div>
    </div>
  );
}