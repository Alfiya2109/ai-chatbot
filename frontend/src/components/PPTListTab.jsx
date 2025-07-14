import React, { useState, useMemo } from 'react';
import Loader from './Loader';
import Select from 'react-select';

const PPTListTab = ({ uploadedPPTs, renderTable, pptModalOpen, setPptModalOpen, pptForm, setPptForm, knowledgeBases, pptFormError, handlePptModalSubmit, fetchKnowledgeBases, onBulkDelete, isLoading }) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [knowledgeBaseSearch, setKnowledgeBaseSearch] = useState('');
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [selectedKBFilters, setSelectedKBFilters] = useState([]);

  // Add filter popover state for each column
  const [showFileNameFilter, setShowFileNameFilter] = useState(false);
  const [selectedFileNameFilter, setSelectedFileNameFilter] = useState(null);
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [selectedDescriptionFilter, setSelectedDescriptionFilter] = useState(null);
  const [showAddedByFilter, setShowAddedByFilter] = useState(false);
  const [selectedAddedByFilter, setSelectedAddedByFilter] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);

  // Unique options for each filter
  const fileNameOptions = useMemo(() => {
    const names = Array.from(new Set(uploadedPPTs.map(f => f.file ? f.file.split('/').pop() : 'Unknown File')));
    return names.map(name => ({ value: name, label: name }));
  }, [uploadedPPTs]);
  const descriptionOptions = useMemo(() => {
    const descs = Array.from(new Set(uploadedPPTs.map(f => f.description || '-')));
    return descs.map(desc => ({ value: desc, label: desc }));
  }, [uploadedPPTs]);
  const addedByOptions = useMemo(() => {
    const users = Array.from(new Set(uploadedPPTs.map(f => f.added_by || '-')));
    return users.map(user => ({ value: user, label: user }));
  }, [uploadedPPTs]);
  const dateOptions = useMemo(() => {
    const dates = Array.from(new Set(uploadedPPTs.map(f => f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : '-')));
    return dates.map(date => ({ value: date, label: date }));
  }, [uploadedPPTs]);

  // Filter and sort PPTs based on search term and sort settings
  const filteredAndSortedPPTs = useMemo(() => {
    let filtered = uploadedPPTs;

    // File Name filter
    if (selectedFileNameFilter) {
      filtered = filtered.filter(f => (f.file ? f.file.split('/').pop() : 'Unknown File') === selectedFileNameFilter);
    }
    // Description filter
    if (selectedDescriptionFilter) {
      filtered = filtered.filter(f => (f.description || '-') === selectedDescriptionFilter);
    }
    // Added By filter
    if (selectedAddedByFilter) {
      filtered = filtered.filter(f => (f.added_by || '-') === selectedAddedByFilter);
    }
    // Date filter
    if (selectedDateFilter) {
      filtered = filtered.filter(f => (f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : '-') === selectedDateFilter);
    }

    // Knowledge base dropdown filter
    if (showSearchBox && selectedKBFilters.length > 0) {
      filtered = uploadedPPTs.filter(ppt =>
        ppt.knowledge_bases &&
        ppt.knowledge_bases.some(kb =>
          typeof kb === 'string'
            ? selectedKBFilters.includes(kb)
            : (kb.name && selectedKBFilters.includes(kb.name))
        )
      );
    } else if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = uploadedPPTs.filter(ppt => (
        (ppt.file && ppt.file.toLowerCase().includes(term)) ||
        (ppt.description && ppt.description.toLowerCase().includes(term)) ||
        (ppt.knowledge_bases && ppt.knowledge_bases.some(kb => typeof kb === 'string' ? kb.toLowerCase().includes(term) : (kb.name && kb.name.toLowerCase().includes(term)))) ||
        (ppt.added_by && ppt.added_by.toLowerCase().includes(term))
      ));
    }
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = '', bValue = '';
        switch (sortField) {
          case 'file':
            aValue = (a.file || '').toLowerCase();
            bValue = (b.file || '').toLowerCase();
            break;
          case 'description':
            aValue = (a.description || '').toLowerCase();
            bValue = (b.description || '').toLowerCase();
            break;
          case 'knowledge_bases':
            aValue = a.knowledge_bases ? a.knowledge_bases.map(kb => typeof kb === 'string' ? kb : (kb.name || '')).join(', ').toLowerCase() : '';
            bValue = b.knowledge_bases ? b.knowledge_bases.map(kb => typeof kb === 'string' ? kb : (kb.name || '')).join(', ').toLowerCase() : '';
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
  }, [uploadedPPTs, searchTerm, selectedKBFilters, showSearchBox, sortField, sortDirection, selectedFileNameFilter, selectedDescriptionFilter, selectedAddedByFilter, selectedDateFilter]);

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
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedItems(filteredAndSortedPPTs.map(item => item.id));
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
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} PPT file(s)? This action cannot be undone.`)) {
      try {
        const result = await onBulkDelete(selectedItems);
        if (result.success) {
          setIsMultiSelectMode(false);
          setSelectedItems([]);
          alert(`Successfully deleted ${selectedItems.length} PPT file(s).`);
        } else {
          alert(result.error || 'Failed to delete PPT files. Please try again.');
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
    <div className="mt-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-800">Uploaded PPT Files</h3>
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
                title="Add PPT File"
                aria-label="Add PPT File"
                onClick={() => { fetchKnowledgeBases && fetchKnowledgeBases(); setPptModalOpen(true); }}
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
            placeholder="Search PPT files by name, description, knowledge base, or author..."
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
            Showing {filteredAndSortedPPTs.length} of {uploadedPPTs.length} PPT files
          </p>
        )}
      </div>
      {/* PPT Files Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {isMultiSelectMode && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={selectedItems.length === filteredAndSortedPPTs.length && filteredAndSortedPPTs.length > 0}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th 
                className="relative px-3 py-2 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('file')}
              >
                <div className="flex items-center space-x-1">
                  <span>PPT File Name</span>
                  {getSortIcon('file')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowDescriptionFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(false);
                      setShowFileNameFilter(prev => !prev);
                    }}
                    title="Filter File Name"
                  >
                    <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showFileNameFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50" onClick={() => setShowFileNameFilter(false)} title="Close">✖</button>
                    <Select
                      isSearchable
                      options={fileNameOptions}
                      value={selectedFileNameFilter ? [{ value: selectedFileNameFilter, label: selectedFileNameFilter }] : []}
                      onChange={selectedOption => setSelectedFileNameFilter(selectedOption ? selectedOption.value : null)}
                      classNamePrefix="react-select"
                      placeholder="Filter File Name..."
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
                className="relative px-3 py-2 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
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
                      setShowFileNameFilter(false);
                      setShowSearchBox(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
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
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50" onClick={() => setShowDescriptionFilter(false)} title="Close">✖</button>
                    <Select
                      isSearchable
                      options={descriptionOptions}
                      value={selectedDescriptionFilter ? [{ value: selectedDescriptionFilter, label: selectedDescriptionFilter }] : []}
                      onChange={selectedOption => setSelectedDescriptionFilter(selectedOption ? selectedOption.value : null)}
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
                      fetchKnowledgeBases && fetchKnowledgeBases();
                      setShowSearchBox(prev => !prev);
                    }}
                    title="Search Knowledge Base"
                  >
                    <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showSearchBox && (
                  <div className="absolute z-40 left-1/2 -translate-x-1/2 top-full mt-2 w-80 min-w-[260px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col p-4 animate-fadeIn" style={{ minWidth: '260px', boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)' }} onClick={e => e.stopPropagation()}>
                    {knowledgeBases && knowledgeBases.length > 0 ? (
                      <Select
                        isMulti
                        isSearchable
                        options={knowledgeBases.map(kb => ({ value: String(kb.id), label: kb.name }))}
                        value={knowledgeBases.filter(kb => selectedKBFilters.includes(kb.name)).map(kb => ({ value: String(kb.id), label: kb.name }))}
                        onChange={selectedOptions => {
                          setSelectedKBFilters(selectedOptions ? selectedOptions.map(opt => opt.label) : []);
                        }}
                        classNamePrefix="react-select"
                        placeholder="Search Knowledge Base..."
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
                        autoFocus
                      />
                    ) : (
                      <div className="text-gray-400 text-base px-3 py-4 text-center select-none">No knowledge bases found.</div>
                      )}
                      <button
                        type="button"
                      className="mt-2 text-gray-400 hover:text-gray-600 self-end"
                        onClick={() => setShowSearchBox(false)}
                        title="Close"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                  </div>
                )}
              </th>
              <th 
                className="relative px-3 py-2 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
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
                      setShowFileNameFilter(false);
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
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50" onClick={() => setShowAddedByFilter(false)} title="Close">✖</button>
                    <Select
                      isSearchable
                      options={addedByOptions}
                      value={selectedAddedByFilter ? [{ value: selectedAddedByFilter, label: selectedAddedByFilter }] : []}
                      onChange={selectedOption => setSelectedAddedByFilter(selectedOption ? selectedOption.value : null)}
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
                className="relative px-3 py-2 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('uploaded_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Upload Date</span>
                  {getSortIcon('uploaded_at')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowFileNameFilter(false);
                      setShowDescriptionFilter(false);
                      setShowAddedByFilter(false);
                      setShowSearchBox(false);
                      setShowDateFilter(prev => !prev);
                    }}
                    title="Filter Upload Date"
                  >
                    <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showDateFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50" onClick={() => setShowDateFilter(false)} title="Close">✖</button>
                    <Select
                      isSearchable
                      options={dateOptions}
                      value={selectedDateFilter ? [{ value: selectedDateFilter, label: selectedDateFilter }] : []}
                      onChange={selectedOption => setSelectedDateFilter(selectedOption ? selectedOption.value : null)}
                      classNamePrefix="react-select"
                      placeholder="Filter Upload Date..."
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
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={isMultiSelectMode ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <Loader />
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedPPTs.length === 0 ? (
              <tr>
                <td colSpan={isMultiSelectMode ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'No PPT files found matching your search.' : 'No PPT files uploaded yet.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedPPTs.map((ppt) => (
                <tr key={ppt.id} className="hover:bg-gray-50 transition-colors">
                  {isMultiSelectMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(ppt.id)}
                        onChange={(e) => handleItemSelect(ppt.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">
                      {ppt.file ? ppt.file.split('/').pop() : 'Unknown File'}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-gray-700">
                      {ppt.description || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {ppt.knowledge_bases && ppt.knowledge_bases.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ppt.knowledge_bases.map((kb, index) => (
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
                  <td className="px-3 py-2">
                    <div className="text-gray-700">
                      {ppt.added_by || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-gray-700">
                      {ppt.uploaded_at ? new Date(ppt.uploaded_at).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-2">
                      {ppt.file && (
                        <a
                          href={ppt.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </a>
                      )}
                      <button
                        onClick={() => onBulkDelete([ppt.id])}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        title="Delete PPT file"
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
      {/* PPT Upload Modal */}
      {pptModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPptModalOpen(false)}>
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-60">
              <Loader />
            </div>
          )}
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Upload PPT File</h2>
            <form onSubmit={handlePptModalSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">PPT File <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  required
                  onChange={e => setPptForm({ ...pptForm, file: e.target.files[0] })}
                  className="w-full p-2 border rounded"
                  accept=".ppt,.pptx"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={pptForm.description}
                  onChange={e => setPptForm({ ...pptForm, description: e.target.value })}
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
                  value={knowledgeBases.filter(kb => pptForm.knowledge_bases.includes(String(kb.id))).map(kb => ({ value: String(kb.id), label: kb.name }))}
                  onChange={selectedOptions => {
                    setPptForm({
                      ...pptForm,
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
              {pptFormError && <div className="text-red-500 text-xs">{pptFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setPptModalOpen(false); setPptForm({ file: null, description: '', knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PPTListTab;
