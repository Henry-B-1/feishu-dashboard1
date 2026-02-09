import React from 'react';

const DataCoverageDefinition = () => {
  // 定义页面需要用到的数据
  const dataInfo = {
    captureTime: '2025/11/01 - 2025/11/30',
    platforms: [
      '新闻站点、微信、微博、小红书',
      '短视频（e.g.抖音，快手，微信视频号）',
      '视频（e.g.哔哩哔哩，腾讯视频）',
      '论坛（e.g.百度贴吧，妈妈网）',
      '问答（e.g.知乎）'
    ],
    moleculeKeywords: '氮䓬斯汀氟替卡松，糠酸莫米松，布地奈德，丙酸氟替卡松 <span class="text-xs text-gray-500 ml-2">（已去除盐酸氮䓬斯汀）</span>',
    brandKeywords: '迪敏思，舒霏敏，雷诺考特，内舒拿，开瑞坦，辅舒良 <span class="text-xs text-gray-500 ml-2">（已去除逸青和爱赛平）</span>',
    volumeCalculation: [
      { platform: '微博', formula: '原创微博帖 + 与监测关键词/话题相关的且“发布到我的微博”的转发帖' },
      { platform: '微信', formula: '与监测关键词/话题相关的文章' },
      { platform: '小红书', formula: '与监测关键词/话题相关的原帖' },
      { platform: '短视频&视频', formula: '与监测关键词/话题相关的原帖' },
      { platform: '论坛', formula: '与监测关键词/话题相关的原帖' },
      { platform: '新闻', formula: '与监测关键词/话题相关的文章' },
      { platform: '问答', formula: '提问原帖 + 与监测关键词/话题相关的回答帖' }
    ],
    interactionCalculation: [
      { platform: '微博', formula: '点赞数+评论数+转发数' },
      { platform: '微信', formula: '点赞数+评论数+转发数+在看数' },
      { platform: '论坛', formula: '主帖推荐数+回帖数' },
      { platform: '小红书', formula: '评论数+点赞数+收藏数+转发数' },
      { platform: '短视频（e.g.抖音，快手）', formula: '点赞数+评论数+转发数+收藏数' },
      { platform: '视频', formula: '弹幕数+评论数+点赞数+投币数+收藏数+转发数' },
      { platform: '新闻', formula: '点赞数+评论数' },
      { platform: '问答', formula: '点赞数+评论数' }
    ]
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">鼻炎品类重点分子式及品牌声量&互动量统计标准</h1>
        </div>

        {/* 数据概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-blue-600 mb-3 border-b pb-2">数据概览</h2>
            <div className="space-y-2">
              <p><span className="font-medium">数据抓取时间：</span>{dataInfo.captureTime}</p>
              <p><span className="font-medium">分子式关键词：</span><span dangerouslySetInnerHTML={{__html: dataInfo.moleculeKeywords}} /></p>
              <p><span className="font-medium">品牌关键词：</span><span dangerouslySetInnerHTML={{__html: dataInfo.brandKeywords}} /></p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-blue-600 mb-3 border-b pb-2">数据抓取平台</h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {dataInfo.platforms.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 判定逻辑卡片 */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold text-blue-600 mb-3 border-b pb-2"> 分子式及品牌判定逻辑</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded">
              <h3 className="font-medium text-blue-700 mb-2">分子式</h3>
              <p className="text-sm">关键词匹配（全量数据）：主贴的标题，内容，视频图片，视频文本，视频花字中出现分子式名称</p>
              <p className="text-sm mt-1">品牌匹配：分子式会包含对应的品牌数据（品牌判定逻辑如下）</p>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <h3 className="font-medium text-green-700 mb-2">品牌</h3>
              <p className="text-sm">关键词匹配（全量数据）：主贴的标题，内容，视频图片，视频文本，视频花字中出现品牌名称。</p>
              <p className="text-sm mt-1">人工识别（KOL/KOC帖）：带有品牌特征的花字/药盒模型</p>
            </div>
          </div>
        </div>

        {/* 声量计算方式 */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold text-blue-600 mb-3 border-b pb-2"> 声量计算方式</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-4 py-2 text-left font-medium text-blue-700">主贴平台</th>
                  <th className="px-4 py-2 text-left font-medium text-blue-700">声量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dataInfo.volumeCalculation.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 font-medium">{item.platform}</td>
                    <td className="px-4 py-2 text-gray-700">{item.formula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 互动量计算方式 */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-blue-600 mb-3 border-b pb-2"> 互动量计算方式</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-green-50">
                  <th className="px-4 py-2 text-left font-medium text-green-700">主贴平台</th>
                  <th className="px-4 py-2 text-left font-medium text-green-700">互动量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dataInfo.interactionCalculation.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 font-medium">{item.platform}</td>
                    <td className="px-4 py-2 text-gray-700">{item.formula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCoverageDefinition;