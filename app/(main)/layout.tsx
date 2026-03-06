'use client'
import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import "./globals.css";
import { usePathname } from 'next/navigation';
import type { MouseEvent as ReactMouseEvent, CSSProperties } from 'react'; // 修改：重命名避免冲突
import { MonthProvider, useMonthContext } from './context/MonthContext';

const monthAbbrMap = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const monthFullNameMap = {
  'Jan': '1月', 'Feb': '2月', 'Mar': '3月', 'Apr': '4月',
  'May': '5月', 'Jun': '6月', 'Jul': '7月', 'Aug': '8月',
  'Sep': '9月', 'Oct': '10月', 'Nov': '11月', 'Dec': '12月'
};

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

const generateYearList = (startYear = 2000, endYear = 2099) => {
  return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
};

const generateMonthsByYear = (year: number) => {
  const yearSuffix = year.toString().slice(-2);
  return monthAbbrMap.map(abbr => `${abbr}-${yearSuffix}`);
};

const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { selectedMonth, setSelectedMonth, allMonthOptions } = useMonthContext();

  // 解析初始年份和月份
  const [selectedYear, setSelectedYear] = React.useState<number>(() => {
    const yearSuffix = selectedMonth.split('-')[1];
    return 2000 + Number(yearSuffix);
  });

  const [selectedMonthAbbr, setSelectedMonthAbbr] = React.useState<string>(() => {
    return selectedMonth.split('-')[0];
  });

  // 控制选择器展开/收起状态
  const [isYearExpanded, setIsYearExpanded] = React.useState(false);
  const [isMonthExpanded, setIsMonthExpanded] = React.useState(false);

  // 创建ref用于标识选择器容器
  const yearSelectorRef = useRef<HTMLDivElement>(null);
  const monthSelectorRef = useRef<HTMLDivElement>(null);
  const timeSelectorContainerRef = useRef<HTMLDivElement>(null);

  // 年份和月份列表ref
  const yearListRef = useRef<HTMLDivElement>(null);
  const monthListRef = useRef<HTMLDivElement>(null);

  // 滚动防抖计时器
  const yearScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const monthScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentYearMonths = generateMonthsByYear(selectedYear);

  // ========== 点击外部区域关闭选择器 ==========
  useEffect(() => {
    // 修改1：使用原生 MouseEvent 类型，而非 React.MouseEvent
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击是否在时间选择容器外
      if (timeSelectorContainerRef.current && !timeSelectorContainerRef.current.contains(event.target as Node)) {
        // 关闭所有展开的选择器
        setIsYearExpanded(false);
        setIsMonthExpanded(false);
      }
    };

    // 修改2：先转换为 unknown，再转换为 EventListener（TS 推荐的安全转换方式）
    document.addEventListener('mousedown', handleClickOutside as unknown as EventListener);

    // 清理函数
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as unknown as EventListener);
    };
  }, []);

  // ========== 年份选择器逻辑 ==========
  const handleYearScroll = () => {
    if (!yearListRef.current) return;

    if (yearScrollTimerRef.current) {
      clearTimeout(yearScrollTimerRef.current);
    }

    yearScrollTimerRef.current = setTimeout(() => {
      const container = yearListRef.current!;
      const yearItems = Array.from(container.querySelectorAll('[data-year]')) as HTMLElement[];
      if (yearItems.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenterY = containerRect.top + containerRect.height / 2;

      let closestItem = yearItems[0];
      let minDistance = Infinity;

      yearItems.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterY = itemRect.top + itemRect.height / 2;
        const distance = Math.abs(itemCenterY - containerCenterY);

        if (distance < minDistance) {
          minDistance = distance;
          closestItem = item;
        }
      });

      closestItem.scrollIntoView({
        block: 'center',
        behavior: 'smooth'
      });
    }, 300);
  };

  const scrollToSelectedYear = () => {
    if (!yearListRef.current || !isYearExpanded) return;

    requestAnimationFrame(() => {
      const currentYearEl = yearListRef.current!.querySelector(`[data-year="${selectedYear}"]`);
      if (currentYearEl) {
        yearListRef.current!.scrollTop = 0;

        const itemRect = currentYearEl.getBoundingClientRect();
        const containerRect = yearListRef.current!.getBoundingClientRect();
        const scrollOffset = itemRect.top - containerRect.top - (containerRect.height - itemRect.height) / 2;

        yearListRef.current!.scrollTo({
          top: yearListRef.current!.scrollTop + scrollOffset,
          behavior: 'smooth'
        });
      }
    });
  };

  // 监听年份展开状态，展开时滚动到选中项
  useEffect(() => {
    if (isYearExpanded) {
      const timer = setTimeout(() => {
        scrollToSelectedYear();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isYearExpanded, selectedYear]);

  useEffect(() => {
    const container = yearListRef.current;
    if (container) {
      container.addEventListener('scroll', handleYearScroll);
      return () => {
        container.removeEventListener('scroll', handleYearScroll);
        if (yearScrollTimerRef.current) clearTimeout(yearScrollTimerRef.current);
      };
    }
  }, []);

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    // 更新月份列表并保持当前选中的月份缩写
    const newMonthValue = `${selectedMonthAbbr}-${year.toString().slice(-2)}`;
    setSelectedMonth(newMonthValue);
    setIsYearExpanded(false);
  };

  // ========== 月份选择器逻辑 ==========
  const handleMonthScroll = () => {
    if (!monthListRef.current) return;

    if (monthScrollTimerRef.current) {
      clearTimeout(monthScrollTimerRef.current);
    }

    monthScrollTimerRef.current = setTimeout(() => {
      const container = monthListRef.current!;
      const monthItems = Array.from(container.querySelectorAll('[data-month]')) as HTMLElement[];
      if (monthItems.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenterY = containerRect.top + containerRect.height / 2;

      let closestItem = monthItems[0];
      let minDistance = Infinity;

      monthItems.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const itemCenterY = itemRect.top + itemRect.height / 2;
        const distance = Math.abs(itemCenterY - containerCenterY);

        if (distance < minDistance) {
          minDistance = distance;
          closestItem = item;
        }
      });

      closestItem.scrollIntoView({
        block: 'center',
        behavior: 'smooth'
      });
    }, 300);
  };

  const scrollToSelectedMonth = () => {
    if (!monthListRef.current || !isMonthExpanded) return;

    requestAnimationFrame(() => {
      const currentMonthEl = monthListRef.current!.querySelector(`[data-month="${selectedMonthAbbr}"]`);
      if (currentMonthEl) {
        monthListRef.current!.scrollTop = 0;

        const itemRect = currentMonthEl.getBoundingClientRect();
        const containerRect = monthListRef.current!.getBoundingClientRect();
        const scrollOffset = itemRect.top - containerRect.top - (containerRect.height - itemRect.height) / 2;

        monthListRef.current!.scrollTo({
          top: monthListRef.current!.scrollTop + scrollOffset,
          behavior: 'smooth'
        });
      }
    });
  };

  // 监听月份展开状态，展开时滚动到选中项
  useEffect(() => {
    if (isMonthExpanded) {
      const timer = setTimeout(() => {
        scrollToSelectedMonth();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isMonthExpanded, selectedMonthAbbr]);

  useEffect(() => {
    const container = monthListRef.current;
    if (container) {
      container.addEventListener('scroll', handleMonthScroll);
      return () => {
        container.removeEventListener('scroll', handleMonthScroll);
        if (monthScrollTimerRef.current) clearTimeout(monthScrollTimerRef.current);
      };
    }
  }, []);

  const handleMonthSelect = (monthAbbr: string) => {
    setSelectedMonthAbbr(monthAbbr);
    const newMonthValue = `${monthAbbr}-${selectedYear.toString().slice(-2)}`;
    setSelectedMonth(newMonthValue);
    setIsMonthExpanded(false);
  };

  // ========== 其他通用逻辑 ==========
  const handleAnchorClick = (e: ReactMouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const handleNavItemHover = (e: ReactMouseEvent<HTMLDivElement>, path: string, isChild = false) => {
    const isActive = pathname === path;
    if (isActive) {
      e.currentTarget.style.backgroundColor = STYLE_CONST.colors.primaryBg;
      e.currentTarget.style.color = STYLE_CONST.colors.primaryText;
    } else {
      e.currentTarget.style.backgroundColor = STYLE_CONST.colors.bg.hover;
      e.currentTarget.style.color = STYLE_CONST.colors.text.hover;
    }
  };

  const handleNavItemLeave = (e: ReactMouseEvent<HTMLDivElement>, path: string, isChild = false) => {
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

        {/* 🔥 添加ref标识时间选择容器 */}
        <div
          ref={timeSelectorContainerRef}
          style={{
            marginRight:'10px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            height: '48px',
          }}>选择时间：</span>

          {/* 年份选择器 - 添加ref */}
          <div
            ref={yearSelectorRef}
            style={{
              position: 'relative',
              minWidth: '100px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.3s ease',
              height: isYearExpanded ? '120px' : '48px',
              overflow: 'hidden',
              cursor: 'pointer',
              ...(isYearExpanded ? { alignSelf: 'flex-start' } : { alignSelf: 'center' }),
            }}
            onClick={() => setIsYearExpanded(!isYearExpanded)}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#5470c6';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(84, 112, 198, 0.1)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
            }}
          >
            <div style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              color: '#2D5AF1',
              backgroundColor: '#EBF0FF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 1,
              position: 'relative',
              height: '48px',
              boxSizing: 'border-box',
              opacity: isYearExpanded ? 0 : 1,
              visibility: isYearExpanded ? 'hidden' : 'visible',
              transition: 'opacity 0.2s ease',
            }}>
              {selectedYear}年
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" transform={isYearExpanded ? 'rotate(180)' : 'rotate(0)'} />
              </svg>
            </div>

            <div
              ref={yearListRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                paddingTop: 0,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#e2e8f0 #ffffff',
                height: '100%',
                scrollBehavior: 'smooth',
                overscrollBehavior: 'contain',
                boxSizing: 'border-box',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {generateYearList(2000, 2099).map((year) => (
                <div
                  key={year}
                  data-year={year}
                  style={{
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 500,
                    color: year === selectedYear ? '#2D5AF1' : '#1e293b',
                    backgroundColor: year === selectedYear ? '#EBF0FF' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    height: '40px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    left: 0,
                    top: 0,
                    width: '100%',
                  }}
                  onClick={() => handleYearSelect(year)}
                  onMouseOver={(e) => {
                    if (year !== selectedYear) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#F8F9FA';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (year !== selectedYear) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff';
                    }
                  }}
                >
                  {year}年
                </div>
              ))}
            </div>
          </div>

          {/* 月份选择器 - 添加ref */}
          <div
            ref={monthSelectorRef}
            style={{
              position: 'relative',
              minWidth: '100px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.3s ease',
              height: isMonthExpanded ? '120px' : '48px',
              overflow: 'hidden',
              cursor: 'pointer',
              ...(isMonthExpanded ? { alignSelf: 'flex-start' } : { alignSelf: 'center' }),
            }}
            onClick={() => setIsMonthExpanded(!isMonthExpanded)}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#5470c6';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(84, 112, 198, 0.1)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
            }}
          >
            <div style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              color: '#2D5AF1',
              backgroundColor: '#EBF0FF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 1,
              position: 'relative',
              height: '48px',
              boxSizing: 'border-box',
              opacity: isMonthExpanded ? 0 : 1,
              visibility: isMonthExpanded ? 'hidden' : 'visible',
              transition: 'opacity 0.2s ease',
            }}>
              {monthFullNameMap[selectedMonthAbbr as keyof typeof monthFullNameMap]}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" transform={isMonthExpanded ? 'rotate(180)' : 'rotate(0)'} />
              </svg>
            </div>

            <div
              ref={monthListRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                paddingTop: 0,
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#e2e8f0 #ffffff',
                height: '100%',
                scrollBehavior: 'smooth',
                overscrollBehavior: 'contain',
                boxSizing: 'border-box',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {monthAbbrMap.map((monthAbbr) => (
                <div
                  key={monthAbbr}
                  data-month={monthAbbr}
                  style={{
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 500,
                    color: monthAbbr === selectedMonthAbbr ? '#2D5AF1' : '#1e293b',
                    backgroundColor: monthAbbr === selectedMonthAbbr ? '#EBF0FF' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    height: '40px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    left: 0,
                    top: 0,
                    width: '100%',
                  }}
                  onClick={() => handleMonthSelect(monthAbbr)}
                  onMouseOver={(e) => {
                    if (monthAbbr !== selectedMonthAbbr) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#F8F9FA';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (monthAbbr !== selectedMonthAbbr) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff';
                    }
                  }}
                >
                  {monthFullNameMap[monthAbbr as keyof typeof monthFullNameMap]}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ width: '80px' }}></div>
      </div>

      {/* 主体容器 - 保持不变 */}
      <div className="dashboard-container" style={{
        display: 'flex',
        gap: STYLE_CONST.spacing.xl,
        height: 'calc(100vh - 140px)',
        boxSizing: 'border-box'
      } as CSSProperties}>

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