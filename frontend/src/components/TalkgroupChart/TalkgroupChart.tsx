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
import { TalkgroupStats } from '../../types';
import { useTranslation } from 'react-i18next';
import './TalkgroupChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Custom plugin to show transmission count values on bars
const transmissionValuesOnBarsPlugin = {
  id: 'transmissionValuesOnBars',
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
        
        // Display transmission count
        ctx.fillText(value.toString(), x, y);
        ctx.restore();
      });
    });
  }
};

// Register this plugin only when this chart is rendered
const chartPlugins = [transmissionValuesOnBarsPlugin];

interface TalkgroupChartProps {
  data: TalkgroupStats[];
  loading: boolean;
}

const TalkgroupChart: React.FC<TalkgroupChartProps> = ({ data, loading }) => {
  const { t } = useTranslation();
  
  if (loading) {
    return (
      <div className="talkgroup-chart">
        <div className="chart-header">
          <h2>{t('talkgroupActivity')}</h2>
        </div>
        <div className="loading-message">{t('loading')}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="talkgroup-chart">
        <div className="chart-header">
          <h2>{t('talkgroupActivity')}</h2>
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
        label: t('transmissions'),
        data: data.map(item => item.count),
        backgroundColor: 'rgba(118, 75, 162, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
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
            return `${t('transmissions')}: ${context.parsed.x}`;
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
            size: 11,
            weight: 'normal' as const,
          },
          maxRotation: 0,
          callback: function(value: any, index: number) {
            const item = data[index];
            return item ? `${item.name} (ID: ${item.talkgroup_id})` : '';
          },
          padding: 8,
        },
        border: {
          display: false,
        }
      }
    },
    layout: {
      padding: {
        left: 5,
        right: 50, // More padding for values positioned after bars
        top: 5,
        bottom: 5
      }
    },
    elements: {
      bar: {
        borderRadius: 4,
      }
    },
    datasets: {
      bar: {
        categoryPercentage: 0.8,
        barPercentage: 0.6,
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

  // Calculate height based on number of items - more compact
  const chartHeight = Math.max(200, data.length * 30);

  return (
    <div className="talkgroup-chart">
      <div className="chart-header">
        <h2>{t('talkgroupActivity')}</h2>
        <p className="chart-subtitle">{t('numberOfTransmissionsByTalkgroup')}</p>
      </div>
      
      <div className="chart-container">
        <div className="chart-wrapper-full">
          <div className="chart-bars-container-full" style={{ height: `${chartHeight}px` }}>
            <Bar data={chartData} options={options} plugins={chartPlugins} />
          </div>
        </div>
      </div>
      
      <div className="chart-footer">
        <small>{t('showingTopActiveGroups', { count: data.length })}</small>
      </div>
    </div>
  );
};

export default TalkgroupChart;