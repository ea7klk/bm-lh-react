import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { TalkgroupDurationStats } from '../../types';
import { useTranslation } from '../../i18n';
import './TalkgroupDurationChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to format duration in human readable format
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// Custom plugin to show duration values on bars
const durationValuesOnBarsPlugin = {
  id: 'durationValuesOnBars',
  afterDatasetsDraw: (chart: any) => {
    const { ctx, data } = chart;
    
    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      
      meta.data.forEach((bar: any, index: number) => {
        const value = dataset.data[index];
        
        ctx.save();
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#2c3e50'; // Dark text for better readability
        ctx.textAlign = 'left'; // Align text to the left of the position
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 2;
        
        const x = bar.x + 10; // Position just after the end of the bar
        const y = bar.y;
        
        // Format duration for display
        const formattedValue = formatDuration(value);
        ctx.fillText(formattedValue, x, y);
        ctx.restore();
      });
    });
  }
};

// Register this plugin only when this chart is rendered
const chartPlugins = [durationValuesOnBarsPlugin];

interface TalkgroupDurationChartProps {
  data: TalkgroupDurationStats[];
  loading: boolean;
}

const TalkgroupDurationChart: React.FC<TalkgroupDurationChartProps> = ({ data, loading }) => {
  const { t } = useTranslation();
  
  if (loading) {
    return (
      <div className="talkgroup-duration-chart">
        <div className="chart-header">
          <h2>{t('activityDuration')}</h2>
        </div>
        <div className="loading-message">{t('loading')}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="talkgroup-duration-chart">
        <div className="chart-header">
          <h2>{t('activityDuration')}</h2>
        </div>
        <div className="no-data-message">No data available for the selected filters.</div>
      </div>
    );
  }

  // Prepare data for Chart.js
  const chartData = {
    labels: data.map(item => `${item.name} (ID: ${item.talkgroup_id})`),
    datasets: [
      {
        label: t('avgDurationSeconds'),
        data: data.map(item => item.total_duration),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(118, 75, 162, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const item = data[context[0].dataIndex];
            return `${item.name} (ID: ${item.talkgroup_id})`;
          },
          label: (context: any) => {
            const seconds = context.parsed.x;
            return `Total Duration: ${formatDuration(seconds)}`;
          }
        }
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        },
        border: {
          display: false,
        }
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#2c3e50',
          font: {
            size: 12,
            weight: 'normal' as const,
          },
          maxRotation: 0,
          callback: function(value: any, index: number) {
            const item = data[index];
            return item ? `${item.name} (ID: ${item.talkgroup_id})` : '';
          },
          padding: 10,
        },
        border: {
          display: false,
        }
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 80, // More padding for duration text positioned after bars
        top: 10,
        bottom: 10
      }
    },
    elements: {
      bar: {
        borderRadius: 4,
      }
    },
    datasets: {
      bar: {
        categoryPercentage: 0.9,
        barPercentage: 0.8,
      }
    },
    interaction: {
      intersect: false,
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    }
  };

  // Calculate height based on number of items
  const chartHeight = Math.max(300, data.length * 50);

  return (
    <div className="talkgroup-duration-chart">
      <div className="chart-header">
        <h2>{t('talkgroupsByTotalDuration')}</h2>
        <p className="chart-subtitle">{t('totalAirTimeByTalkgroup')}</p>
      </div>
      
      <div className="chart-container">
        <div className="chart-wrapper-full">
          <div className="chart-bars-container-full" style={{ height: `${chartHeight}px` }}>
            <Bar data={chartData} options={options} plugins={chartPlugins} />
          </div>
        </div>
      </div>
      
      <div className="chart-footer">
        <small>{t('showingTopGroupsByDuration', { count: data.length })}</small>
        <br />
        <small style={{ fontStyle: 'italic', opacity: 0.8 }}>
          {t('simultaneousSessionsNote')}
        </small>
      </div>
    </div>
  );
};

export default TalkgroupDurationChart;