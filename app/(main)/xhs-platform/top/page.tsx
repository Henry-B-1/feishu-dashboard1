'use client'
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';

// SVG图标组件
const SearchIcon = ({ size = 18, color = "#64748B" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FilterIcon = ({ size = 18, color = "#64748B" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 20V4M6 20V10M18 20V10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowDownIcon = ({ size = 16, color = "#2D5AF1" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowUpIcon = ({ size = 16, color = "#64748B" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 15L12 9L6 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MessageSquareIcon = ({ size = 16, color = "#2D5AF1" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserIcon = ({ size = 16, color = "#64748B" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 加载动画组件
const LoadingSkeleton = () => (
  <div style={{
    gridColumn: '1/-1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px',
    background: '#FFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #e2e8f0',
      borderTop: '3px solid #2D5AF1',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <span style={{
      marginTop: '16px',
      fontSize: '14px',
      color: '#64748B',
      fontWeight: 500
    }}>数据加载中...</span>
    <style jsx global>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// 错误提示组件
const ErrorTip = ({ text }) => (
  <div style={{
    gridColumn: '1/-1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px',
    background: '#FFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px'
  }}>
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8V12" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 16H12.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <p style={{
      marginTop: '16px',
      fontSize: '14px',
      color: '#ef4444',
      fontWeight: 500
    }}>
      {text}
    </p>
  </div>
);

export default function DouyinTopPostsPage() {
  // 状态管理
  const [rawData, setRawData] = useState([]); // 接口原始数据
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState(''); // 错误状态
  const [searchKey, setSearchKey] = useState(''); // 搜索关键词
  const [filterMolecule, setFilterMolecule] = useState('全部'); // 分子式筛选
  const [sortType, setSortType] = useState('desc'); // 排序类型

  // 从接口获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:3000/api/feishu/XHS');

        // 核心筛选：只保留标题为「重点分子式TOP热帖（抖音）」的数据
        const filteredByTitle = res.data.filter(item =>
          item.fields?.['标题'] === '重点分子式TOP热帖（红书）'
        );

        setRawData(filteredByTitle);
        setError('');
      } catch (err) {
        console.error('数据请求失败：', err);
        setError('数据加载失败，请检查接口是否可用');
        setRawData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 处理数据映射（标准化接口字段 → 页面展示字段）
  const formattedPosts = useMemo(() => {
    return rawData.map(item => {
      const fields = item.fields || {};

      // 处理互动量格式：去除逗号并转为数字
      const interactionCount = fields['互动量']
        ? Number(fields['互动量'].replace(/,/g, ''))
        : 0;

      // 处理URL字段（兼容对象格式 {link, text} 和普通字符串）
      const urlObj = fields['url'] || {};
      const postLink = typeof urlObj === 'object' ? urlObj.link : urlObj;
      const postText = typeof urlObj === 'object' ? urlObj.text : urlObj;

      return {
        分子式: fields['分子式'] || '', // 接口中的分子式字段
        品牌: fields['品牌'] || '无品牌', // 接口中的品牌字段
        标题文本: postText || '', // 帖子标题文本
        标题链接: postLink || '', // 帖子跳转链接
        作者: fields['作者'] || '未知作者', // 接口中的作者字段
        达人量级: fields['达人量级'] || '未知量级', // 接口中的达人量级字段
        互动量: interactionCount // 处理后的互动量数字
      };
    });
  }, [rawData]);

  // 二次筛选+排序（搜索+分子式+互动量）
  const filteredPosts = useMemo(() => {
    let result = [...formattedPosts];

    // 关键词搜索（标题文本/作者）
    if (searchKey) {
      result = result.filter(item =>
        item.标题文本.includes(searchKey) || item.作者.includes(searchKey)
      );
    }

    // 分子式筛选（自动适配接口中的分子式）
    if (filterMolecule !== '全部') {
      result = result.filter(item => item.分子式 === filterMolecule);
    }

    // 互动量排序
    result.sort((a, b) => sortType === 'desc' ? b.互动量 - a.互动量 : a.互动量 - b.互动量);

    return result;
  }, [formattedPosts, searchKey, filterMolecule, sortType]);

  // 动态生成分子式筛选选项（从接口数据中提取，自动更新）
  const moleculeOptions = useMemo(() => {
    // 从筛选后的有效数据中提取唯一的分子式
    const uniqueMolecules = [...new Set(formattedPosts.map(item => item.分子式))].filter(Boolean);
    // 始终以"全部"开头，后续跟随接口中的所有分子式
    return ['全部', ...uniqueMolecules];
  }, [formattedPosts]); // 依赖formattedPosts，数据更新时自动重新生成

  // 达人量级标签样式
  const getLevelTagStyle = (level) => {
    const styles = {
      '超头部': { bg: '#2D5AF1', color: '#FFF' },
      '头部': { bg: '#EBF0FF', color: '#2D5AF1' },
      '腰部': { bg: '#F8F9FA', color: '#495057' },
      '肩部': { bg: '#FFF3E0', color: '#FF9800' },
      '尾部': { bg: '#F8F9FA', color: '#868E96' },
      '未知量级': { bg: '#F8F9FA', color: '#868E96' }
    };
    return styles[level] || { bg: '#F8F9FA', color: '#495057' };
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      padding: '24px',
      boxSizing: 'border-box',
      background: '#F8FAFC',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* 页面标题栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #FFF 0%, #FAFAFA 100%)',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
          color: '#1E293B',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5L7 15.59V9H5V19H15V17H8.41L19 6.41Z" fill="#2D5AF1"/>
          </svg>
          红书-重点分子式TOP热帖
        </h2>
        <div style={{
          color: '#64748B',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>

          <span style={{
            padding: '2px 6px',
            background: '#EBF0FF',
            color: '#2D5AF1',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {filteredPosts.length}条
          </span>
        </div>
      </div>

      {/* 筛选&搜索栏 */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 280px',
          maxWidth: '400px',
          background: '#FFF',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '0 12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <SearchIcon size={18} color="#64748B" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="搜索标题/作者..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              padding: '12px 0',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 200px',
          maxWidth: '240px'
        }}>
          <FilterIcon size={18} color="#64748B" style={{ marginRight: '8px' }} />
          <select
            value={filterMolecule}
            onChange={(e) => setFilterMolecule(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              backgroundColor: '#FFF',
              fontSize: '14px',
              color: '#1E293B',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748B%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '14px'
            }}
          >
            {/* 动态渲染分子式选项，接口更新时自动同步 */}
            {moleculeOptions.map((item) => (
              <option key={item} value={item} style={{ padding: '8px' }}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div
          onClick={() => setSortType(sortType === 'desc' ? 'asc' : 'desc')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '12px 16px',
            background: '#FFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#1E293B',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#FFF'}
        >
          互动量排序
          {sortType === 'desc' ? (
            <ArrowDownIcon size={16} color="#2D5AF1" />
          ) : (
            <ArrowUpIcon size={16} color="#64748B" />
          )}
        </div>
      </div>

      {/* 数据列表（卡片式） */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorTip text={error} />
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => {
            const levelStyle = getLevelTagStyle(post.达人量级);
            return (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(180deg, #FFF 0%, #FAFAFA 100%)',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
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
                {/* 顶部标签区 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      background: '#EBF0FF',
                      color: '#2D5AF1',
                      fontSize: '12px',
                      borderRadius: '6px',
                      fontWeight: 500
                    }}>
                      {post.分子式}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      background: '#F8F9FA',
                      color: '#495057',
                      fontSize: '12px',
                      borderRadius: '6px',
                      fontWeight: 500
                    }}>
                      {post.品牌}
                    </span>
                  </div>
                  <span style={{
                    ...levelStyle,
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    fontWeight: 500
                  }}>
                    {post.达人量级}
                  </span>
                </div>

                {/* 帖子标题（可点击跳转） */}
                <a
                  href={post.标题链接}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: 'none',
                    display: 'block'
                  }}
                >
                  <h3 style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1E293B',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#2D5AF1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#1E293B';
                  }}>
                    {post.标题文本}
                  </h3>
                </a>

                {/* 底部信息区 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #F1F5F9'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <UserIcon size={16} color="#64748B" />
                    <span style={{
                      fontSize: '14px',
                      color: '#495057',
                      whiteSpace: 'nowrap',
                      maxWidth: '180px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {post.作者}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '14px',
                    color: '#2D5AF1',
                    fontWeight: 500
                  }}>
                    <MessageSquareIcon size={16} color="#2D5AF1" />
                    {post.互动量.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{
            gridColumn: '1/-1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '48px',
            background: '#FFF',
            border: '1px dashed #E2E8F0',
            borderRadius: '12px'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 12L12 16L16 12" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V16" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{
              marginTop: '16px',
              fontSize: '14px',
              color: '#64748B'
            }}>
              未找到匹配的热帖数据
            </p>
          </div>
        )}
      </div>
    </div>
  );
}