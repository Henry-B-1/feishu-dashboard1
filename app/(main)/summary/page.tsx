'use client'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

// 替换为时间维度的声量/互动量模拟数据
const chartData = [
  {
    date: '01日',
    volume: 25.8, // 声量（单位：W）
    interaction: 6.2, // 互动量（单位：W）
  },
  {
    date: '05日',
    volume: 26.5,
    interaction: 6.5,
  },
  {
    date: '10日',
    volume: 27.2,
    interaction: 6.8,
  },
  {
    date: '15日',
    volume: 28.9,
    interaction: 7.1,
  },
  {
    date: '20日',
    volume: 28.5,
    interaction: 6.9,
  },
  {
    date: '25日',
    volume: 29.1,
    interaction: 7.3,
  },
  {
    date: '30日',
    volume: 28.6,
    interaction: 6.9,
  },
];

export default function SummaryPage() {
  return (
    <div style={{ padding: '20px' }}>
      {/* 原有卡片区域 */}
      <div className='card-container' style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div className="card" style={{
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          backgroundColor: 'white'
        }}>
          <div className="card-title" style={{ color: '#666', marginBottom: '8px' }}>全平台总声量</div>
          <div className="num-indicator" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>286.3W</div>
          <div className="num-desc" style={{ color: '#2ecc71', fontSize: '14px' }}>环比上月 +12.5%</div>
        </div>

        <div className="card" style={{
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          backgroundColor: 'white'
        }}>
          <div className="card-title" style={{ color: '#666', marginBottom: '8px' }}>全平台总互动量</div>
          <div className="num-indicator" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>68.9W</div>
          <div className="num-desc" style={{ color: '#2ecc71', fontSize: '14px' }}>环比上月 +8.2%</div>
        </div>

        <div className="card" style={{
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          backgroundColor: 'white'
        }}>
          <div className="card-title" style={{ color: '#666', marginBottom: '8px' }}>SOV</div>
          <div className="num-indicator" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>56.8%</div>
          <div className="num-desc" style={{ color: '#666', fontSize: '14px' }}>声量核心渠道</div>
        </div>

        <div className="card" style={{
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          backgroundColor: 'white'
        }}>
          <div className="card-title" style={{ color: '#666', marginBottom: '8px' }}>SOE</div>
          <div className="num-indicator" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>32.2%</div>
          <div className="num-desc" style={{ color: '#666', fontSize: '14px' }}>互动核心渠道</div>
        </div>
      </div>

      {/* 新增双轴折线图区域 */}
      <div style={{
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backgroundColor: 'white'
      }}>
        <div className="card-title" style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '20px',
          color: '#333'
        }}>本月声量&互动量趋势（全平台）</div>

        <LineChart
          width="100%"
          height={400}
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          {/* 网格线 */}
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          {/* X轴：时间 */}
          <XAxis
            dataKey="date"
            label={{ value: '日期', position: 'insideBottom', offset: -5 }}
            tick={{ fill: '#666' }}
          />

          {/* 左Y轴：声量（单位W） */}
          <YAxis
            yAxisId="left"
            label={{ value: '声量 (W)', angle: -90, position: 'insideLeft' }}
            tick={{ fill: '#8884d8' }}
            domain={['dataMin - 1', 'dataMax + 1']} // 自动适配值域，留边距
          />

          {/* 右Y轴：互动量（单位W） */}
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: '互动量 (W)', angle: 90, position: 'insideRight' }}
            tick={{ fill: '#82ca9d' }}
            domain={['dataMin - 0.5', 'dataMax + 0.5']} // 自动适配值域，留边距
          />

          {/* 提示框 */}
          <Tooltip
            formatter={(value, name) => [
              `${value} W`,
              name === 'volume' ? '声量' : '互动量'
            ]}
            labelFormatter={(label) => `日期：${label}`}
          />

          {/* 图例 */}
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => value === 'volume' ? '声量' : '互动量'}
          />

          {/* 声量折线（绑定左Y轴） */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="volume"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            strokeWidth={2}
            name="volume"
          />

          {/* 互动量折线（绑定右Y轴） */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="interaction"
            stroke="#82ca9d"
            strokeWidth={2}
            name="interaction"
          />
        </LineChart>
      </div>
    </div>
  );
}