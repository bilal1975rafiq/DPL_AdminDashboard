import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiDownload, FiRefreshCw, FiCalendar, FiX } from 'react-icons/fi';
import { api } from '../utils/api';
import { format } from 'date-fns';

const VisitorTable = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    host: '',
    startDate: '',
    endDate: ''
  });



  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm,
        ...filters
      };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });
      const response = await api.get('/visitors', { params });
      setVisitors(response.data.visitors);
      setTotalPages(response.data.pagination.pages);
      setTotalVisitors(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      host: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const exportData = async () => {
    try {
      // Get all data for export (not paginated)
      const params = {
        limit: 10000, // Large limit to get all data
        search: searchTerm,
        ...filters
      };
      
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });
      
      const response = await api.get('/visitors', { params });
      const exportVisitors = response.data.visitors;
      
      // Convert to CSV
      const csvContent = [
        ['Type', 'Name', 'CNIC', 'Email', 'Phone', 'Host', 'Purpose', 'Entry Time'],
        ...exportVisitors.map(v => [
          v.Type || '',
          v.Name || '',
          v.CNIC || '',
          v.Email || '',
          v.Phone || '',
          v.Host || '',
          v.Purpose || '',
          v.EntryTime ? format(new Date(v.EntryTime), 'yyyy-MM-dd HH:mm:ss') : ''
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Create filename with current date and filters
      let filename = `dpl-visitors-${format(new Date(), 'yyyy-MM-dd')}`;
      if (filters.startDate || filters.endDate) {
        filename += `_filtered`;
      }
      filename += '.csv';
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      alert(`Successfully exported ${exportVisitors.length} visitor records!`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const getFilterSummary = () => {
    const activeFilters = [];
    if (filters.type) activeFilters.push(`Type: ${filters.type}`);
    if (filters.host) activeFilters.push(`Host: ${filters.host}`);
    if (filters.startDate) activeFilters.push(`From: ${format(new Date(filters.startDate), 'MMM dd, yyyy')}`);
    if (filters.endDate) activeFilters.push(`To: ${format(new Date(filters.endDate), 'MMM dd, yyyy')}`);
    if (searchTerm) activeFilters.push(`Search: ${searchTerm}`);
    
    return activeFilters.length > 0 ? activeFilters.join(' • ') : 'No filters applied';
  };

  const hasActiveFilters = () => {
    return filters.type || filters.host || filters.startDate || filters.endDate || searchTerm;
  };

  return (
    <div className="visitor-table-container">
      <div className="table-header">
        <div className="table-header-left">
          <h2>Visitor Management</h2>
          <div className="filter-summary">
            <span className="results-count">{totalVisitors} total visitors</span>
            {hasActiveFilters() && (
              <span className="active-filters">• {getFilterSummary()}</span>
            )}
          </div>
        </div>
        
        <div className="table-actions">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search visitors..."
              value={searchTerm}
              onChange={handleSearch}
              className="table-search"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="clear-search-btn"
                title="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            title="Toggle filters"
          >
            <FiFilter />
            Filters
            {hasActiveFilters() && <span className="filter-indicator"></span>}
          </button>
          
          <button onClick={fetchVisitors} className="refresh-btn" title="Refresh data">
            <FiRefreshCw />
          </button>
          
          <button onClick={exportData} className="export-btn" title="Export to CSV">
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Visitor Type</label>
              <select 
                value={filters.type} 
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="guest">Guest</option>
                <option value="vendor">Vendor</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Host</label>
              <input
                type="text"
                placeholder="Filter by host name..."
                value={filters.host}
                onChange={(e) => handleFilterChange('host', e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">
                <FiCalendar className="filter-icon" />
                From Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="filter-input date-input"
                max={filters.endDate || format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">
                <FiCalendar className="filter-icon" />
                To Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="filter-input date-input"
                min={filters.startDate}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>
          
          <div className="filters-actions">
            <button onClick={clearFilters} className="clear-filters-btn">
              <FiX /> Clear All Filters
            </button>
            <div className="quick-date-filters">
              <button 
                onClick={() => {
                  const today = format(new Date(), 'yyyy-MM-dd');
                  handleFilterChange('startDate', today);
                  handleFilterChange('endDate', today);
                }}
                className="quick-filter-btn"
              >
                Today
              </button>
              <button 
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  handleFilterChange('startDate', format(weekAgo, 'yyyy-MM-dd'));
                  handleFilterChange('endDate', format(today, 'yyyy-MM-dd'));
                }}
                className="quick-filter-btn"
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  handleFilterChange('startDate', format(monthAgo, 'yyyy-MM-dd'));
                  handleFilterChange('endDate', format(today, 'yyyy-MM-dd'));
                }}
                className="quick-filter-btn"
              >
                Last 30 Days
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading rebel data...</p>
          </div>
        ) : visitors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No visitors found</h3>
            <p>
              {hasActiveFilters() 
                ? 'Try adjusting your filters or search terms.' 
                : 'No visitor data available at the moment.'
              }
            </p>
            {hasActiveFilters() && (
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table className="visitor-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>CNIC</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Host</th>
                <th>Purpose</th>
                <th>Entry Time</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((visitor, index) => (
                <tr key={visitor._id || index} className="table-row">
                  <td>
                    <span className={`type-badge ${visitor.Type?.toLowerCase()}`}>
                      {visitor.Type}
                    </span>
                  </td>
                  <td className="name-cell">{visitor.Name}</td>
                  <td>{visitor.CNIC}</td>
                  <td className="email-cell">{visitor.Email}</td>
                  <td>{visitor.Phone}</td>
                  <td className="host-cell">{visitor.Host}</td>
                  <td className="purpose-cell" title={visitor.Purpose}>
                    {visitor.Purpose}
                  </td>
                  <td className="date-cell">
                    {visitor.EntryTime 
                      ? format(new Date(visitor.EntryTime), 'MMM dd, yyyy HH:mm')
                      : 'Not recorded'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && visitors.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            <span>
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalVisitors)} of {totalVisitors} visitors
            </span>
          </div>
          
          <div className="pagination-controls">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              First
            </button>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
            
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorTable;