import { useState, useEffect } from 'react';
import './Statistics.css';

function Statistics() {
  const [flagStats, setFlagStats] = useState([]);
  const [events, setEvents] = useState([]);
  const [totalFlags, setTotalFlags] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch statistics from backend
  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/statistics');
      if (response.ok) {
        const data = await response.json();
        setFlagStats(data.flagStats || []);
        setEvents(data.events || []);
        setTotalFlags(data.totalFlags || 0);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        console.error('Failed to fetch statistics:', response.statusText);
        // Fall back to mock data if backend is not available
        loadMockData();
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Fall back to mock data if backend is not available
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock flag statistics by IP
    const mockFlagStats = [
      { ip: '10.10.1.10', service: 'Service1', flags: 15, lastCapture: '2025-07-13 14:30:22' },
      { ip: '10.10.2.10', service: 'Service1', flags: 8, lastCapture: '2025-07-13 14:25:15' },
      { ip: '10.10.3.10', service: 'Service1', flags: 12, lastCapture: '2025-07-13 14:20:45' },
      { ip: '127.0.0.1', service: 'Service2', flags: 3, lastCapture: '2025-07-13 14:15:30' },
      { ip: '127.0.0.2', service: 'Service2', flags: 7, lastCapture: '2025-07-13 14:10:12' },
    ];      // Mock recent events
      const mockEvents = [
        { id: 1, type: 'flag_captured', message: 'Flag captured from 10.10.1.10', timestamp: '2025-07-13 14:30:22', service: 'Service1' },
        { id: 2, type: 'exploit_success', message: 'Exploit successful on 10.10.2.10 (flag found)', timestamp: '2025-07-13 14:28:15', service: 'Service1' },
        { id: 3, type: 'flag_captured', message: 'Flag captured from 127.0.0.2', timestamp: '2025-07-13 14:25:45', service: 'Service2' },
        { id: 4, type: 'exploit_timeout', message: 'Exploit timed out on 10.10.4.10', timestamp: '2025-07-13 14:22:30', service: 'Service1' },
        { id: 5, type: 'exploit_completed', message: 'Exploit completed on 10.10.5.10 (no flag found)', timestamp: '2025-07-13 14:21:15', service: 'Service1' },
        { id: 6, type: 'flag_captured', message: 'Flag captured from 10.10.3.10', timestamp: '2025-07-13 14:20:45', service: 'Service1' },
        { id: 7, type: 'exploit_success', message: 'Exploit successful on 127.0.0.1 (flag found)', timestamp: '2025-07-13 14:18:12', service: 'Service2' },
        { id: 8, type: 'flag_submitted', message: '5 flags submitted to checker', timestamp: '2025-07-13 14:15:30', service: 'System' },
        { id: 9, type: 'exploit_error', message: 'Exploit failed on 10.10.6.10', timestamp: '2025-07-13 14:12:15', service: 'Service1' },
      ];

    setFlagStats(mockFlagStats);
    setEvents(mockEvents);
    setTotalFlags(mockFlagStats.reduce((total, stat) => total + stat.flags, 0));
    setLastUpdate(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    // Initial fetch
    fetchStatistics();

    // Set up polling every 10 seconds to update statistics
    const interval = setInterval(fetchStatistics, 10000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type) => {
    switch (type) {
      case 'flag_captured':
        return '🚩';
      case 'exploit_success':
        return '✅';
      case 'exploit_completed':
        return '✔️';
      case 'exploit_timeout':
        return '⏰';
      case 'exploit_error':
        return '❌';
      case 'flag_submitted':
        return '📤';
      default:
        return '📊';
    }
  };

  const getEventClass = (type) => {
    switch (type) {
      case 'flag_captured':
        return 'event-success';
      case 'exploit_success':
        return 'event-success';
      case 'exploit_completed':
        return 'event-info';
      case 'exploit_timeout':
        return 'event-warning';
      case 'exploit_error':
        return 'event-error';
      case 'flag_submitted':
        return 'event-info';
      default:
        return 'event-default';
    }
  };

  return (
    <div className="statistics-container">
      {/* Flag Statistics Section */}
      <div className="stats-section flag-stats">
        <div className="section-header">
          <h3>Flag Statistics</h3>
          <div className="header-controls">
            <div className="total-flags">
              Total Flags: <span className="flag-count">{totalFlags}</span>
            </div>
            <button 
              className="refresh-button" 
              onClick={fetchStatistics}
              disabled={isLoading}
              title="Refresh Statistics"
            >
              {isLoading ? '🔄' : '↻'}
            </button>
          </div>
        </div>
        
        <div className="stats-grid">
          {isLoading && flagStats.length === 0 ? (
            <div className="loading-indicator">
              <div className="loading-spinner">🔄</div>
              <div className="loading-text">Loading statistics...</div>
            </div>
          ) : flagStats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <div className="empty-text">No flag statistics yet</div>
              <div className="empty-subtext">Start running exploits to see statistics</div>
            </div>
          ) : (
            flagStats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-header">
                  <span className="ip-address">{stat.ip}</span>
                  <span className="service-badge">{stat.service}</span>
                </div>
                <div className="stat-content">
                  <div className="flag-number">{stat.flags}</div>
                  <div className="flag-label">flags</div>
                </div>
                <div className="stat-footer">
                  <span className="last-capture">Last: {stat.lastCapture}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Events Section */}
      <div className="stats-section events">
        <div className="section-header">
          <h3>Recent Events</h3>
          <div className="header-controls">
            <div className="events-count">
              {events.length} events
            </div>
            {lastUpdate && (
              <div className="last-update">
                Updated: {lastUpdate}
              </div>
            )}
          </div>
        </div>
        
        <div className="events-list">
          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <div className="empty-text">No events yet</div>
              <div className="empty-subtext">Activity will appear here as exploits run</div>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className={`event-item ${getEventClass(event.type)}`}>
                <div className="event-icon">{getEventIcon(event.type)}</div>
                <div className="event-content">
                  <div className="event-message">{event.message}</div>
                  <div className="event-meta">
                    <span className="event-timestamp">{event.timestamp}</span>
                    <span className="event-service">{event.service}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Statistics;
