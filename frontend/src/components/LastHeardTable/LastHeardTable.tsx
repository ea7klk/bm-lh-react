import React from 'react';
import { LastHeardEntry } from '../../types';
import './LastHeardTable.css';

interface LastHeardTableProps {
  entries: LastHeardEntry[];
  loading: boolean;
}

const LastHeardTable: React.FC<LastHeardTableProps> = ({ entries, loading }) => {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
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
            <th>Timestamp</th>
            <th>Callsign</th>
            <th>Name</th>
            <th>DMR ID</th>
            <th>Target</th>
            <th>Source</th>
            <th>Duration</th>
            <th>Slot</th>
            <th>Reflector</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{formatTimestamp(entry.timestamp)}</td>
              <td className="callsign">{entry.callsign}</td>
              <td>{entry.name || '-'}</td>
              <td>{entry.dmr_id}</td>
              <td>{entry.target_name || entry.target_id}</td>
              <td>{entry.source}</td>
              <td>{formatDuration(entry.duration)}</td>
              <td>{entry.slot || '-'}</td>
              <td>{entry.reflector || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LastHeardTable;
