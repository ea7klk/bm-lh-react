import React from 'react';
import { LastHeardEntry } from '../../types';
import './LastHeardTable.css';

interface LastHeardTableProps {
  entries: LastHeardEntry[];
  loading: boolean;
}

const LastHeardTable: React.FC<LastHeardTableProps> = ({ entries, loading }) => {
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000); // Convert from Unix timestamp
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading last heard data...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="no-data">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="lastheard-table">
        <thead>
          <tr>
            <th>Start Time</th>
            <th>Source Call</th>
            <th>Source Name</th>
            <th>Source ID</th>
            <th>Talkgroup</th>
            <th>TG Name</th>
            <th>Country</th>
            <th>Continent</th>
            <th>Duration</th>
            <th>Talker Alias</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{formatTimestamp(entry.Start)}</td>
              <td className="callsign">{entry.SourceCall}</td>
              <td>{entry.SourceName || '-'}</td>
              <td>{entry.SourceID}</td>
              <td>{entry.DestinationCall || entry.DestinationID}</td>
              <td>{entry.talkgroup_name || entry.DestinationName || '-'}</td>
              <td>{entry.full_country_name || '-'}</td>
              <td>{entry.continent || '-'}</td>
              <td>{formatDuration(entry.duration)}</td>
              <td>{entry.TalkerAlias || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LastHeardTable;
