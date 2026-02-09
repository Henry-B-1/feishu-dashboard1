'use client'
import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, AlertTriangle, BarChart2, Info, ChevronDown, Filter } from 'lucide-react';

// ========== 核心类型定义 ==========
type CommentAnalysisData = {
  productName: string;
  totalComments: number;
  validComments: number;
  validRatio: string;
  sentiment: {
    positive: { count: number; ratio: string };
    neutral: { count: number; ratio: string };
    negative: { count: number; ratio: string };
  };
  topicDistribution: {
    positiveTopics: Array<{ name: string; ratio: string; example: string }>;
    neutralTopics: Array<{ name: string; ratio: string; example: string }>;
    negativeTopics: Array<{ name: string; ratio: string; example: string }>;
  };
};

// ========== 评论分析数据（匹配截图） ==========
const COMMENT_DATA: CommentAnalysisData[] = [
  {
    productName: '氮䓬斯汀氟替卡松',
    totalComments: 19900,
    validComments: 2689,
    validRatio: '14%',
    sentiment: {
      positive: { count: 475, ratio: '18%' },
      neutral: { count: 1236, ratio: '46%' },
      negative: { count: 978, ratio: '36%' },
    },
    topicDistribution: {
      positiveTopics: [
        { name: '博主口碑', ratio: '6.4%', example: '马医生说鼻窦炎类问题的药是最有效的，好医生，点！' },
        { name: '展现种草意愿', ratio: '4.5%', example: '收了这种药，到了春天就犯鼻炎' },
        { name: '效果好/见效快', ratio: '3.6%', example: '用的就是该院里开的氮䓬斯汀氟替卡松，之前鼻塞要打几十个喷嚏，鼻通大量的' },
      ],
      neutralTopics: [
        { name: '病因/症状探讨', ratio: '24.3%', example: '我儿子应该是冷空气过敏，他开冰箱，进出空调屋子，秋天的冷风吹都会打喷流鼻涕' },
        { name: '使用限制咨询', ratio: '2.1%', example: '1岁多孩子能用吗？' },
        { name: '其他治疗药物', ratio: '1.8%', example: '我是氮䓬斯汀+布地奈德搭配' },
        { name: '效果询问', ratio: '0.6%', example: '鼻炎药用好吗 治标治本不[哭笑]' },
      ],
      negativeTopics: [
        { name: '病症焦虑', ratio: '31.8%', example: '鼻塞 鼻塞几乎一个月 我也一样鼻塞 鼻痛 咽喉痛 太难了 前脸的一个' },
        { name: '激素焦虑', ratio: '1.0%', example: '主要是激素喷多会鼻出血' },
        { name: '价格贵', ratio: '0.7%', example: '挺贵的这药' },
      ],
    },
  },
  {
    productName: '糠酸莫米松',
    totalComments: 675,
    validComments: 273,
    validRatio: '40%',
    sentiment: {
      positive: { count: 31, ratio: '11%' },
      neutral: { count: 150, ratio: '55%' },
      negative: { count: 92, ratio: '34%' },
    },
    topicDistribution: {
      positiveTopics: [
        { name: '科普受益', ratio: '9.2%', example: '谢谢李医生分享科普知识[赞][赞][赞][赞][赞]' },
        { name: '效果好/见效快', ratio: '1.8%', example: '这个好用我在用' },
      ],
      neutralTopics: [
        { name: '病因/症状探讨', ratio: '30.0%', example: '有过敏性鼻炎，鼻塞严重，喷嚏狂，38联，有鼻塞 喷嚏流涕 鼻塞严重，请问是什么？[捂脸]' },
        { name: '使用限制咨询', ratio: '8.4%', example: '这个孩子能用吗' },
        { name: '其他治疗药物', ratio: '4.4%', example: '和新霉素比哪个好一些' },
      ],
      negativeTopics: [
        { name: '病症焦虑', ratio: '27.5%', example: '有鼻炎感觉早上特别堵然后疼，现在打喷嚏流鼻水，然后开始感觉管鼻塞' },
        { name: '激素焦虑', ratio: '1.8%', example: '指标不治本[发怒][发怒][发怒][发怒]依赖性[发怒][发怒][发怒]' },
        { name: '效果质疑', ratio: '1.5%', example: '没用，效果甚微' },
      ],
    },
  },
];

