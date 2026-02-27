'use client'
import React, { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';

// 定义数据类型
interface PostItem {
  分子式: string;
  品牌: string;
  标题文本: string;
  标题链接: string;
  作者: string;
  达人量级: string;
  互动量: number;
}

// 自定义下拉选择组件（核心，复用给分子式和达人量级筛选）
const CustomDropdown = ({
  value,
  onChange,
  options,
  width = '300px'
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  width?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 获取选中项
  const selected = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={ref} style={{ width, position: 'relative' }}>
      {/* 下拉触发按钮 */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: 'white',
          textAlign: 'left',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <span>{selected.label}</span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }}>▼</span>
      </button>

      {/* 下拉选项列表 */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          width: '100%',
          marginTop: '4px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          zIndex: 100
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                backgroundColor: opt.value === value ? '#ebf0ff' : 'white',
                color: opt.value === value ? '#2d5af1' : '#1e293b',
                cursor: 'pointer'
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function DouyinPosts() {
  // 基础状态
  const [data, setData] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedMolecule, setSelectedMolecule] = useState('全部');
  const [selectedLevel, setSelectedLevel] = useState('全部');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 1. 获取并格式化数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/feishu/XHS');
        // 筛选目标数据并格式化
        const formatted = res.data
          .filter((item: any) => item.fields?.['标题'] === '重点分子式TOP热帖（红书）')
          .map((item: any) => {
            const f = item.fields || {};
            return {
              分子式: f['分子式'] || '',
              品牌: f['品牌'] || '无品牌',
              标题文本: (f['url']?.text || f['url'] || ''),
              标题链接: (f['url']?.link || f['url'] || ''),
              作者: f['作者'] || '未知作者',
              达人量级: f['达人量级'] || '未知量级',
              互动量: Number((f['互动量'] || '0').replace(/,/g, ''))
            };
          });
        setData(formatted);
      } catch (err) {
        console.error('数据获取失败:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. 统计分子式数量（核心：确保数量计算准确）
  const moleculeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    // 统计每个分子式的数量（不受达人量级筛选影响）
    data.forEach(item => {
      const mol = item.分子式.trim();
      if (mol) stats[mol] = (stats[mol] || 0) + 1;
    });
    return stats;
  }, [data]);

  // 新增：根据选中的分子式，筛选出对应的数据集（用于联动达人量级统计）
  const moleculeFilteredData = useMemo(() => {
    if (selectedMolecule === '全部') {
      return data; // 未筛选分子式时，使用全部数据
    }
    return data.filter(item => item.分子式 === selectedMolecule); // 筛选分子式后，使用该分子式的所有数据
  }, [data, selectedMolecule]); // 依赖选中的分子式，实时更新

  // 修改：达人量级统计（依赖筛选后的分子式数据）
  const levelStats = useMemo(() => {
    const stats: Record<string, number> = {};
    // 统计「当前分子式下」每个达人量级的数量
    moleculeFilteredData.forEach(item => {
      const level = item.达人量级.trim() || '未知量级';
      stats[level] = (stats[level] || 0) + 1;
    });
    return stats;
  }, [moleculeFilteredData]); // 依赖筛选后的数据集，实现联动

  // 3. 构建分子式下拉选项（强制显示数量）
  const dropdownOptions = useMemo(() => {
    const baseOptions = ['全部', ...Array.from(new Set(data.map(item => item.分子式.trim()).filter(Boolean)))];
    return baseOptions.map(opt => ({
      value: opt,
      label: opt === '全部'
        ? `全部 (${data.length}条)`
        : `${opt} (${moleculeStats[opt] || 0}条)`
    }));
  }, [data, moleculeStats]);

  // 修改：构建达人量级下拉选项（联动分子式筛选，显示当前分子式下的量级数量）
  const levelOptions = useMemo(() => {
    const levelPriority = ['超头部', '头部', '腰部', '肩部', '尾部', '未知量级'];
    // 从「当前分子式下的数据集」中提取所有达人量级并去重
    const allLevels = Array.from(new Set(moleculeFilteredData.map(item => item.达人量级.trim()).filter(Boolean)));
    const sortedLevels = levelPriority.filter(level => allLevels.includes(level))
      .concat(allLevels.filter(level => !levelPriority.includes(level)));

    const baseOptions = ['全部', ...sortedLevels];
    return baseOptions.map(opt => ({
      value: opt,
      label: opt === '全部'
        ? `全部 (${moleculeFilteredData.length}条)` // 显示当前分子式下的总条数
        : `${opt} (${levelStats[opt] || 0}条)` // 显示当前分子式下该量级的条数
    }));
  }, [moleculeFilteredData, levelStats]); // 依赖筛选后的数据集和统计结果

  // 4. 筛选和排序数据
  const filteredData = useMemo(() => {
    let result = [...data];
    // 关键词筛选
    if (searchText) {
      result = result.filter(item =>
        item.标题文本.includes(searchText) || item.作者.includes(searchText)
      );
    }
    // 分子式筛选
    if (selectedMolecule !== '全部') {
      result = result.filter(item => item.分子式 === selectedMolecule);
    }
    // 达人量级筛选
    if (selectedLevel !== '全部') {
      result = result.filter(item => item.达人量级 === selectedLevel);
    }
    // 互动量排序
    result.sort((a, b) => sortOrder === 'desc' ? b.互动量 - a.互动量 : a.互动量 - b.互动量);
    return result;
  }, [data, searchText, selectedMolecule, selectedLevel, sortOrder]);

  // 达人量级样式
  const getLevelStyle = (level: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      '超头部': { bg: '#2D5AF1', color: '#FFF' },
      '头部': { bg: '#EBF0FF', color: '#2D5AF1' },
      '腰部': { bg: '#F8F9FA', color: '#495057' },
      '肩部': { bg: '#FFF3E0', color: '#FF9800' },
      '尾部': { bg: '#F8F9FA', color: '#868E96' },
      '未知量级': { bg: '#F8F9FA', color: '#868E96' }
    };
    return styles[level] || styles['未知量级'];
  };

  // 加载状态
  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <div style={{
      width: '100%',
      padding: '24px',
      background: '#f8fafc',
      fontFamily: 'sans-serif'
    }}>
      {/* 标题栏 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>红书-重点分子式TOP热帖</h2>
        <span style={{ color: '#64748b', fontSize: '14px' }}>
          共 {filteredData.length} 条数据
        </span>
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {/* 搜索框 */}
        <input
          type="text"
          placeholder="搜索标题/作者..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            width: '280px'
          }}
        />

        {/* 分子式下拉筛选 */}
        <CustomDropdown
          value={selectedMolecule}
          onChange={setSelectedMolecule}
          options={dropdownOptions}
        />

        {/* 达人量级下拉筛选（联动分子式） */}
        <CustomDropdown
          value={selectedLevel}
          onChange={setSelectedLevel}
          options={levelOptions}
        />

        {/* 排序按钮 */}
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          style={{
            padding: '12px 10px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          互动量 {sortOrder === 'desc' ? '降序' : '升序'}
        </button>
      </div>

      {/* 数据列表 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {filteredData.length === 0 ? (
          <div style={{
            gridColumn: '1/-1',
            padding: '48px',
            textAlign: 'center',
            border: '1px dashed #e2e8f0',
            borderRadius: '8px'
          }}>
            暂无匹配数据
          </div>
        ) : (
          filteredData.map((item, idx) => (
            <div key={idx} style={{
              padding: '20px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              {/* 顶部标签 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    background: '#ebf0ff',
                    color: '#2d5af1',
                    fontSize: '12px',
                    borderRadius: '4px'
                  }}>{item.分子式}</span>
                  <span style={{
                    padding: '4px 8px',
                    background: '#f8f9fa',
                    color: '#495057',
                    fontSize: '12px',
                    borderRadius: '4px'
                  }}>{item.品牌}</span>
                </div>
                <span style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  backgroundColor: getLevelStyle(item.达人量级).bg,
                  color: getLevelStyle(item.达人量级).color
                }}>{item.达人量级}</span>
              </div>

              {/* 标题 */}
              <a
                href={item.标题链接}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#1e293b',
                  textDecoration: 'none',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '16px'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '16px' }}>{item.标题文本}</h3>
              </a>

              {/* 底部信息 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <span style={{ color: '#64748b', fontSize: '14px' }}>{item.作者}</span>
                <span style={{ color: '#2d5af1', fontWeight: '500' }}>
                  互动量: {item.互动量.toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}