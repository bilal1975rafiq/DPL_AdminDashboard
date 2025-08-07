import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { api } from '../utils/api';



const Charts = ({ stats }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState([]);
  const [purposeLoading, setPurposeLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('line');


  useEffect(() => {
    fetchChartData();
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    setPurposeLoading(true);
    try {
      const response = await api.get('/visitors', { params: { page: 1, limit: 50 } });
      setVisitors(response.data.visitors || []);
    } catch (error) {
      setVisitors([]);
    } finally {
      setPurposeLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await api.get('/visitors/chart-data?days=30');
      setChartData(response.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const visitorTypeData = stats.typeStats ? stats.typeStats.map(item => ({
    name: item._id,
    value: item.count
  })) : [];

  const topHostsData = stats.topHosts ? stats.topHosts.map(item => ({
    name: item._id,
    visitors: item.count
  })) : [];

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  // Find peak activity day
  let peakDay = null;
  let peakCount = 0;
  let peakDayFormatted = null;
  if (chartData && chartData.length > 0) {
    const max = chartData.reduce((acc, cur) => cur.count > acc.count ? cur : acc, chartData[0]);
    peakDay = max._id;
    peakCount = max.count;
    // Format date as 'Jul 29, 2025'
    if (peakDay) {
      const d = new Date(peakDay);
      peakDayFormatted = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }

  // Calculate growth trend (this month vs last month)
  let growthPercent = null;
  let thisMonthCount = 0;
  let lastMonthCount = 0;
  if (chartData && chartData.length > 0) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    chartData.forEach(d => {
      const date = new Date(d._id);
      if (date.getFullYear() === thisYear && date.getMonth() === thisMonth) {
        thisMonthCount += d.count;
      } else if (date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth) {
        lastMonthCount += d.count;
      }
    });
    if (lastMonthCount > 0) {
      growthPercent = Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
    } else if (thisMonthCount > 0) {
      growthPercent = 100;
    } else {
      growthPercent = null;
    }
  }

  // Find most popular purpose from first page of visitors
  let popularPurpose = null;
  if (visitors && visitors.length > 0) {
    const purposeCounts = {};
    visitors.forEach(v => {
      const p = v.Purpose && v.Purpose.trim() ? v.Purpose.trim() : 'Unknown';
      purposeCounts[p] = (purposeCounts[p] || 0) + 1;
    });
    popularPurpose = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0][0];
  }

  return (
    <div className="charts-container">
      <div className="charts-grid">
        {/* Daily Visitors Trend */}
        <div className="chart-card">
          <h3>Daily Visitor Trend (Last 30 Days)</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: 12 }}>
            <button
              onClick={() => setActiveChart('line')}
              style={{
                background: activeChart === 'line' ? '#8B5CF6' : '#F3F4F6',
                color: activeChart === 'line' ? '#fff' : '#374151',
                border: 'none',
                borderRadius: 6,
                padding: '4px 16px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Line
            </button>
            <button
              onClick={() => setActiveChart('area')}
              style={{
                background: activeChart === 'area' ? '#8B5CF6' : '#F3F4F6',
                color: activeChart === 'area' ? '#fff' : '#374151',
                border: 'none',
                borderRadius: 6,
                padding: '4px 16px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Area
            </button>
          </div>
          {loading ? (
            <div className="chart-loading">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              {activeChart === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="_id" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="_id" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8B5CF6" 
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Visitor Types Distribution */}
        <div className="chart-card">
          <h3>Visitor Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={visitorTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {visitorTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Hosts */}
        <div className="chart-card full-width">
          <h3>Top Hosts by Visitor Count</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topHostsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Bar 
                dataKey="visitors" 
                fill="#06B6D4"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="insights-section">
        <h3>Rebel Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">🔥</div>
            <div className="insight-content">
              <h4>Peak Activity</h4>
              {peakDay ? (
                <p>Highest traffic: ({peakCount}) arrived on <b>{peakDayFormatted}</b></p>
              ) : (
                <p>Not enough data</p>
              )}
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Growth Trend</h4>
              {growthPercent !== null ? (
                <p>
                  Traffic: {growthPercent >= 0 ? 'increased' : 'decreased'} by <b>{Math.abs(growthPercent)}%</b> this month
                </p>
              ) : (
                <p>Not enough data</p>
              )}
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">👥</div>
            <div className="insight-content">
              <h4>Popular Purpose</h4>
              {purposeLoading ? (
                <p>Loading...</p>
              ) : popularPurpose ? (
                <p>Most common: <b>{popularPurpose}</b></p>
              ) : (
                <p>Not enough data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;