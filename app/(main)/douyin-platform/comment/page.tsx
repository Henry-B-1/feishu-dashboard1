'use client'

import { useState, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  TrendingUp, MessageSquare, BarChart2,
  Filter, Award, AlertCircle,
  ThumbsUp, Meh, ThumbsDown,
  Eye, Users, Percent
} from 'lucide-react';

// 模拟原数据（实际项目可替换为接口请求）
const commentData = {
  "氮䓬斯汀氟替卡松": {
    评论总数: 19800,
    有效评论: 2689,
    有效占比: 14,
    情感分布: [
      { name: '正面', value: 475, 占比: 18, icon: <ThumbsUp size={16} /> },
      { name: '中性', value: 1236, 占比: 46, icon: <Meh size={16} /> },
      { name: '负面', value: 978, 占比: 36, icon: <ThumbsDown size={16} /> },
    ],
    话题数据: {
      正面话题: [
        { 话题: '博主口碑', 占比: 6.4, 原话: '马医生讲鼻炎真的是讲的最细致的,好医生,点了' },
        { 话题: '展现种草意愿', 占比: 4.5, 原话: '收藏了这两种药,到了春天就犯鼻炎' },
        { 话题: '效果好/见效快', 占比: 3.6, 原话: '用的就是视频里介绍的氮䓬斯汀氟替卡松,之前就是每天打几十个喷嚏,感觉量大的' },
      ],
      中性话题: [
        { 话题: '病因/症状探讨', 占比: 24.3, 原话: '我儿子应该是对冷空气过敏,他开冰箱门,进空调房,接触冬天的冷风就会打喷涕流鼻' },
        { 话题: '使用限制咨询', 占比: 2.1, 原话: '11岁孩子能同用?' },
        { 话题: '其他治疗药物', 占比: 1.8, 原话: '我是氯雷他定+布地奈德搭配' },
        { 话题: '效果询问', 占比: 0.6, 原话: '鼻炎药好治么 用啥治标不治本[哭笑]' },
      ],
      负面话题: [
        { 话题: '病症焦虑', 占比: 31.8, 原话: '就是国庆那十几个字一个月我也一样 鼻塞 打喷嚏 喉咙痒 眼睛痒太难受了 煎熬的一个月' },
        { 话题: '激素焦虑', 占比: 1.0, 原话: '主要是激素喷多了会鼻出血' },
        { 话题: '价格贵', 占比: 0.7, 原话: '挺贵的这种药' },
      ]
    }
  },
  "糠酸莫米松": {
    评论总数: 675,
    有效评论: 273,
    有效占比: 40,
    情感分布: [
      { name: '正面', value: 31, 占比: 11, icon: <ThumbsUp size={16} /> },
      { name: '中性', value: 150, 占比: 55, icon: <Meh size={16} /> },
      { name: '负面', value: 92, 占比: 34, icon: <ThumbsDown size={16} /> },
    ],
    话题数据: {
      正面话题: [
        { 话题: '科普受益', 占比: 9.2, 原话: '谢谢李医生分享科普知识[赞][赞][赞][赞][赞]' },
        { 话题: '效果好/见效快', 占比: 1.8, 原话: '这个好用我在用' },
      ],
      中性话题: [
        { 话题: '病因/症状探讨', 占比: 30.0, 原话: '有白粘稠鼻涕,鼻塞严重,喉咙红,38度,有鼻窦炎史过敏性鼻炎史,请问是什么炎?[捂脸]' },
        { 话题: '使用限制咨询', 占比: 8.4, 原话: '这个孩子能用吗' },
        { 话题: '其他治疗药物', 占比: 4.4, 原话: '和辅舒良比哪个好一些' },
      ],
      负面话题: [
        { 话题: '病症焦虑', 占比: 27.5, 原话: '有鼻炎感冒先上特别特别疼后,疯狂打喷涕流鼻,然后才开始[发怒][发怒]' },
        { 话题: '激素焦虑', 占比: 1.8, 原话: '指标不治本[发怒][发怒]有依赖性[发怒][发怒][发怒][发怒]最好是能彻底发[发怒][发怒]' },
        { 话题: '效果质疑', 占比: 1.5, 原话: '没用,效果甚微' },
      ]
    }
  }
};

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

// 情感颜色配置（和brand页面配色对齐）
const EMOTION_COLORS = {
  '正面': '#91cc75',   // brand页面的绿色
  '中性': '#5470c6',   // brand页面的蓝色
  '负面': '#ee6666'    // brand页面的红色
};

