import React, { useState, useEffect, useMemo } from 'react';
import { FaTrash, FaPlus, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { BASE_URL } from '../base_url';
import Select from 'react-select';
// import Loader from './Loader'; // Added Loader import

const FolderListTab = ({ onBulkDelete }) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [relativePaths, setRelativePaths] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKBs, setSelectedKBs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [selectedKBFilters, setSelectedKBFilters] = useState([]);

  // Add filter popover state for each column
  const [showFolderNameFilter, setShowFolderNameFilter] = useState(false);
  const [selectedFolderNameFilter, setSelectedFolderNameFilter] = useState([]);
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [selectedDescriptionFilter, setSelectedDescriptionFilter] = useState([]);
  const [showAddedByFilter, setShowAddedByFilter] = useState(false);
  const [selectedAddedByFilter, setSelectedAddedByFilter] = useState([]);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState([]);

  // Add state for Knowledge Bases filter popover
  const [showKBFilter, setShowKBFilter] = useState(false);

  // Unique options for each filter
  const folderNameOptions = useMemo(() => {
    const names = Array.from(new Set(folders.map(f => f.title || f.folder_name || 'Unknown Folder')));
    return names.map(name => ({ value: name, label: name }));
  }, [folders]);
  const descriptionOptions = useMemo(() => {
    const descs = Array.from(new Set(folders.map(f => f.description || '-')));
    return descs.map(desc => ({ value: desc, label: desc }));
  }, [folders]);
  const addedByOptions = useMemo(() => {
    const users = Array.from(new Set(folders.map(f => f.added_by || '-')));
    return users.map(user => ({ value: user, label: user }));
  }, [folders]);
  const dateOptions = useMemo(() => {
    const dates = Array.from(new Set(folders.map(f => f.created_at ? new Date(f.created_at).toLocaleDateString() : '-')));
    return dates.map(date => ({ value: date, label: date }));
  }, [folders]);

  // Filter and sort folders based on search term and sort settings
  const filteredAndSortedFolders = useMemo(() => {
    let filtered = folders;

    // Folder Name filter (multi)
    if (selectedFolderNameFilter && selectedFolderNameFilter.length > 0) {
      filtered = filtered.filter(f => selectedFolderNameFilter.includes(f.title || f.folder_name || 'Unknown Folder'));
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
      filtered = filtered.filter(f => selectedDateFilter.includes(f.created_at ? new Date(f.created_at).toLocaleDateString() : '-'));
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(folder => {
        // Search in folder name, description, knowledge bases, and added by
        return (
          (folder.folder_name && folder.folder_name.toLowerCase().includes(term)) ||
          (folder.title && folder.title.toLowerCase().includes(term)) ||
          (folder.description && folder.description.toLowerCase().includes(term)) ||
          (folder.knowledge_bases_info && folder.knowledge_bases_info.some(kb => 
            kb.name && kb.name.toLowerCase().includes(term)
          )) ||
          (folder.added_by && folder.added_by.toLowerCase().includes(term))
        );
      });
    }
    
    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = '';
        let bValue = '';
        
        switch (sortField) {
          case 'folder_name':
            aValue = (a.title || a.folder_name || '').toLowerCase();
            bValue = (b.title || b.folder_name || '').toLowerCase();
            break;
          case 'description':
            aValue = (a.description || '').toLowerCase();
            bValue = (b.description || '').toLowerCase();
            break;
          case 'knowledge_bases':
            aValue = a.knowledge_bases_info ? a.knowledge_bases_info.map(kb => kb.name || '').join(', ').toLowerCase() : '';
            bValue = b.knowledge_bases_info ? b.knowledge_bases_info.map(kb => kb.name || '').join(', ').toLowerCase() : '';
            break;
          case 'added_by':
            aValue = (a.added_by || '').toLowerCase();
            bValue = (b.added_by || '').toLowerCase();
            break;
          case 'created_at':
            aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
            bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
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
    
    // Knowledge Bases filter (multi)
    if (selectedKBFilters && selectedKBFilters.length > 0) {
      filtered = filtered.filter(f =>
        f.knowledge_bases_info &&
        f.knowledge_bases_info.some(kb =>
          selectedKBFilters.includes(kb.name)
        )
      );
    }

    return filtered;
  }, [folders, searchTerm, sortField, sortDirection, selectedFolderNameFilter, selectedDescriptionFilter, selectedAddedByFilter, selectedDateFilter, selectedKBFilters]);

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

  // Fetch uploaded folders
  useEffect(() => {
    fetchFolders();
  }, []);

  // Fetch knowledge bases when modal opens
  useEffect(() => {
    if (showModal) {
      fetchKnowledgeBases();
    }
  }, [showModal]);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${BASE_URL}/api/folder-upload/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledgeBases = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${BASE_URL}/api/knowledgebase/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setKnowledgeBases(data);
      }
    } catch (err) {
      setKnowledgeBases([]);
    }
  };

  const handleFolderChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    if (files.length > 0) {
      // Extract folder name from first file's relative path
      const firstPath = files[0].webkitRelativePath || files[0].name;
      setFolderName(firstPath.split('/')[0]);
    }
    setRelativePaths(files.map(f => f.webkitRelativePath || f.name));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length) return;
    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file, idx) => {
      formData.append('files', file);
      formData.append('relative_paths', relativePaths[idx]);
    });
    formData.append('folder_name', folderName);
    formData.append('description', description);
    selectedKBs.forEach(kb => formData.append('knowledge_bases', kb));
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${BASE_URL}/api/folder-upload/`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        await fetchFolders();
        setShowModal(false);
        setSelectedFiles([]);
        setRelativePaths([]);
        setFolderName('');
        setDescription('');
        setSelectedKBs([]);
      } else {
        alert('Upload failed.');
      }
    } catch (err) {
      alert('Error uploading folder.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this folder?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/folder-upload/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        setFolders(folders.filter(f => f.id !== id));
      }
    } catch (err) {
      // handle error
    }
  };

  // Multi-select handlers
  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedItems(filteredAndSortedFolders.map(item => item.id));
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

    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} folder(s)? This action cannot be undone.`)) {
      try {
        if (onBulkDelete) {
          const result = await onBulkDelete(selectedItems);
          if (result.success) {
            setIsMultiSelectMode(false);
            setSelectedItems([]);
            alert(`Successfully deleted ${selectedItems.length} folder(s).`);
            fetchFolders(); // Refresh the folder list
          } else {
            alert(result.error || 'Failed to delete folders. Please try again.');
          }
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

  // Download Excel logic (same as FileListTab)
  const handleDownloadExcel = () => {
    const data = filteredAndSortedFolders.map(folder => ({
      'Folder Name': folder.title || folder.folder_name || '-',
      'Description': folder.description || '-',
      'Knowledge Bases': folder.knowledge_bases_info ? folder.knowledge_bases_info.map(kb => kb.name).join(', ') : '-',
      'Added By': folder.added_by || '-',
      'Upload Date': folder.created_at ? new Date(folder.created_at).toLocaleDateString() : '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Folders');
    XLSX.writeFile(workbook, 'uploaded_folders.xlsx');
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Uploaded Folders</h2>
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
              {/* Download Excel Button */}
              <button
                className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 shadow flex items-center justify-center"
                title="Download Excel"
                aria-label="Download Excel"
                onClick={handleDownloadExcel}
              >
                <FaDownload />
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow flex items-center justify-center"
                title="Upload Folder"
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
            placeholder="Search folders by name, description, knowledge base, or author..."
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
        {/* Row Count Display */}
        <div className="mt-2 text-sm text-gray-700">
          {filteredAndSortedFolders.length === folders.length
            ? `Total folders: ${folders.length}`
            : `Showing ${filteredAndSortedFolders.length} of ${folders.length} folders`}
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredAndSortedFolders.length} of {folders.length} folders
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-600 text-white ">
            <tr>
              {isMultiSelectMode && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={e => handleSelectAll(e.target.checked)}
                    checked={selectedItems.length === filteredAndSortedFolders.length && filteredAndSortedFolders.length > 0}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th 
                className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('folder_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Folder Name</span>
                  {getSortIcon('folder_name')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowDescriptionFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(false);
                      setShowFolderNameFilter(prev => !prev);
                    }}
                    title="Filter Folder Name"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showFolderNameFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white" style={{ padding: '2px', borderRadius: '50%' }} onClick={() => setShowFolderNameFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={folderNameOptions}
                      value={folderNameOptions.filter(opt => selectedFolderNameFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedFolderNameFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Folder Name..."
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
                      setShowFolderNameFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(false);
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
                      menuPosition="fixed"
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
                      setShowFolderNameFilter(false);
                      setShowDescriptionFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowKBFilter(prev => !prev);
                    }}
                    title="Filter Knowledge Bases"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showKBFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white" style={{ padding: '2px', borderRadius: '50%' }} onClick={() => setShowKBFilter(false)} title="Close">✖</button>
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
                      setShowFolderNameFilter(false);
                      setShowDescriptionFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(false);
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
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Uploaded Date</span>
                  {getSortIcon('created_at')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowFolderNameFilter(false);
                      setShowDescriptionFilter(false);
                      setShowAddedByFilter(false);
                      setShowSearchBox(false);
                      setShowDateFilter(prev => !prev);
                    }}
                    title="Filter Uploaded Date"
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
              {!isMultiSelectMode && (
                <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={isMultiSelectMode ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                <div className="flex items-center justify-center">
                  {/* <Loader /> */}
                </div>
              </td></tr>
            ) : filteredAndSortedFolders.length === 0 ? (
              <tr>
                <td colSpan={isMultiSelectMode ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm || selectedKBFilters.length > 0 ? 'No folders found matching your search.' : 'No folders uploaded yet.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedFolders.map(folder => (
                <tr key={folder.id} className="hover:bg-gray-50 transition-colors">
                  {isMultiSelectMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        onChange={e => handleItemSelect(folder.id, e.target.checked)}
                        className="rounded border-gray-300"
                        checked={selectedItems.includes(folder.id)}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-gray-900">{folder.title || folder.folder_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{folder.description || '-'}</td>
                  <td className="px-4 py-3">
                    {folder.knowledge_bases_info && folder.knowledge_bases_info.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {folder.knowledge_bases_info.map((kb, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {kb.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{folder.added_by || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{folder.created_at ? new Date(folder.created_at).toLocaleDateString() : '-'}</td>
                  {!isMultiSelectMode && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(folder.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        title="Delete folder"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-70">
          <form
            onSubmit={handleUpload}
            className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col gap-4"
            style={{ minWidth: 350 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Upload Folder</h2>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Folder <span className="text-red-500">*</span>
              </label>
            <input
              type="file"
              webkitdirectory="true"
              directory="true"
              multiple
                required
              onChange={handleFolderChange}
                className="block w-full text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1"
            />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter a description (optional)"
                className="block w-full text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Knowledge Base</label>
              <Select
                isMulti
                isSearchable
                options={knowledgeBases.map(kb => ({ value: String(kb.id), label: kb.name }))}
                value={knowledgeBases.filter(kb => selectedKBs.includes(String(kb.id))).map(kb => ({ value: String(kb.id), label: kb.name }))}
                onChange={selectedOptions => {
                  setSelectedKBs(selectedOptions ? selectedOptions.map(opt => opt.value) : []);
                }}
                classNamePrefix="react-select"
                placeholder="Select knowledge bases..."
                styles={{ menu: base => ({ ...base, zIndex: 9999 }) }}
              />
              <div className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                disabled={uploading}
              >
                Cancel
            </button>
              <button
                type="submit"
                disabled={uploading || !selectedFiles.length}
                className={`px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700 ${uploading || !selectedFiles.length ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? 'Uploading...' : 'Submit'}
              </button>
          </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FolderListTab;
