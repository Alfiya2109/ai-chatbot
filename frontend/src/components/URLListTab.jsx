import React, { useState, useMemo } from 'react';
import Loader from './Loader';
import Select from 'react-select';

const URLListTab = ({ urlList, renderTable, urlModalOpen, setUrlModalOpen, urlForm, setUrlForm, knowledgeBases, urlFormError, handleUrlModalSubmit, onBulkDelete, isLoading }) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [knowledgeBaseSearch, setKnowledgeBaseSearch] = useState('');
  // Change single value filter states to arrays
  const [selectedURLFilter, setSelectedURLFilter] = useState([]);
  const [selectedDescriptionFilter, setSelectedDescriptionFilter] = useState([]);
  const [selectedAddedByFilter, setSelectedAddedByFilter] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState([]);
  const [selectedKBFilters, setSelectedKBFilters] = useState([]);

  // Add filter popover state for each column
  const [showURLFilter, setShowURLFilter] = useState(false);
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [showAddedByFilter, setShowAddedByFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  // Add state for Knowledge Bases filter popover
  const [showKBFilter, setShowKBFilter] = useState(false);

  // Unique options for each filter
  const urlOptions = useMemo(() => {
    const urls = Array.from(new Set(urlList.map(u => u.url || 'Unknown URL')));
    return urls.map(url => ({ value: url, label: url }));
  }, [urlList]);
  const descriptionOptions = useMemo(() => {
    const descs = Array.from(new Set(urlList.map(u => u.description || '-')));
    return descs.map(desc => ({ value: desc, label: desc }));
  }, [urlList]);
  const addedByOptions = useMemo(() => {
    const users = Array.from(new Set(urlList.map(u => u.added_by || '-')));
    return users.map(user => ({ value: user, label: user }));
  }, [urlList]);
  const dateOptions = useMemo(() => {
    const dates = Array.from(new Set(urlList.map(u => u.uploaded_at ? new Date(u.uploaded_at).toLocaleDateString() : '-')));
    return dates.map(date => ({ value: date, label: date }));
  }, [urlList]);

  // Filter and sort URLs based on search term and sort settings
  const filteredURLs = useMemo(() => {
    let filtered = urlList;

    // URL filter (multi)
    if (selectedURLFilter && selectedURLFilter.length > 0) {
      filtered = filtered.filter(u => selectedURLFilter.includes(u.url || 'Unknown URL'));
    }
    // Description filter (multi)
    if (selectedDescriptionFilter && selectedDescriptionFilter.length > 0) {
      filtered = filtered.filter(u => selectedDescriptionFilter.includes(u.description || '-'));
    }
    // Added By filter (multi)
    if (selectedAddedByFilter && selectedAddedByFilter.length > 0) {
      filtered = filtered.filter(u => selectedAddedByFilter.includes(u.added_by || '-'));
    }
    // Date filter (multi)
    if (selectedDateFilter && selectedDateFilter.length > 0) {
      filtered = filtered.filter(u => selectedDateFilter.includes(u.uploaded_at ? new Date(u.uploaded_at).toLocaleDateString() : '-'));
    }
    // Knowledge base filter (multi)
    if (showSearchBox && selectedKBFilters.length > 0) {
      filtered = filtered.filter(url =>
        url.knowledge_bases &&
        url.knowledge_bases.some(kb =>
          typeof kb === 'string'
            ? selectedKBFilters.includes(kb)
            : (kb.name && selectedKBFilters.includes(kb.name))
        )
      );
    } else if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(url => {
        return (
          (url.url && url.url.toLowerCase().includes(term)) ||
          (url.description && url.description.toLowerCase().includes(term)) ||
          (url.knowledge_bases && url.knowledge_bases.some(kb =>
            typeof kb === 'string' ? kb.toLowerCase().includes(term) :
            (kb.name && kb.name.toLowerCase().includes(term))
          )) ||
          (url.added_by && url.added_by.toLowerCase().includes(term))
        );
      });
    }
    // Sorting logic
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = '';
        let bValue = '';
        switch (sortField) {
          case 'url':
            aValue = (a.url || '').toLowerCase();
            bValue = (b.url || '').toLowerCase();
            break;
          case 'description':
            aValue = (a.description || '').toLowerCase();
            bValue = (b.description || '').toLowerCase();
            break;
          case 'knowledge_bases':
            aValue = a.knowledge_bases ? a.knowledge_bases.map(kb =>
              typeof kb === 'string' ? kb : (kb.name || '')
            ).join(', ').toLowerCase() : '';
            bValue = b.knowledge_bases ? b.knowledge_bases.map(kb =>
              typeof kb === 'string' ? kb : (kb.name || '')
            ).join(', ').toLowerCase() : '';
            break;
          case 'added_by':
            aValue = (a.added_by || '').toLowerCase();
            bValue = (b.added_by || '').toLowerCase();
            break;
          case 'uploaded_at':
            aValue = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
            bValue = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
            break;
          default:
            return 0;
        }
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }
    return filtered;
  }, [urlList, searchTerm, selectedKBFilters, showSearchBox, sortField, sortDirection, selectedURLFilter, selectedDescriptionFilter, selectedAddedByFilter, selectedDateFilter]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-blue-600 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedItems(filteredURLs.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleItemSelect = (itemId, isChecked) => {
    if (isChecked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleDeleteAll = () => {
    setIsMultiSelectMode(true);
    setSelectedItems([]);
  };

  const handleConfirmDelete = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to delete.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} URL(s)? This action cannot be undone.`)) {
      try {
        const result = await onBulkDelete(selectedItems);
        if (result.success) {
          setIsMultiSelectMode(false);
          setSelectedItems([]);
          alert(`Successfully deleted ${selectedItems.length} URL(s).`);
        } else {
          alert(result.error || 'Failed to delete URLs. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting items:', error);
        alert('Failed to delete items. Please try again.');
      }
    }
  };

  const handleCancelMultiSelect = () => {
    setIsMultiSelectMode(false);
    setSelectedItems([]);
  };

  return (
    <div className="mt-6 w-11/12">
      {/* Loader overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-white bg-opacity-60">
          <Loader />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold mb-4">Uploaded URLs</h3>
        <div className="flex items-center space-x-2">
          {!isMultiSelectMode ? (
            <>
              <button
                className="bg-red-500 hover:bg-red-700 text-white rounded px-4 py-2 text-sm shadow"
                title="Delete Multiple"
                onClick={handleDeleteAll}
              >
                Delete All
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow"
                title="Add URL"
                aria-label="Add URL"
                onClick={() => setUrlModalOpen(true)}
              >
                <span>+</span>
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600">
                {selectedItems.length} selected
              </span>
              <button
                className="bg-red-500 hover:bg-red-700 text-white rounded px-4 py-2 text-sm"
                onClick={handleConfirmDelete}
                disabled={selectedItems.length === 0}
              >
                Confirm Delete ({selectedItems.length})
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-700 text-white rounded px-4 py-2 text-sm"
                onClick={handleCancelMultiSelect}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      {/* Search Filter */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search URLs by URL, description, knowledge base, or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredURLs.length} of {urlList.length} URLs
          </p>
        )}
      </div>
      {/* Table with sortable headers */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {isMultiSelectMode && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={selectedItems.length === filteredURLs.length && filteredURLs.length > 0}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th 
                className="relative px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('url')}
              >
                <div className="flex items-center space-x-1">
                  <span>URL</span>
                  {getSortIcon('url')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowDescriptionFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(false);
                      setShowURLFilter(prev => !prev);
                    }}
                    title="Filter URL"
                  >
                    <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showURLFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowURLFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={urlOptions}
                      value={urlOptions.filter(opt => selectedURLFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedURLFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter URL..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th 
                className="relative px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center space-x-1">
                  <span>Description</span>
                  {getSortIcon('description')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowURLFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(false);
                      setShowDescriptionFilter(prev => !prev);
                    }}
                    title="Filter Description"
                  >
                    <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showDescriptionFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowDescriptionFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={descriptionOptions}
                      value={descriptionOptions.filter(opt => selectedDescriptionFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedDescriptionFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Description..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th 
                className="px-3 py-2 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors relative"
                onClick={() => handleSort('knowledge_bases')}
              >
                <div className="flex items-center space-x-1">
                  <span>Knowledge Bases</span>
                  {getSortIcon('knowledge_bases')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowURLFilter(false);
                      setShowDescriptionFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowKBFilter(prev => !prev);
                    }}
                    title="Filter Knowledge Bases"
                  >
                    <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showKBFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowKBFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={knowledgeBases.map(kb => ({ value: kb.name, label: kb.name }))}
                      value={knowledgeBases.filter(kb => selectedKBFilters.includes(kb.name)).map(kb => ({ value: kb.name, label: kb.name }))}
                      onChange={selectedOptions => setSelectedKBFilters(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Knowledge Bases..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th 
                className="relative px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('added_by')}
              >
                <div className="flex items-center space-x-1">
                  <span>Added By</span>
                  {getSortIcon('added_by')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowURLFilter(false);
                      setShowDescriptionFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(false);
                      setShowAddedByFilter(prev => !prev);
                    }}
                    title="Filter Added By"
                  >
                    <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showAddedByFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowAddedByFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={addedByOptions}
                      value={addedByOptions.filter(opt => selectedAddedByFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedAddedByFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Added By..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th 
                className="relative px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('uploaded_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Uploaded Date</span>
                  {getSortIcon('uploaded_at')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowURLFilter(false);
                      setShowDescriptionFilter(false);
                      setShowAddedByFilter(false);
                      setShowSearchBox(false);
                      setShowDateFilter(prev => !prev);
                    }}
                    title="Filter Uploaded Date"
                  >
                    <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showDateFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowDateFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={dateOptions}
                      value={dateOptions.filter(opt => selectedDateFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedDateFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Uploaded Date..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Render table rows using filteredURLs */}
            {isLoading ? (
              <tr>
                <td colSpan={isMultiSelectMode ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <Loader />
                  </div>
                </td>
              </tr>
            ) : filteredURLs.length === 0 ? (
              <tr>
                <td colSpan={isMultiSelectMode ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'No URLs found matching your search.' : 'No URLs uploaded yet.'}
                </td>
              </tr>
            ) : (
              filteredURLs.map((url) => (
                <tr key={url.id} className="hover:bg-gray-50 transition-colors">
                  {isMultiSelectMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(url.id)}
                        onChange={(e) => handleItemSelect(url.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {url.url || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">
                      {url.description || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {url.knowledge_bases && url.knowledge_bases.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {url.knowledge_bases.map((kb, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {typeof kb === 'string' ? kb : kb.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">
                      {url.added_by || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">
                      {url.uploaded_at ? new Date(url.uploaded_at).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {url.url && (
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Visit
                        </a>
                      )}
                      <button
                        onClick={() => onBulkDelete([url.id])}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        title="Delete URL"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* URL Upload Modal */}
      {urlModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setUrlModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Add URL</h2>
            <form onSubmit={handleUrlModalSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">URL <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={urlForm.url}
                  onChange={e => setUrlForm({ ...urlForm, url: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter the URL"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={urlForm.description}
                  onChange={e => setUrlForm({ ...urlForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter a description (optional)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                <Select
                  isMulti
                  isSearchable
                  options={knowledgeBases.map(kb => ({ value: String(kb.id), label: kb.name }))}
                  value={knowledgeBases.filter(kb => urlForm.knowledge_bases.includes(String(kb.id))).map(kb => ({ value: String(kb.id), label: kb.name }))}
                  onChange={selectedOptions => {
                    setUrlForm({
                      ...urlForm,
                      knowledge_bases: selectedOptions ? selectedOptions.map(opt => opt.value) : []
                    });
                  }}
                  classNamePrefix="react-select"
                  placeholder="Select knowledge bases..."
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderRadius: '4px',
                      borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                      boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                      minHeight: '32px',
                      fontSize: '0.9rem',
                      background: '#f9fafb',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? '#2563eb22'
                        : state.isFocused
                        ? '#eff6ff'
                        : '#fff',
                      color: state.isSelected ? '#1d4ed8' : '#222',
                      fontWeight: state.isSelected ? 600 : 400,
                      borderRadius: '4px',
                      margin: 0,
                      padding: '6px 10px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: '#dbeafe',
                      borderRadius: '4px',
                      color: '#1d4ed8',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: '#1d4ed8',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: '#1d4ed8',
                      ':hover': {
                        backgroundColor: '#1d4ed8',
                        color: 'white',
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: '6px',
                      boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                      zIndex: 9999,
                      maxHeight: 250,
                      overflowY: 'auto',
                      // Add custom-scrollbar class for modern scrollbar look
                      // Make sure .custom-scrollbar CSS is present in global styles
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#9ca3af',
                      fontSize: '0.9rem',
                    }),
                    input: (base) => ({
                      ...base,
                      color: '#222',
                      fontSize: '0.9rem',
                    }),
                  }}
                />
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              {urlFormError && <div className="text-red-500 text-xs">{urlFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setUrlModalOpen(false); setUrlForm({ url: '', description: '', knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default URLListTab;