export default function CommentAnalysisPage() {
  const [activeMolecule, setActiveMolecule] = useState('氮䓬斯汀氟替卡松');
  const [activeTab, setActiveTab] = useState('正面话题');
  const currentData = useMemo(() => commentData[activeMolecule as keyof typeof commentData], [activeMolecule]);

  // ECharts 引用
  const emotionPieRef = useRef<any>(null);
  const topicBarRef = useRef<any>(null);

  // 获取当前话题标签的颜色
  const getTabColor = () => {
    switch(activeTab) {
      case '正面话题': return EMOTION_COLORS['正面'];
      case '中性话题': return EMOTION_COLORS['中性'];
      case '负面话题': return EMOTION_COLORS['负面'];
      default: return EMOTION_COLORS['中性'];
    }
  };

  // ========== ECharts 配置 ==========
  // 情感分布饼图配置（和brand页面样式对齐）
  const getEmotionPieOption = () => {
    const pieData = currentData.情感分布.map(item => ({
      name: item.name,
      value: item.占比
    }));

    return {
      title: {
        text: `情感分布分析（${currentData.有效评论}条有效评论）`,
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
          name: '情感占比',
          type: 'pie',
          radius: ['35%', '60%'],
          center: ['50%', '42%'],
          data: pieData,
          label: { show: false },
          labelLine: { show: false },
          color: [EMOTION_COLORS['正面'], EMOTION_COLORS['中性'], EMOTION_COLORS['负面']],
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

  // 话题分析柱状图配置（和brand页面样式对齐）
  const getTopicBarOption = () => {
    const topicData = currentData.话题数据[activeTab as keyof typeof currentData.话题数据];
    const topics = topicData.map(item => item.话题);
    const values = topicData.map(item => item.占比);
    const barColor = getTabColor();

    return {
      title: {
        text: `${activeTab}分布分析`,
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
        formatter: '{b}：{c}%',
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
            color: `rgba(${parseInt(barColor.slice(1,3),16)}, ${parseInt(barColor.slice(3,5),16)}, ${parseInt(barColor.slice(5,7),16)}, 0.1)`
          }
        }
      },
      xAxis: {
        type: 'category',
        data: topics,
        axisLabel: {
          fontSize: 13,
          fontWeight: 500,
          rotate: 30,
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
          color: '#475569',
          formatter: '{value}%'
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
        name: '占比',
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
          name: '占比',
          type: 'bar',
          data: values,
          barWidth: '45%',
          itemStyle: {
            color: barColor,
            borderRadius: [6, 6, 0, 0],
            shadowColor: `rgba(${parseInt(barColor.slice(1,3),16)}, ${parseInt(barColor.slice(3,5),16)}, ${parseInt(barColor.slice(5,7),16)}, 0.15)`,
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
            formatter: '{c}%'
          },
          emphasis: {
            itemStyle: {
              color: barColor,
              opacity: 0.9
            }
          }
        }
      ],
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    };
  };

  // ========== 复制功能（和brand页面对齐） ==========
  const [copySuccess, setCopySuccess] = useState('');

  const copyToClipboard = (text: string, tip: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(tip);
      setTimeout(() => setCopySuccess(''), 1500);
    });
  };

  // 复制情感分布数据
  const copyEmotionData = () => {
    const lines = ['情感类型\t占比(%)\t评论数'];
    currentData.情感分布.forEach(item => {
      lines.push(`${item.name}\t${item.占比}\t${item.value}`);
    });
    copyToClipboard(lines.join('\n'), `情感分布数据已复制，可直接粘贴到 Excel`);
  };

  // 复制话题数据
  const copyTopicData = () => {
    const topicData = currentData.话题数据[activeTab as keyof typeof currentData.话题数据];
    const lines = [`${activeTab}\t占比(%)\t原话`];
    topicData.forEach(item => {
      lines.push(`${item.话题}\t${item.占比}\t${item.原话}`);
    });
    copyToClipboard(lines.join('\n'), `${activeTab}数据已复制，可直接粘贴到 Excel`);
  };

  // 复制按钮样式
  const copyBtnStyle: React.CSSProperties = {
    marginTop: 12,
    padding: '6px 14px',
    fontSize: 13,
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    background: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: THEME.background,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* 复制成功提示（和brand页面对齐） */}
      {copySuccess && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', background: '#090', color: '#fff', borderRadius: 8,
          zIndex: 9999, fontSize: 14
        }}>
          {copySuccess}
        </div>
      )}

      {/* 页面头部 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 24px 24px 24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          transform: 'translate(30%, -30%)'
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
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
                重点分子式KOL/KOC发帖评论分析
              </h1>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0,
                lineHeight: 1.6
              }}>
                深度分析抖音平台重点分子式药品的用户评论，洞察用户情感与话题分布
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
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
                  minWidth: '180px'
                }}
              >
                {Object.keys(commentData).map((mol) => (
                  <option key={mol} value={mol} style={{ color: '#111827' }}>
                    {mol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'white'
            }}>
              <AlertCircle size={12} />
              仅对有效评论数&gt;200的品牌进行分析
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'white'
            }}>
              <Award size={12} />
              仅在过敏高发季分析（3-4月/8-9月）
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div style={{ maxWidth: '1200px', margin: '-20px auto 0', padding: '0 24px' }}>
        {/* 统计卡片网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* 评论总数卡片 */}
          <div style={{
            background: THEME.cardBg,
            borderRadius: THEME.radius.md,
            padding: '20px',
            boxShadow: THEME.shadow,
            transition: 'all 0.3s ease',
            border: `1px solid ${THEME.border}`,
            position: 'relative',
            overflow: 'hidden'
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
                评论总数
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: THEME.textPrimary,
                  letterSpacing: '-0.025em'
                }}>
                  {currentData.评论总数.toLocaleString()}
                </span>
              </div>
              <span style={{
                fontSize: '12px',
                color: THEME.textTertiary,
                lineHeight: 1.4
              }}>
                平台总评论数量
              </span>
            </div>
          </div>

          {/* 有效评论卡片 */}
          <div style={{
            background: THEME.cardBg,
            borderRadius: THEME.radius.md,
            padding: '20px',
            boxShadow: THEME.shadow,
            transition: 'all 0.3s ease',
            border: `1px solid ${THEME.border}`,
            position: 'relative',
            overflow: 'hidden'
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
                有效评论
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: THEME.textPrimary,
                  letterSpacing: '-0.025em'
                }}>
                  {currentData.有效评论.toLocaleString()}
                </span>
              </div>
              <span style={{
                fontSize: '12px',
                color: THEME.textTertiary,
                lineHeight: 1.4
              }}>
                围绕病症、症状、病因等有效内容
              </span>
            </div>
          </div>

          {/* 有效评论占比卡片 */}
          <div style={{
            background: THEME.cardBg,
            borderRadius: THEME.radius.md,
            padding: '20px',
            boxShadow: THEME.shadow,
            transition: 'all 0.3s ease',
            border: `1px solid ${THEME.border}`,
            position: 'relative',
            overflow: 'hidden'
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
                有效评论占比
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: THEME.textPrimary,
                  letterSpacing: '-0.025em'
                }}>
                  {currentData.有效占比}%
                </span>
              </div>
              <span style={{
                fontSize: '12px',
                color: THEME.textTertiary,
                lineHeight: 1.4
              }}>
                有效评论在总评论中的比例
              </span>
            </div>
          </div>
        </div>

        {/* 主分析区域 - 采用brand页面的布局和样式 */}
        <div style={{
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          {/* 情感分布卡片 - ECharts版本 */}
          <div style={{
            width: '48%',
            minWidth: '400px',
            height: 400,
            background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ flex: 1, height: 'calc(100% - 40px)' }}>
              <ReactECharts
                ref={emotionPieRef}
                option={getEmotionPieOption()}
                style={{ width: '100%', height: '100%' }}
                onEvents={{ resize: () => emotionPieRef.current?.getEchartsInstance().resize() }}
              />
            </div>
            <button
              style={copyBtnStyle}
              onClick={copyEmotionData}
            >
              复制 情感分布 数据到 Excel
            </button>
          </div>

          {/* 话题分析卡片 - ECharts版本 */}
          <div style={{
            width: '48%',
            minWidth: '400px',
            height: 400,
            background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* 话题标签页 */}
            <div style={{
              display: 'flex',
              gap: '4px',
              background: THEME.background,
              padding: '4px',
              borderRadius: THEME.radius.md,
              marginBottom: '10px'
            }}>
              {['正面话题', '中性话题', '负面话题'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: activeTab === tab ? 600 : 500,
                    color: activeTab === tab ? getTabColor() : THEME.textSecondary,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    borderBottom: activeTab === tab ? `2px solid ${getTabColor()}` : '2px solid transparent',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, height: 'calc(100% - 80px)' }}>
              <ReactECharts
                ref={topicBarRef}
                option={getTopicBarOption()}
                style={{ width: '100%', height: '100%' }}
                onEvents={{
                  resize: () => topicBarRef.current?.getEchartsInstance().resize(),
                  // 切换tab时重新渲染图表
                  click: () => topicBarRef.current?.getEchartsInstance().setOption(getTopicBarOption())
                }}
              />
            </div>

            <button
              style={copyBtnStyle}
              onClick={copyTopicData}
            >
              复制 {activeTab} 数据到 Excel
            </button>
          </div>
        </div>

        {/* 话题详情列表 */}
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
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Eye size={20} color={THEME.primary} />
            {activeTab} 详情
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            maxHeight: '300px',
            overflowY: 'auto',
            paddingRight: '8px'
          }}>
            {currentData.话题数据[activeTab as keyof typeof currentData.话题数据].map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: getTabColor() + '10',
                  borderRadius: THEME.radius.md,
                  padding: '16px',
                  border: `1px solid ${getTabColor()}30`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = THEME.shadowHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: getTabColor(),
                    flex: 1
                  }}>
                    {item.话题}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'white',
                    background: getTabColor(),
                    padding: '4px 12px',
                    borderRadius: '20px',
                    flexShrink: 0
                  }}>
                    {item.占比}%
                  </span>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: THEME.textSecondary,
                  margin: 0,
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  "{item.原话}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 页脚说明 */}
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
                <strong>数据说明：</strong>有效评论指围绕病症、症状、病因、产品等核心内容的用户反馈。仅对有效评论数大于200的品牌进行深度分析。本月丙酸氟替卡松、盐酸氮䓬斯汀因有效评论数未达标准，暂不纳入分析范围。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}