// ========== 工具函数：统一日期格式 ==========
const formatDate = (date: Date): string => {
  // 手动格式化，避免本地化差异
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 月份从0开始
  const day = date.getDate();
  return `${year}/${month}/${day}`;
};

// ========== 进度条组件（优化显示） ==========
const ProgressBar = ({ percentage, color }: { percentage: string; color: string }) => {
  const value = parseFloat(percentage);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${color} shadow-sm shadow-current/20`}
        style={{ width: percentage }}
      />
    </div>
  );
};

// ========== 情感分布卡片组件 ==========
const SentimentCard = ({ data }: { data: CommentAnalysisData['sentiment'] }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6 transform hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={18} className="text-blue-500" />
        <h3 className="font-semibold text-gray-800 text-lg">情感分布分析</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 正面 */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100 hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp size={14} className="text-green-500" />
            <div className="text-xs text-gray-500">正面评论</div>
          </div>
          <div className="font-bold text-green-600 text-xl mb-2">{data.positive.ratio}</div>
          <div className="text-xs text-gray-400 mb-2">有效评论：{data.positive.count.toLocaleString()}</div>
          <ProgressBar percentage={data.positive.ratio} color="bg-green-500" />
        </div>

        {/* 中性 */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-100 hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-yellow-500" />
            <div className="text-xs text-gray-500">中性评论</div>
          </div>
          <div className="font-bold text-yellow-600 text-xl mb-2">{data.neutral.ratio}</div>
          <div className="text-xs text-gray-400 mb-2">有效评论：{data.neutral.count.toLocaleString()}</div>
          <ProgressBar percentage={data.neutral.ratio} color="bg-yellow-500" />
        </div>

        {/* 负面 */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border border-red-100 hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-red-500" />
            <div className="text-xs text-gray-500">负面评论</div>
          </div>
          <div className="font-bold text-red-600 text-xl mb-2">{data.negative.ratio}</div>
          <div className="text-xs text-gray-400 mb-2">有效评论：{data.negative.count.toLocaleString()}</div>
          <ProgressBar percentage={data.negative.ratio} color="bg-red-500" />
        </div>
      </div>
    </div>
  );
};

// ========== 话题分布卡片组件（确保进度条100%显示） ==========
const TopicCard = ({
  title,
  icon,
  topics,
  color
}: {
  title: string;
  icon: React.ReactNode;
  topics: CommentAnalysisData['topicDistribution']['positiveTopics'];
  color: string;
}) => {
  if (topics.length === 0) return null;

  // 展开/收起状态管理
  const [expanded, setExpanded] = useState(true);
  const displayTopics = expanded ? topics : topics.slice(0, 2);

  // 映射边框颜色到进度条背景色（简化逻辑，确保准确）
  const getProgressColor = () => {
    if (color === 'border-green-500') return 'bg-green-400';
    if (color === 'border-yellow-500') return 'bg-yellow-400';
    if (color === 'border-red-500') return 'bg-red-400';
    return 'bg-blue-400';
  };

  const progressColor = getProgressColor();
  const textColor = color.replace('border-', 'text-');

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6 transform hover:shadow-lg transition-all duration-300">
      {/* 标题栏 */}
      <div className="flex justify-between items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label={expanded ? "收起" : "展开"}
        >
          <ChevronDown
            size={16}
            className={`text-gray-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* 话题列表 - 确保每个话题都显示进度条 */}
      <div className="space-y-4">
        {displayTopics.map((topic, index) => (
          <div
            key={`topic-${index}`} // 明确的key值
            className={`border-l-2 ${color} pl-4 py-2 hover:bg-gray-50 rounded-r-lg transition-colors duration-200`}
          >
            <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-800">{topic.name}</span>
              <span className={`text-xs font-medium ${textColor}`}>{topic.ratio}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1 italic bg-gray-50 p-2 rounded-md">
              "{topic.example}"
            </div>
            {/* 强制显示进度条，确保不会遗漏 */}
            <ProgressBar
              percentage={topic.ratio}
              color={progressColor}
            />
          </div>
        ))}
      </div>

      {/* 展开/收起按钮 */}
      {topics.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-xs text-blue-500 flex items-center gap-1 hover:text-blue-700 transition-colors"
        >
          {expanded ? '收起' : '查看更多'}
          <ChevronDown size={12} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
};

