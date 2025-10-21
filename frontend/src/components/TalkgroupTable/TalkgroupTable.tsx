import React from 'react';
import { useTranslation } from 'react-i18next';
import { TalkgroupStats, TalkgroupDurationStats } from '../../types';
import './TalkgroupTable.css';

interface TalkgroupTableProps {
  statsData: TalkgroupStats[];
  durationData: TalkgroupDurationStats[];
  loading: boolean;
}

interface CombinedTalkgroupData {
  talkgroup_id: number;
  name: string;
  count: number;
  total_duration: number;
}

// Helper function to format duration in human readable format
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${secs} sec`;
  }
};

const TalkgroupTable: React.FC<TalkgroupTableProps> = ({ statsData, durationData, loading }) => {
  const { t } = useTranslation();
  
  if (loading) {
    return (
      <div className="talkgroup-table-container">
        <div className="table-header">
          <h2>{t('talkgroupStatisticsTable')}</h2>
        </div>
        <div className="loading-message">{t('loading')}</div>
      </div>
    );
  }

  if (!statsData || statsData.length === 0) {
    return (
      <div className="talkgroup-table-container">
        <div className="table-header">
          <h2>{t('talkgroupStatisticsTable')}</h2>
        </div>
        <div className="no-data-message">No data available for the selected filters.</div>
      </div>
    );
  }

  // Combine stats and duration data based on talkgroup_id
  const combinedData: CombinedTalkgroupData[] = statsData.map(stat => {
    const duration = durationData.find(dur => dur.talkgroup_id === stat.talkgroup_id);
    return {
      talkgroup_id: stat.talkgroup_id,
      name: stat.name,
      count: stat.count,
      total_duration: duration ? duration.total_duration : 0
    };
  });

  // Sort by count (descending) to match the chart order
  combinedData.sort((a, b) => b.count - a.count);

  return (
    <div className="talkgroup-table-container">
      <div className="table-header">
        <h2>{t('talkgroupStatisticsTable')}</h2>
        <p className="table-subtitle">{t('detailedTalkgroupStatistics')}</p>
      </div>
      
      <div className="table-wrapper">
        <table className="talkgroup-table">
          <thead>
            <tr>
              <th className="destination-name">{t('destinationName')}</th>
              <th className="destination-id">{t('destinationID')}</th>
              <th className="count">{t('count')}</th>
              <th className="total-duration">{t('totalDuration')}</th>
            </tr>
          </thead>
          <tbody>
            {combinedData.map((item, index) => (
              <tr key={item.talkgroup_id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                <td className="destination-name">
                  <span className="talkgroup-name">{item.name}</span>
                </td>
                <td className="destination-id">{item.talkgroup_id}</td>
                <td className="count">
                  <span className="count-value">{item.count.toLocaleString()}</span>
                </td>
                <td className="total-duration">
                  <span className="duration-value">{formatDuration(item.total_duration)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="table-footer">
        <small>{t('showingTopActiveGroups', { count: combinedData.length })}</small>
      </div>
    </div>
  );
};

export default TalkgroupTable;