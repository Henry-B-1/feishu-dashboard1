'use client'
import Link from 'next/link';
import "./globals.css";
import { usePathname } from 'next/navigation';
import type { MouseEvent, CSSProperties } from 'react';
// 导入月份上下文（仅新增这一行）
import { MonthProvider, useMonthContext } from './context/MonthContext';

// 定义全局样式常量（完全保留原有样式）
const STYLE_CONST = {
  colors: {
    primary: '#2D5AF1',
    primaryBg: '#2D5AF1',
    primaryText: '#FFFFFF',
    primaryLight: '#EBF0FF',
    text: {
      main: '#212529',
      secondary: '#6C757D',
      tertiary: '#868E96',
      hover: '#495057'
    },
    bg: {
      card: 'rgba(255, 255, 255, 0.9)',
      hover: '#F8F9FA'
    },
    border: {
      normal: '#E9ECEF',
      light: '#F1F3F5'
    }
  },
  shadow: {
    normal: '0 2px 8px rgba(0, 0, 0, 0.03)',
    hover: '0 4px 12px rgba(0, 0, 0, 0.05)',
    activeItem: '0 2px 6px rgba(45, 90, 241, 0.2)'
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px'
  },
  transition: 'all 0.25s ease-in-out',
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px'
  },
  font: {
    navItem: '14px',
    sectionTitle: '13px'
  }
};

