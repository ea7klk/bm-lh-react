import React from 'react';
import { TalkgroupStats } from '../../types';
import './TalkgroupChart.css';

interface TalkgroupChartProps {
  data: TalkgroupStats[];
  loading: boolean;
}

const TalkgroupChart: React.FC<TalkgroupChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="talkgroup-chart">
        <div className="chart-header">
          <h2>Most Active Talkgroups</h2>
        </div>
        <div className="loading-message">Loading chart data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="talkgroup-chart">
        <div className="chart-header">
          <h2>Most Active Talkgroups</h2>
        </div>
        <div className="no-data-message">No data available for the selected filters.</div>
      </div>
    );
  }

  // Find the maximum count for scaling
  const maxCount = Math.max(...data.map(item => item.count));

  return (
    <div className="talkgroup-chart">
      <div className="chart-header">
        <h2>Most Active Talkgroups</h2>
        <p className="chart-subtitle">Number of transmissions by talkgroup</p>
      </div>
      
      <div className="chart-container">
        <div className="chart-bars">
          {data.map((item, index) => {
            // Calculate bar width as percentage of maximum
            const widthPercent = (item.count / maxCount) * 100;
            
            return (
              <div key={item.talkgroup_id} className="bar-item">
                <div className="bar-row">
                  <div className="talkgroup-info">
                    <span className="talkgroup-name" title={item.name}>
                      {item.name}
                    </span>
                    <span className="talkgroup-id">
                      (ID: {item.talkgroup_id})
                    </span>
                  </div>
                  <div className="bar-wrapper">
                    <div 
                      className="bar"
                      style={{ width: `${Math.max(widthPercent, 2)}%` }}
                      title={`${item.name} (ID: ${item.talkgroup_id}): ${item.count} transmissions`}
                    >
                      <div className="bar-label">
                        {item.count}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="chart-footer">
        <small>Showing top {data.length} most active talkgroups</small>
      </div>
    </div>
  );
};

export default TalkgroupChart;