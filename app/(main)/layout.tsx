'use client'
import Link from 'next/link';
import "./globals.css";
import { usePathname, useRouter } from 'next/navigation';

import type { MouseEvent, CSSProperties} from 'react';
import { useEffect } from 'react';

// 定义全局样式常量
const STYLE_CONST = {
  // 配色系统
  colors: {
    primary: '#2D5AF1',       // 主色调
    primaryBg: '#2D5AF1',      // 激活项背景
    primaryText: '#FFFFFF',    // 激活项文字
    primaryLight: '#EBF0FF',   // 主色浅背景（hover）
    text: {
      main: '#212529',        // 主要文本
      secondary: '#6C757D',   // 次要文本
      tertiary: '#868E96',    // 三级文本
      hover: '#495057'        // hover文本
    },
    bg: {
      card: 'rgba(255, 255, 255, 0.9)', // 卡片背景
      hover: '#F8F9FA'        // hover背景
    },
    border: {
      normal: '#E9ECEF',      // 常规边框
      light: '#F1F3F5'        // 浅色边框
    }
  },
  // 阴影
  shadow: {
    normal: '0 2px 8px rgba(0, 0, 0, 0.03)',
    hover: '0 4px 12px rgba(0, 0, 0, 0.05)',
    activeItem: '0 2px 6px rgba(45, 90, 241, 0.2)' // 激活项专属阴影
  },
  // 圆角
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px'
  },
  // 过渡动画
  transition: 'all 0.25s ease-in-out',
  // 间距
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px'
  },
  // 统一字号
  font: {
    navItem: '14px',    // 所有导航项统一字号
    sectionTitle: '13px'// 所有分组标题统一字号
  }
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  console.log('当前路由：', pathname);


  const router = useRouter();

// 登录拦截：没 token 就去登录页
useEffect(() => {
  const token = localStorage.getItem('token');
  // 排除登录页自己，不然会死循环
  if (pathname !== '/login' && !token) {
    router.push('/login');
  }
}, [pathname]);

// 退出登录
const logout = () => {
  localStorage.removeItem('token');
  router.push('/login');
};



  // 🔥 修复：使用React的MouseEvent类型，正确指定泛型
  // 锚点平滑跳转方法
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

  // 🔥 优化：为样式对象添加明确的类型标注
  // 通用导航项样式处理函数
  const getNavItemStyle = (path: string, isChild = false): CSSProperties => {
    const isActive = pathname === path;
    // 激活项专属样式
    const activeStyle: CSSProperties = {
      color: STYLE_CONST.colors.primaryText,
      backgroundColor: STYLE_CONST.colors.primaryBg,
      fontWeight: 500,
      boxShadow: STYLE_CONST.shadow.activeItem,
      borderLeft: isChild ? 'none' : `2px solid ${STYLE_CONST.colors.primaryLight}`
    };
    // 基础样式
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

  // 🔥 优化：为样式对象添加明确的类型标注
  // 通用分组标题样式
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

  // 🔥 修复：使用React的MouseEvent类型
  // 导航项hover处理函数（统一逻辑）
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

  // 🔥 修复：使用React的MouseEvent类型
  // 导航项mouseLeave处理函数（统一逻辑）
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

      {/* 头部区域 */}
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
        <button
          onClick={logout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2D5AF1',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          退出登录
        </button>
      </div>

      {/* 主体容器 */}
      <div className="dashboard-container" style={{
        display: 'flex',
        gap: STYLE_CONST.spacing.xl,
        height: 'calc(100vh - 140px)',
        boxSizing: 'border-box'
      } as CSSProperties}>

        {/* 侧边栏 */}
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

          {/* 本月总结 - 新增顶部外边距增大与上方间距，保留和全平台数据的近间距 */}
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

          {/* 全平台数据 - 保持和本月总结的近间距，无改动 */}
          <div className="nav-section" style={{ margin: `${STYLE_CONST.spacing.xs} 0 ${STYLE_CONST.spacing.lg} 0` } as CSSProperties}>
            <h3 className="section-title" style={getSectionTitleStyle()}>全平台数据</h3>
            {/* 重点分子式声量&互动量 */}
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
            {/* 重点品牌声量&互动量 */}
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

          {/* 抖音平台 - 保持原有默认大间距，无改动 */}
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

          {/* 小红书平台 - 保持原有默认大间距，无改动 */}
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

          {/* 覆盖范围和定义 - 保持原有默认大间距，无改动 */}
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

        {/* 主内容区 - 无任何改动 */}
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
}