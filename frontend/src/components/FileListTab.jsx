import React, { useState, useMemo, useEffect } from 'react';
import Loader from './Loader';
import Select from 'react-select';
import { BASE_URL } from '../base_url';
import { FaPlus } from 'react-icons/fa';

const FileListTab = ({ uploadedFiles, renderTable, fileModalOpen, setFileModalOpen, fileForm, setFileForm, fileFormError, handleFileModalSubmit, onBulkDelete, isLoading }) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [knowledgeBaseSearch, setKnowledgeBaseSearch] = useState('');

  // Add filter popover state for each column
  const [showFileFilter, setShowFileFilter] = useState(false);
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [showAddedByFilter, setShowAddedByFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  // Change single value filter states to arrays
  const [selectedFileFilter, setSelectedFileFilter] = useState([]);
  const [selectedDescriptionFilter, setSelectedDescriptionFilter] = useState([]);
  const [selectedAddedByFilter, setSelectedAddedByFilter] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState([]);
  const [selectedKnowledgeBaseFilter, setSelectedKnowledgeBaseFilter] = useState([]);

  // Unique options for each filter
  const fileNameOptions = useMemo(() => {
    const names = Array.from(new Set(uploadedFiles.map(f => f.file ? f.file.split('/').pop() : 'Unknown File')));
    return names.map(name => ({ value: name, label: name }));
  }, [uploadedFiles]);
  const descriptionOptions = useMemo(() => {
    const descs = Array.from(new Set(uploadedFiles.map(f => f.description || '-')));
    return descs.map(desc => ({ value: desc, label: desc }));
  }, [uploadedFiles]);
  const addedByOptions = useMemo(() => {
    const users = Array.from(new Set(uploadedFiles.map(f => f.added_by || '-')));
    return users.map(user => ({ value: user, label: user }));
  }, [uploadedFiles]);
  const dateOptions = useMemo(() => {
    const dates = Array.from(new Set(uploadedFiles.map(f => f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : '-')));
    return dates.map(date => ({ value: date, label: date }));
  }, [uploadedFiles]);

  const knowledgeBaseOptions = useMemo(() => {
    const allKBs = [];
    uploadedFiles.forEach(file => {
      if (file.knowledge_bases && Array.isArray(file.knowledge_bases)) {
        file.knowledge_bases.forEach(kb => {
          if (typeof kb === 'object' && kb !== null && kb.name) {
            allKBs.push(kb.name);
          } else if (typeof kb === 'string') {
            allKBs.push(kb);
          }
        });
      }
    });
    return Array.from(new Set(allKBs)).map(name => ({ value: name, label: name }));
  }, [uploadedFiles]);

  // Add local knowledgeBases state for modal
  const [knowledgeBases, setKnowledgeBases] = useState([]);

  // Fetch knowledge bases for modal
  const fetchKnowledgeBases = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Fetching KBs...');
      const res = await fetch(`${BASE_URL}/api/knowledgebase/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      console.log('Fetch response:', res);
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched KBs data:', data);
        setKnowledgeBases(data);
      } else {
        console.log('Fetch not ok:', res.status);
        setKnowledgeBases([]);
      }
    } catch (err) {
      console.log('Fetch error:', err);
      setKnowledgeBases([]);
    }
  };

  // On modal open, fetch knowledge bases
  useEffect(() => {
    if (fileModalOpen) {
      fetchKnowledgeBases();
    }
  }, [fileModalOpen]);

  // Filter and sort files based on search term and sort settings
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = uploadedFiles;

    // File Name filter (multi)
    if (selectedFileFilter && selectedFileFilter.length > 0) {
      filtered = filtered.filter(f => selectedFileFilter.includes(f.file ? f.file.split('/').pop() : 'Unknown File'));
    }
    // Description filter (multi)
    if (selectedDescriptionFilter && selectedDescriptionFilter.length > 0) {
      filtered = filtered.filter(f => selectedDescriptionFilter.includes(f.description || '-'));
    }
    // Added By filter (multi)
    if (selectedAddedByFilter && selectedAddedByFilter.length > 0) {
      filtered = filtered.filter(f => selectedAddedByFilter.includes(f.added_by || '-'));
    }
    // Date filter (multi)
    if (selectedDateFilter && selectedDateFilter.length > 0) {
      filtered = filtered.filter(f => selectedDateFilter.includes(f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : '-'));
    }

    // Knowledge base dropdown filter
    if (showSearchBox && knowledgeBaseSearch) {
      const term = knowledgeBaseSearch.toLowerCase();
      filtered = filtered.filter(file =>
        file.knowledge_bases && file.knowledge_bases.some(kb =>
          typeof kb === 'string'
            ? kb.toLowerCase().includes(term)
            : (kb.name && kb.name.toLowerCase().includes(term))
        )
      );
    } else if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(file => {
        // Search in file name, description, knowledge bases, and added by
        return (
          (file.file && file.file.toLowerCase().includes(term)) ||
          (file.description && file.description.toLowerCase().includes(term)) ||
          (file.knowledge_bases && file.knowledge_bases.some(kb => 
            typeof kb === 'string' ? kb.toLowerCase().includes(term) : 
            (kb.name && kb.name.toLowerCase().includes(term))
          )) ||
          (file.added_by && file.added_by.toLowerCase().includes(term))
        );
      });
    }

    if (selectedKnowledgeBaseFilter.length > 0) {
      filtered = filtered.filter(file =>
        file.knowledge_bases &&
        file.knowledge_bases.some(kb =>
          typeof kb === 'object'
            ? selectedKnowledgeBaseFilter.includes(kb.name)
            : selectedKnowledgeBaseFilter.includes(kb)
        )
      );
    }
    
    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = '';
        let bValue = '';
        
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
  }, [uploadedFiles, searchTerm, knowledgeBaseSearch, showSearchBox, sortField, sortDirection, selectedFileFilter, selectedDescriptionFilter, selectedAddedByFilter, selectedDateFilter, selectedKnowledgeBaseFilter]);

  const filteredKnowledgeBases = useMemo(() => {
    let allKBs = [];
    filteredAndSortedFiles.forEach(file => {
      if (file.knowledge_bases && Array.isArray(file.knowledge_bases)) {
        file.knowledge_bases.forEach(kb => {
          if (typeof kb === 'object' && kb !== null && kb.id && kb.name) {
            allKBs.push({ id: String(kb.id), name: kb.name });
          } else if (typeof kb === 'string') {
            allKBs.push({ id: kb, name: kb });
          }
        });

      }
    });
    // Unique by id+name
    const unique = [];
    const map = {};
    allKBs.forEach(kb => {
      const key = kb.id + '|' + kb.name;
      if (!map[key]) {
        map[key] = true;
        unique.push(kb);
      }
    });
    return unique;
  }, [filteredAndSortedFiles]);

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
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedItems(filteredAndSortedFiles.map(item => item.id));
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

    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} file(s)? This action cannot be undone.`)) {
      try {
        const result = await onBulkDelete(selectedItems);
        if (result.success) {
          setIsMultiSelectMode(false);
          setSelectedItems([]);
          alert(`Successfully deleted ${selectedItems.length} file(s).`);
        } else {
          alert(result.error || 'Failed to delete files. Please try again.');
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
        <h3 className="text-2xl font-bold text-gray-800">Uploaded Files</h3>
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
                className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow flex items-center justify-center"
                title="Add File"
                aria-label="Add File"
                onClick={() => { fetchKnowledgeBases && fetchKnowledgeBases(); setFileModalOpen(true); }}
              >
                <FaPlus />
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
            placeholder="Search files by name, description, knowledge base, or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-5 h-5 text-gray-500" style={{ color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredAndSortedFiles.length} of {uploadedFiles.length} files
          </p>
        )}
        {/* Knowledge Base Filter Dropdown */}
        {/* This filter is now moved into the Knowledge Bases column filter popover */}
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-600 text-white ">
            <tr>
              {isMultiSelectMode && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={selectedItems.length === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th 
                className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('file')}
              >
                <div className="flex items-center space-x-1">
                  <span>File Name</span>
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
                      setShowFileFilter(prev => !prev);
                    }}
                    title="Filter File Name"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showFileFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white" style={{ padding: '2px', borderRadius: '50%' }} onClick={() => setShowFileFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={fileNameOptions}
                      value={fileNameOptions.filter(opt => selectedFileFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedFileFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
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
                className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors"
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
                      setShowFileFilter(false);
                      setShowSearchBox(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowDescriptionFilter(prev => !prev);
                    }}
                    title="Filter Description"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showDescriptionFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white" style={{ padding: '2px', borderRadius: '50%' }} onClick={() => setShowDescriptionFilter(false)} title="Close">✖</button>
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
                      // menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th 
                className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors"
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
                      setShowFileFilter(false);
                      setShowDescriptionFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(prev => !prev);
                    }}
                    title="Search Knowledge Base"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showSearchBox && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white" style={{ padding: '2px', borderRadius: '50%' }} onClick={() => setShowSearchBox(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={knowledgeBaseOptions}
                      value={knowledgeBaseOptions.filter(opt => selectedKnowledgeBaseFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedKnowledgeBaseFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
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
                className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors"
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
                      setShowFileFilter(false);
                      setShowDescriptionFilter(false);
                      setShowSearchBox(false);
                      setShowDateFilter(false);
                      setShowAddedByFilter(prev => !prev);
                    }}
                    title="Filter Added By"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showAddedByFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white" style={{ padding: '2px', borderRadius: '50%' }} onClick={() => setShowAddedByFilter(false)} title="Close">✖</button>
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
                className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors"
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
                      setShowFileFilter(false);
                      setShowDescriptionFilter(false);
                      setShowAddedByFilter(false);
                      setShowSearchBox(false);
                      setShowDateFilter(prev => !prev);
                    }}
                    title="Filter Upload Date"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showDateFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white" style={{ padding: '2px', borderRadius: '50%' }} onClick={() => setShowDateFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={dateOptions}
                      value={dateOptions.filter(opt => selectedDateFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedDateFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
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
              <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors">Actions</th>
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
            ) : filteredAndSortedFiles.length === 0 ? (
              <tr>
                <td colSpan={isMultiSelectMode ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'No files found matching your search.' : 'No files uploaded yet.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                  {isMultiSelectMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(file.id)}
                        onChange={(e) => handleItemSelect(file.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {file.file ? file.file.split('/').pop() : 'Unknown File'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">
                      {file.description || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {file.knowledge_bases && file.knowledge_bases.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {file.knowledge_bases.map((kb, index) => (
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
                      {file.added_by || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">
                      {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {file.file && (
                        <a
                          href={file.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </a>
                      )}
                      <button
                        onClick={() => onBulkDelete([file.id])}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        title="Delete file"
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
      {/* File Upload Modal */}
      {fileModalOpen && (
        <div key={knowledgeBases.length} className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setFileModalOpen(false)}>
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-60">
              <Loader />
            </div>
          )}
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Upload File</h2>
            <form onSubmit={handleFileModalSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">File <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  required
                  onChange={e => setFileForm({ ...fileForm, file: e.target.files[0] })}
                  className="w-full p-2 border rounded"
                  accept=".pdf,.doc,.docx,.txt"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={fileForm.description}
                  onChange={e => setFileForm({ ...fileForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter a description (optional)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                {console.log(knowledgeBases)}
                {knowledgeBases.length === 0 ? (
                  <div className="flex justify-center items-center py-4 text-gray-500">
                    No knowledge bases found.
                  </div>
                ) : (
                  <Select
                    key={knowledgeBases.length}
                    isMulti
                    isSearchable
                    options={knowledgeBases.map(kb => ({ value: String(kb.id), label: kb.name }))}
                    value={knowledgeBases.filter(kb => fileForm.knowledge_bases.includes(String(kb.id))).map(kb => ({ value: String(kb.id), label: kb.name }))}
                    onChange={selectedOptions => {
                      setFileForm({
                        ...fileForm,
                        knowledge_bases: selectedOptions ? selectedOptions.map(opt => String(opt.value)) : []
                      });
                    }}
                    classNamePrefix="react-select"
                    placeholder="Select knowledge bases..."
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
                    // menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
                <span className="text-xs text-gray-500">You can search and select multiple. Searched/selected will show on top.</span>
              </div>
              {fileFormError && <div className="text-red-500 text-xs">{fileFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setFileModalOpen(false); setFileForm({ file: null, description: '', knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileListTab;