// ========== 数据指标卡片组件 ==========
const MetricCard = ({
  label,
  value,
  icon,
  color
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) => {
  return (
    <div className={`p-4 rounded-lg border ${color} bg-white shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className={`${color.replace('border-', 'text-')} mb-1`}>{icon}</div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-800">{value}</div>
    </div>
  );
};

// ========== 页面主组件（加宽容器 + 优化布局） ==========
export default function DouyinCommentAnalysisPage() {
  const [activeProduct, setActiveProduct] = useState(COMMENT_DATA[0]);
  const [currentDate, setCurrentDate] = useState('');

  // 仅在客户端渲染日期，避免水合不匹配
  useEffect(() => {
    setCurrentDate(formatDate(new Date()));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* 加宽容器：从 max-w-5xl 改为 max-w-6xl，增加宽度 */}
      <div className="max-w-6xl mx-auto mb-8">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            抖音重点分子式KOL发帖评论区分析
          </h1>
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 max-w-lg mx-auto">
            <Info size={14} className="text-blue-500 flex-shrink-0" />
            <span>仅对有效评论数&gt;200的品牌进行评论分析，本月布地奈德、丙酸氟替卡松、盐酸氮䓬斯汀未达标准</span>
          </div>
        </div>

        {/* 产品切换标签 */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {COMMENT_DATA.map((product) => (
            <button
              key={product.productName}
              onClick={() => setActiveProduct(product)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden
                ${activeProduct.productName === product.productName
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-blue-200'
                }`}
            >
              {activeProduct.productName === product.productName && (
                <span className="absolute inset-0 bg-gradient-to-r from-blue-700/20 to-transparent"></span>
              )}
              {product.productName}
            </button>
          ))}
        </div>

        {/* 基础数据概览 */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-blue-500" />
            <h3 className="font-semibold text-gray-800 text-lg">核心数据概览</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              label="评论总数"
              value={activeProduct.totalComments.toLocaleString()}
              icon={<MessageSquare size={18} />}
              color="border-blue-200"
            />
            <MetricCard
              label="有效评论数"
              value={activeProduct.validComments.toLocaleString()}
              icon={<Info size={18} />}
              color="border-green-200"
            />
            <MetricCard
              label="有效评论占比"
              value={activeProduct.validRatio}
              icon={<BarChart2 size={18} />}
              color="border-purple-200"
            />
          </div>

          <div className="mt-4 bg-yellow-50 px-4 py-3 rounded-lg flex items-center gap-2 border border-yellow-100">
            <Info size={16} className="text-yellow-600 flex-shrink-0" />
            <span className="text-xs text-yellow-700">
              该部分仅在过敏高发季分析，每年的3-4月和8-9月
            </span>
          </div>
        </div>
      </div>

      {/* 分析内容区域 - 同样加宽容器 */}
      <div className="max-w-6xl mx-auto">
        {/* 情感分布 */}
        <SentimentCard data={activeProduct.sentiment} />

        {/* 话题分布 - 确保所有卡片都显示进度条 */}
        <TopicCard
          title="正面话题分析"
          icon={<ThumbsUp size={18} className="text-green-500" />}
          topics={activeProduct.topicDistribution.positiveTopics}
          color="border-green-500"
        />
        <TopicCard
          title="中性话题分析"
          icon={<MessageSquare size={18} className="text-yellow-500" />}
          topics={activeProduct.topicDistribution.neutralTopics}
          color="border-yellow-500"
        />
        <TopicCard
          title="负面话题分析"
          icon={<AlertTriangle size={18} className="text-red-500" />}
          topics={activeProduct.topicDistribution.negativeTopics}
          color="border-red-500"
        />

        {/* 页脚信息 - 修复水合不匹配问题 */}
        <div className="text-center text-xs text-gray-400 mt-10 mb-6">
          数据更新时间：{currentDate} | 数据来源：抖音平台KOL评论区
        </div>
      </div>
    </div>
  );
}