// 提取布局内容到内部组件（仅新增 useMonthContext 调用）
const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  // 仅新增这一行：获取全局月份上下文
  const { selectedMonth, setSelectedMonth, allMonthOptions } = useMonthContext();
  console.log('当前路由：', pathname);

  // 🔥 完全保留原有所有方法，一行不改
  const handleAnchorClick = (e: MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      targetElement.classList.add('anchor-highlight');
      setTimeout(() => targetElement.classList.remove('anchor-highlight'), 1500);
    }
  };

  const getNavItemStyle = (path: string, isChild = false): CSSProperties => {
    const isActive = pathname === path;
    const activeStyle: CSSProperties = {
      color: STYLE_CONST.colors.primaryText,
      backgroundColor: STYLE_CONST.colors.primaryBg,
      fontWeight: 500,
      boxShadow: STYLE_CONST.shadow.activeItem,
      borderLeft: isChild ? 'none' : `2px solid ${STYLE_CONST.colors.primaryLight}`
    };
    const baseStyle: CSSProperties = {
      paddingLeft: isChild ? '40px' : '24px',
      paddingTop: isChild ? '8px' : '12px',
      paddingBottom: isChild ? '8px' : '12px',
      fontSize: STYLE_CONST.font.navItem,
      color: isChild ? STYLE_CONST.colors.text.tertiary : STYLE_CONST.colors.text.secondary,
      cursor: 'pointer',
      transition: STYLE_CONST.transition,
      position: 'relative',
      borderRadius: STYLE_CONST.radius.sm,
      margin: isChild ? `0 ${STYLE_CONST.spacing.xs}` : `0 ${STYLE_CONST.spacing.xs}`,
      backgroundColor: 'transparent',
      fontWeight: 400,
      boxShadow: 'none',
      borderLeft: 'none'
    };

    return isActive ? { ...baseStyle, ...activeStyle } : baseStyle;
  };

  const getSectionTitleStyle = (): CSSProperties => ({
    padding: `${STYLE_CONST.spacing.md} ${STYLE_CONST.spacing.xl}`,
    fontSize: STYLE_CONST.font.sectionTitle,
    color: STYLE_CONST.colors.text.secondary,
    cursor: 'default',
    transition: STYLE_CONST.transition,
    position: 'relative',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: 0
  });

  const handleNavItemHover = (e: MouseEvent<HTMLDivElement>, path: string, isChild = false) => {
    const isActive = pathname === path;
    if (isActive) {
      e.currentTarget.style.backgroundColor = STYLE_CONST.colors.primaryBg;
      e.currentTarget.style.color = STYLE_CONST.colors.primaryText;
    } else {
      e.currentTarget.style.backgroundColor = STYLE_CONST.colors.bg.hover;
      e.currentTarget.style.color = STYLE_CONST.colors.text.hover;
    }
  };

  const handleNavItemLeave = (e: MouseEvent<HTMLDivElement>, path: string, isChild = false) => {
    const isActive = pathname === path;
    if (isActive) {
      e.currentTarget.style.backgroundColor = STYLE_CONST.colors.primaryBg;
      e.currentTarget.style.color = STYLE_CONST.colors.primaryText;
    } else {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = isChild ? STYLE_CONST.colors.text.tertiary : STYLE_CONST.colors.text.secondary;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8F9FA',
      padding: STYLE_CONST.spacing.lg,
      boxSizing: 'border-box',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    } as CSSProperties}>

      {/* 头部区域 - 仅在原有结构中新增月份筛选器，样式完全保留 */}
      <div className="header-left" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${STYLE_CONST.spacing.lg} ${STYLE_CONST.spacing.xl}`,
        background: STYLE_CONST.colors.bg.card,
        backdropFilter: 'blur(12px)',
        borderRadius: STYLE_CONST.radius.lg,
        border: `1px solid ${STYLE_CONST.colors.border.normal}`,
        boxShadow: STYLE_CONST.shadow.normal,
        marginBottom: STYLE_CONST.spacing.xl,
        transition: STYLE_CONST.transition
      } as CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = STYLE_CONST.shadow.hover;
          e.currentTarget.style.borderColor = STYLE_CONST.colors.border.light;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = STYLE_CONST.shadow.normal;
          e.currentTarget.style.borderColor = STYLE_CONST.colors.border.normal;
        }}>

        <h1 style={{
          fontSize: '22px',
          color: STYLE_CONST.colors.text.main,
          fontWeight: 600,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: STYLE_CONST.spacing.sm
        } as CSSProperties}>
          迪敏思KPI dashboard
        </h1>

        {/* 🔥 仅新增这一块：月份筛选器（样式匹配原有设计规范） */}
        <div style={{
          marginRight:'10px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',

        }}>
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            color: '#475569',
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
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              boxSizing: 'border-box',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#5470c6';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(84, 112, 198, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
            }}
          >
            {allMonthOptions.map(month => (
              <option
                key={month}
                value={month}
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  fontWeight: 500,
                }}
              >
                {month}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '80px' }}></div>
      </div>

      {/* 主体容器 - 完全保留原有样式和结构，一行不改 */}
      <div className="dashboard-container" style={{
        display: 'flex',
        gap: STYLE_CONST.spacing.xl,
        height: 'calc(100vh - 140px)',
        boxSizing: 'border-box'
      } as CSSProperties}>

        {/* 侧边栏 - 完全保留原有样式和内容 */}
        <div className="sidebar" style={{
          width: '240px',
          background: STYLE_CONST.colors.bg.card,
          backdropFilter: 'blur(12px)',
          borderRadius: STYLE_CONST.radius.lg,
          border: `1px solid ${STYLE_CONST.colors.border.normal}`,
          boxShadow: STYLE_CONST.shadow.normal,
          padding: `${STYLE_CONST.spacing.sm} 0`,
          transition: STYLE_CONST.transition,
          overflowY: 'auto'
        } as CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = STYLE_CONST.shadow.hover;
            e.currentTarget.style.borderColor = STYLE_CONST.colors.border.light;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = STYLE_CONST.shadow.normal;
            e.currentTarget.style.borderColor = STYLE_CONST.colors.border.normal;
          }}>

          {/* 本月总结 */}
          <div
            className="nav-item"
            style={{...getNavItemStyle('/summary'), marginBottom: 0, marginTop: STYLE_CONST.spacing.lg} as CSSProperties}
            onMouseEnter={(e) => handleNavItemHover(e, '/summary')}
            onMouseLeave={(e) => handleNavItemLeave(e, '/summary')}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
              <li>
                <Link
                  href="/summary"
                  className="nav-link"
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                    display: 'block',
                    width: '100%',
                    height: '100%'
                  } as CSSProperties}>
                  本月总结
                </Link>
              </li>
            </ul>
          </div>

          {/* 全平台数据 */}
          <div className="nav-section" style={{ margin: `${STYLE_CONST.spacing.xs} 0 ${STYLE_CONST.spacing.lg} 0` } as CSSProperties}>
            <h3 className="section-title" style={getSectionTitleStyle()}>全平台数据</h3>
            <div
              className="nav-item"
              style={getNavItemStyle('/all-platform/molecule', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/all-platform/molecule', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/all-platform/molecule', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/all-platform/molecule"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    重点分子式声量&互动量
                  </Link>
                </li>
              </ul>
            </div>
            <div
              className="nav-item"
              style={getNavItemStyle('/all-platform/brand', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/all-platform/brand', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/all-platform/brand', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/all-platform/brand"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    重点品牌声量&互动量
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* 抖音平台 */}
          <div className="nav-section" style={{ margin: `${STYLE_CONST.spacing.lg} 0` } as CSSProperties}>
            <h3 className="section-title" style={getSectionTitleStyle()}>抖音平台</h3>
            <div
              className="nav-item"
              style={getNavItemStyle('/douyin-platform/molecule', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/douyin-platform/molecule', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/douyin-platform/molecule', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/douyin-platform/molecule"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    重点分子式声量&互动量
                  </Link>
                </li>
              </ul>
            </div>
            <div
              className="nav-item"
              style={getNavItemStyle('/douyin-platform/brand', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/douyin-platform/brand', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/douyin-platform/brand', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/douyin-platform/brand"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    重点品牌声量&互动量
                  </Link>
                </li>
              </ul>
            </div>
            <div
              className="nav-item"
              style={getNavItemStyle('/douyin-platform/kol', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/douyin-platform/kol', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/douyin-platform/kol', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/douyin-platform/kol"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    分子式KOL投放矩阵
                  </Link>
                </li>
              </ul>
            </div>
            <div
              className="nav-item"
              style={getNavItemStyle('/douyin-platform/top', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/douyin-platform/top', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/douyin-platform/top', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/douyin-platform/top"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    重点分子式TOP热帖
                  </Link>
                </li>
              </ul>
            </div>
            <div
              className="nav-item"
              style={getNavItemStyle('/douyin-platform/comment', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/douyin-platform/comment', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/douyin-platform/comment', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/douyin-platform/comment"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    KOL发帖评论区分析
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* 小红书平台 */}
          <div className="nav-section" style={{ margin: `${STYLE_CONST.spacing.lg} 0` } as CSSProperties}>
            <h3 className="section-title" style={getSectionTitleStyle()}>小红书平台</h3>
            <div
              className="nav-item"
              style={getNavItemStyle('/xhs-platform/molecule', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/xhs-platform/molecule', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/xhs-platform/molecule', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/xhs-platform/molecule"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    重点分子式声量&互动量
                  </Link>
                </li>
              </ul>
            </div>
            <div
              className="nav-item"
              style={getNavItemStyle('/xhs-platform/brand', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/xhs-platform/brand', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/xhs-platform/brand', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/xhs-platform/brand"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    重点品牌声量&互动量
                  </Link>
                </li>
              </ul>
            </div>
            <div
              className="nav-item"
              style={getNavItemStyle('/xhs-platform/kol', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/xhs-platform/kol', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/xhs-platform/kol', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/xhs-platform/kol"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    分子式KOL投放矩阵
                  </Link>
                </li>
              </ul>
            </div>
            <div
              className="nav-item"
              style={getNavItemStyle('/xhs-platform/top', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/xhs-platform/top', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/xhs-platform/top', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/xhs-platform/top"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    重点分子式TOP热帖
                  </Link>
                </li>
              </ul>
            </div>
            <div
              className="nav-item"
              style={getNavItemStyle('/xhs-platform/comment', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/xhs-platform/comment', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/xhs-platform/comment', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/xhs-platform/comment"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    KOL发帖评论区分析
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* 覆盖范围和定义 */}
          <div className="nav-section" style={{ margin: `${STYLE_CONST.spacing.lg} 0` } as CSSProperties}>
            <h3 className="section-title" style={getSectionTitleStyle()}>覆盖范围和定义</h3>
            <div
              className="nav-item"
              style={getNavItemStyle('/definition', true)}
              onMouseEnter={(e) => handleNavItemHover(e, '/definition', true)}
              onMouseLeave={(e) => handleNavItemLeave(e, '/definition', true)}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' } as CSSProperties}>
                <li>
                  <Link
                    href="/definition"
                    className="nav-link"
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    } as CSSProperties}>
                    覆盖范围和定义
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 主内容区 - 完全保留原有样式和结构 */}
        <div className="main-content" style={{
          flex: 1,
          background: STYLE_CONST.colors.bg.card,
          backdropFilter: 'blur(12px)',
          borderRadius: STYLE_CONST.radius.lg,
          border: `1px solid ${STYLE_CONST.colors.border.normal}`,
          boxShadow: STYLE_CONST.shadow.normal,
          padding: STYLE_CONST.spacing.xl,
          overflowY: 'auto',
          transition: STYLE_CONST.transition
        } as CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = STYLE_CONST.shadow.hover;
            e.currentTarget.style.borderColor = STYLE_CONST.colors.border.light;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = STYLE_CONST.shadow.normal;
            e.currentTarget.style.borderColor = STYLE_CONST.colors.border.normal;
          }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// 主布局组件 - 仅包裹上下文提供者，其他不变
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MonthProvider>
      <LayoutContent>{children}</LayoutContent>
    </MonthProvider>
  );
}