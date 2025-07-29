  import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaTrash, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import {BASE_URL} from '../base_url';
import Select from 'react-select';

const GOOGLE_CLIENT_ID = '601820931949-4u7o7k6gvd5its0cmegmgd2pgk8dc0oe.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDHWkEDkqzwrm-VS23Vo_8m8AMDRwOyTTk';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.csv'];
let googleGISClient;

function openGoogleDrivePicker(accessToken, pickerCallback) {
  if (!window.google || !window.google.picker || !accessToken) {
    alert('Google Picker API or access token missing');
    return;
  }
  const view = new window.google.picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(true);
  const picker = new window.google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(accessToken)
    .setDeveloperKey(GOOGLE_API_KEY)
    .setCallback(pickerCallback)
    .build();
  picker.setVisible(true);
}

function isSupportedFile(fileName) {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

async function listAllFilesRecursively(folderId, accessToken, parentPath = '') {
  let allFiles = [];
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,parents)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  if (!data.files) return allFiles;
  for (const file of data.files) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      const subFiles = await listAllFilesRecursively(file.id, accessToken, parentPath + file.name + '/');
      allFiles = allFiles.concat(subFiles);
    } else if (isSupportedFile(file.name)) {
      allFiles.push({ ...file, relativePath: parentPath + file.name });
    }
  }
  return allFiles;
}

const GoogleDrive = () => {
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKBs, setSelectedKBs] = useState([]);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [driveFiles, setDriveFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [selectedKBFilters, setSelectedKBFilters] = useState([]);
  // 1. Add filter popover state for each column
  const [showFolderNameFilter, setShowFolderNameFilter] = useState(false);
  const [selectedFolderNameFilter, setSelectedFolderNameFilter] = useState([]);
  const [showPathFilter, setShowPathFilter] = useState(false);
  const [selectedPathFilter, setSelectedPathFilter] = useState([]);
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [selectedDescriptionFilter, setSelectedDescriptionFilter] = useState([]);
  const [showKBFilter, setShowKBFilter] = useState(false);
  const [selectedKBFilter, setSelectedKBFilter] = useState([]);
  const [showAddedByFilter, setShowAddedByFilter] = useState(false);
  const [selectedAddedByFilter, setSelectedAddedByFilter] = useState([]);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState([]);

  // 2. Unique options for each filter
  const folderNameOptions = useMemo(() => {
    const names = Array.from(new Set(driveFiles.map(f => f.folder_name || f.file_name || 'Unknown Folder')));
    return names.map(name => ({ value: name, label: name }));
  }, [driveFiles]);
  const pathOptions = useMemo(() => {
    const paths = Array.from(new Set(driveFiles.map(f => f.relative_path || '-')));
    return paths.map(path => ({ value: path, label: path }));
  }, [driveFiles]);
  const descriptionOptions = useMemo(() => {
    const descs = Array.from(new Set(driveFiles.map(f => f.description || '-')));
    return descs.map(desc => ({ value: desc, label: desc }));
  }, [driveFiles]);
  const kbOptions = useMemo(() => {
    const kbs = Array.from(new Set(driveFiles.flatMap(f => (f.knowledge_bases || []).map(kb => typeof kb === 'string' ? kb : (kb.name || '')))));
    return kbs.map(kb => ({ value: kb, label: kb }));
  }, [driveFiles]);
  const addedByOptions = useMemo(() => {
    const users = Array.from(new Set(driveFiles.map(f => f.added_by || '-')));
    return users.map(user => ({ value: user, label: user }));
  }, [driveFiles]);
  const dateOptions = useMemo(() => {
    const dates = Array.from(new Set(driveFiles.map(f => f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : '-')));
    return dates.map(date => ({ value: date, label: date }));
  }, [driveFiles]);

  // Filter drive files based on search term and KB filter
  const filteredDriveFiles = useMemo(() => {
    let filtered = driveFiles;
    // Folder Name filter (multi)
    if (selectedFolderNameFilter.length > 0) {
      filtered = filtered.filter(f => selectedFolderNameFilter.includes(f.folder_name || f.file_name || 'Unknown Folder'));
    }
    // Path filter (multi)
    if (selectedPathFilter.length > 0) {
      filtered = filtered.filter(f => selectedPathFilter.includes(f.relative_path || '-'));
    }
    // Description filter (multi)
    if (selectedDescriptionFilter.length > 0) {
      filtered = filtered.filter(f => selectedDescriptionFilter.includes(f.description || '-'));
    }
    // Knowledge Base filter (multi)
    if (selectedKBFilter.length > 0) {
      filtered = filtered.filter(f =>
        f.knowledge_bases && f.knowledge_bases.some(kb =>
          selectedKBFilter.includes(typeof kb === 'string' ? kb : (kb.name || ''))
        )
      );
    }
    // Added By filter (multi)
    if (selectedAddedByFilter.length > 0) {
      filtered = filtered.filter(f => selectedAddedByFilter.includes(f.added_by || '-'));
    }
    // Date filter (multi)
    if (selectedDateFilter.length > 0) {
      filtered = filtered.filter(f => selectedDateFilter.includes(f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : '-'));
    }
    // Search term (fallback)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(file => {
        return (
          (file.folder_name && file.folder_name.toLowerCase().includes(term)) ||
          (file.file_name && file.file_name.toLowerCase().includes(term)) ||
          (file.relative_path && file.relative_path.toLowerCase().includes(term)) ||
          (file.description && file.description.toLowerCase().includes(term)) ||
          (file.knowledge_bases && file.knowledge_bases.some(kb =>
            typeof kb === 'string' ? kb.toLowerCase().includes(term) : (kb.name && kb.name.toLowerCase().includes(term))
          )) ||
          (file.added_by && file.added_by.toLowerCase().includes(term))
        );
      });
    }
    return filtered;
  }, [driveFiles, searchTerm, selectedFolderNameFilter, selectedPathFilter, selectedDescriptionFilter, selectedKBFilter, selectedAddedByFilter, selectedDateFilter]);

  const sortedDriveFiles = useMemo(() => {
    let filtered = filteredDriveFiles;
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = '';
        let bValue = '';
        switch (sortField) {
          case 'folder_name':
            aValue = (a.folder_name || a.file_name || '').toLowerCase();
            bValue = (b.folder_name || b.file_name || '').toLowerCase();
            break;
          case 'relative_path':
            aValue = (a.relative_path || '').toLowerCase();
            bValue = (b.relative_path || '').toLowerCase();
            break;
          case 'description':
            aValue = (a.description || '').toLowerCase();
            bValue = (b.description || '').toLowerCase();
            break;
          case 'knowledge_bases':
            aValue = a.knowledge_bases ? a.knowledge_bases.map(kb => typeof kb === 'string' ? kb : '').join(', ').toLowerCase() : '';
            bValue = b.knowledge_bases ? b.knowledge_bases.map(kb => typeof kb === 'string' ? kb : '').join(', ').toLowerCase() : '';
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
  }, [filteredDriveFiles, sortField, sortDirection]);

  useEffect(() => {
    fetchDriveFiles();
  }, []);

  useEffect(() => {
    if (showModal) fetchKnowledgeBases();
  }, [showModal]);

  const fetchDriveFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/google-drive-files/`);
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data);
      }
    } catch (err) {
      setDriveFiles([]);
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

  // Picker callback for both files and folders
  const pickerCallback = async (data) => {
    if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
      const picked = data[window.google.picker.Response.DOCUMENTS][0];
      const accessToken = window.latestGoogleAccessToken || localStorage.getItem('google_access_token') || '';
      if (!accessToken) {
        alert('No Google access token found. Please re-authenticate.');
        return;
      }
      setUploading(true);
      let filesToUpload = [];
      let folder = '';
      if (picked.mimeType === 'application/vnd.google-apps.folder') {
        folder = picked.name;
        filesToUpload = await listAllFilesRecursively(picked.id, accessToken, picked.name + '/');
      } else if (isSupportedFile(picked.name)) {
        folder = '';
        filesToUpload = [{ ...picked, relativePath: picked.name }];
      } else {
        alert('Selected file type is not supported.');
        setUploading(false);
        return;
      }
      if (filesToUpload.length === 0) {
        alert('No supported files found in the selected folder.');
        setUploading(false);
        return;
      }
      setSelectedFiles(filesToUpload);
      setFolderName(folder || (filesToUpload[0] && filesToUpload[0].name) || '');
      setShowModal(true);
      setUploading(false);
    }
  };

  useEffect(() => {
    const loadGoogleApis = async () => {
      try {
        if (!window.gapi) {
          await new Promise((resolve, reject) => {
            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.async = true;
            gapiScript.onload = resolve;
            gapiScript.onerror = reject;
            document.body.appendChild(gapiScript);
          });
        }
        await new Promise((resolve, reject) => {
          window.gapi.load('picker', {
            callback: resolve,
            onerror: reject
          });
        });
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.defer = true;
        document.body.appendChild(gisScript);
        await new Promise((resolve, reject) => {
          gisScript.onload = resolve;
          gisScript.onerror = reject;
        });
        googleGISClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          prompt: '',
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              window.latestGoogleAccessToken = tokenResponse.access_token;
              localStorage.setItem('google_access_token', tokenResponse.access_token);
              openGoogleDrivePicker(tokenResponse.access_token, pickerCallback);
            } else {
              alert('Failed to connect to Google Drive. Please try again.');
            }
          },
        });
        setIsGoogleApiLoaded(true);
      } catch (error) {
        alert('Failed to load Google APIs.');
      }
    };
    loadGoogleApis();
    return () => {
      const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (gisScript) gisScript.remove();
    };
  }, []);

  const handleGoogleDriveClick = () => {
    if (!isGoogleApiLoaded) {
      alert('Google APIs are still loading. Please wait.');
      return;
    }
    if (googleGISClient) {
      googleGISClient.requestAccessToken();
    } else {
      alert('Google Identity Services client is not initialized.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length) return;
    setUploading(true);
    const filesMeta = selectedFiles.map(file => ({
      file_id: file.id,
      file_name: file.name,
      mime_type: file.mimeType,
      relative_path: file.relativePath || file.name,
      folder_name: folderName,
      description,
      knowledge_bases: selectedKBs, // <-- use IDs
    }));
    // Make sure you have accessToken in your component state
    const payload = {
      files: filesMeta,
      folder_name: folderName,
      description,
      knowledge_bases: selectedKBs, // <-- use IDs
      access_token: window.latestGoogleAccessToken || localStorage.getItem('google_access_token') || '', // <-- Add this line
    };

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${BASE_URL}/api/chatbot/google-drive/upload-folder/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        setSelectedFiles([]);
        setFolderName('');
        setDescription('');
        setSelectedKBs([]);
        fetchDriveFiles();
        alert('Upload complete!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert('Failed to store Google Drive files in backend.' + (errorData.error ? `\n${errorData.error}` : ''));
      }
    } catch (err) {
      alert('Failed to store Google Drive files in backend.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/google-drive-files/${fileId}/`, { method: 'DELETE' });
      if (res.ok) {
        setDriveFiles(driveFiles.filter(f => f.id !== fileId));
        // Clear search if the last filtered item is deleted
        const remainingFilteredFiles = filteredDriveFiles.filter(f => f.id !== fileId);
        if (remainingFilteredFiles.length === 0 && searchTerm) {
          setSearchTerm('');
        }
      }
    } catch (err) {
      // handle error
    }
  };

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
        <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  // Download Excel logic (same as FileListTab)
  const handleDownloadExcel = () => {
    const data = filteredDriveFiles.map(file => ({
      'Folder Name': file.folder_name || file.file_name || '-',
      'Path': file.relative_path || '-',
      'Description': file.description || '-',
      'Knowledge Bases': file.knowledge_bases ? file.knowledge_bases.map(kb => typeof kb === 'string' ? kb : kb.name).join(', ') : '-',
      'Added By': file.added_by || '-',
      'Upload Date': file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GoogleDriveFiles');
    XLSX.writeFile(workbook, 'google_drive_files.xlsx');
  };

  return (
    <div className="mt-6 w-full">
      {/* Sticky Top Bar - same as FolderListTab and FileListTab */}
      <div
        className="top-0 z-40 shadow-md rounded-b-lg px-6 py-4 flex items-center justify-between mt-6 backdrop-blur-md"
        style={{
          minHeight: 80,
          WebkitBackdropFilter: "blur(8px)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e5e7eb"
        }}
      >
        <h2 className="text-2xl font-bold text-gray-800">Uploaded Google Drive Folders/Files</h2>
        <div className="flex items-center gap-5 flex-wrap">
          <button
            className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 shadow flex items-center justify-center"
            title="Download Excel"
            aria-label="Download Excel"
            onClick={handleDownloadExcel}
          >
            <FaDownload />
          </button>
          <button
            onClick={handleGoogleDriveClick}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow flex items-center justify-center"
            title="Upload from Google Drive"
            disabled={uploading}
          >
            <FaPlus />
          </button>
        </div>
      </div>
      {/* Add more gap below top bar */}
      <div className="mt-4 mb-5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Google Drive files by name, path, description, knowledge base, or author..."
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
          {filteredDriveFiles.length === driveFiles.length
            ? `Total Google Drive files: ${driveFiles.length}`
            : `Showing ${filteredDriveFiles.length} of ${driveFiles.length} Google Drive files`}
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredDriveFiles.length} of {driveFiles.length} Google Drive files
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-600 text-white">
            <tr>
              <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('folder_name')}>
                <div className="flex items-center space-x-1">
                  <span>Folder Name</span>
                  {getSortIcon('folder_name')}
                  <button type="button" className="ml-1 focus:outline-none" onClick={e => {e.stopPropagation(); setShowPathFilter(false); setShowDescriptionFilter(false); setShowKBFilter(false); setShowAddedByFilter(false); setShowDateFilter(false); setShowFolderNameFilter(prev => !prev);}} title="Filter Folder Name">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
                {showFolderNameFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                      style={{ padding: '2px', borderRadius: '50%' }}
                      onClick={() => setShowFolderNameFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={folderNameOptions}
                      value={selectedFolderNameFilter.map(val => ({ value: val, label: val }))}
                      onChange={opts => setSelectedFolderNameFilter(opts ? opts.map(o => o.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Folder Name..."
                      styles={{
                        control: (base, state) => ({...base, borderRadius: '12px', borderColor: state.isFocused ? '#2563eb' : '#e5e7eb', boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)', minHeight: '44px', fontSize: '1rem', background: '#f9fafb', transition: 'border-color 0.2s, box-shadow 0.2s',}),
                        option: (base, state) => ({...base, backgroundColor: state.isSelected ? '#2563eb22' : state.isFocused ? '#eff6ff' : '#fff', color: state.isSelected ? '#1d4ed8' : '#222', fontWeight: state.isSelected ? 600 : 400, borderRadius: '8px', margin: '2px 4px', padding: '10px 16px', cursor: 'pointer',}),
                        multiValue: (base) => ({...base, backgroundColor: '#dbeafe', borderRadius: '8px', color: '#1d4ed8', fontWeight: 500,}),
                        multiValueLabel: (base) => ({...base, color: '#1d4ed8', fontWeight: 500,}),
                        multiValueRemove: (base) => ({...base, color: '#1d4ed8', ':hover': {backgroundColor: '#1d4ed8', color: 'white',},}),
                        menu: (base) => ({...base, borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)', zIndex: 9999,}),
                        placeholder: (base) => ({...base, color: '#9ca3af',}),
                        input: (base) => ({...base, color: '#222',}),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('relative_path')}>
                <div className="flex items-center space-x-1">
                  <span>Path</span>
                  {getSortIcon('relative_path')}
                  <button type="button" className="ml-1 focus:outline-none" onClick={e => {e.stopPropagation(); setShowFolderNameFilter(false); setShowDescriptionFilter(false); setShowKBFilter(false); setShowAddedByFilter(false); setShowDateFilter(false); setShowPathFilter(prev => !prev);}} title="Filter Path">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
                {showPathFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                      style={{ padding: '2px', borderRadius: '50%' }}
                      onClick={() => setShowPathFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={pathOptions}
                      value={selectedPathFilter.map(val => ({ value: val, label: val }))}
                      onChange={opts => setSelectedPathFilter(opts ? opts.map(o => o.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Path..."
                      styles={{
                        control: (base, state) => ({...base, borderRadius: '12px', borderColor: state.isFocused ? '#2563eb' : '#e5e7eb', boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)', minHeight: '44px', fontSize: '1rem', background: '#f9fafb', transition: 'border-color 0.2s, box-shadow 0.2s',}),
                        option: (base, state) => ({...base, backgroundColor: state.isSelected ? '#2563eb22' : state.isFocused ? '#eff6ff' : '#fff', color: state.isSelected ? '#1d4ed8' : '#222', fontWeight: state.isSelected ? 600 : 400, borderRadius: '8px', margin: '2px 4px', padding: '10px 16px', cursor: 'pointer',}),
                        multiValue: (base) => ({...base, backgroundColor: '#dbeafe', borderRadius: '8px', color: '#1d4ed8', fontWeight: 500,}),
                        multiValueLabel: (base) => ({...base, color: '#1d4ed8', fontWeight: 500,}),
                        multiValueRemove: (base) => ({...base, color: '#1d4ed8', ':hover': {backgroundColor: '#1d4ed8', color: 'white',},}),
                        menu: (base) => ({...base, borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)', zIndex: 9999,}),
                        placeholder: (base) => ({...base, color: '#9ca3af',}),
                        input: (base) => ({...base, color: '#222',}),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('description')}>
                <div className="flex items-center space-x-1">
                  <span>Description</span>
                  {getSortIcon('description')}
                  <button type="button" className="ml-1 focus:outline-none" onClick={e => {e.stopPropagation(); setShowFolderNameFilter(false); setShowPathFilter(false); setShowKBFilter(false); setShowAddedByFilter(false); setShowDateFilter(false); setShowDescriptionFilter(prev => !prev);}} title="Filter Description">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
                {showDescriptionFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                      style={{ padding: '2px', borderRadius: '50%' }}
                      onClick={() => setShowDescriptionFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={descriptionOptions}
                      value={selectedDescriptionFilter.map(val => ({ value: val, label: val }))}
                      onChange={opts => setSelectedDescriptionFilter(opts ? opts.map(o => o.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Description..."
                      styles={{
                        control: (base, state) => ({...base, borderRadius: '12px', borderColor: state.isFocused ? '#2563eb' : '#e5e7eb', boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)', minHeight: '44px', fontSize: '1rem', background: '#f9fafb', transition: 'border-color 0.2s, box-shadow 0.2s',}),
                        option: (base, state) => ({...base, backgroundColor: state.isSelected ? '#2563eb22' : state.isFocused ? '#eff6ff' : '#fff', color: state.isSelected ? '#1d4ed8' : '#222', fontWeight: state.isSelected ? 600 : 400, borderRadius: '8px', margin: '2px 4px', padding: '10px 16px', cursor: 'pointer',}),
                        multiValue: (base) => ({...base, backgroundColor: '#dbeafe', borderRadius: '8px', color: '#1d4ed8', fontWeight: 500,}),
                        multiValueLabel: (base) => ({...base, color: '#1d4ed8', fontWeight: 500,}),
                        multiValueRemove: (base) => ({...base, color: '#1d4ed8', ':hover': {backgroundColor: '#1d4ed8', color: 'white',},}),
                        menu: (base) => ({...base, borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)', zIndex: 9999,}),
                        placeholder: (base) => ({...base, color: '#9ca3af',}),
                        input: (base) => ({...base, color: '#222',}),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('knowledge_bases')}>
                <div className="flex items-center space-x-1">
                  <span>Knowledge Bases</span>
                  {getSortIcon('knowledge_bases')}
                  <button type="button" className="ml-1 focus:outline-none" onClick={e => {e.stopPropagation(); setShowFolderNameFilter(false); setShowPathFilter(false); setShowDescriptionFilter(false); setShowAddedByFilter(false); setShowDateFilter(false); setShowKBFilter(prev => !prev);}} title="Filter Knowledge Base">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
                {showKBFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                      style={{ padding: '2px', borderRadius: '50%' }}
                      onClick={() => setShowKBFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={kbOptions}
                      value={selectedKBFilter.map(val => ({ value: val, label: val }))}
                      onChange={opts => setSelectedKBFilter(opts ? opts.map(o => o.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Knowledge Base..."
                      styles={{
                        control: (base, state) => ({...base, borderRadius: '12px', borderColor: state.isFocused ? '#2563eb' : '#e5e7eb', boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)', minHeight: '44px', fontSize: '1rem', background: '#f9fafb', transition: 'border-color 0.2s, box-shadow 0.2s',}),
                        option: (base, state) => ({...base, backgroundColor: state.isSelected ? '#2563eb22' : state.isFocused ? '#eff6ff' : '#fff', color: state.isSelected ? '#1d4ed8' : '#222', fontWeight: state.isSelected ? 600 : 400, borderRadius: '8px', margin: '2px 4px', padding: '10px 16px', cursor: 'pointer',}),
                        multiValue: (base) => ({...base, backgroundColor: '#dbeafe', borderRadius: '8px', color: '#1d4ed8', fontWeight: 500,}),
                        multiValueLabel: (base) => ({...base, color: '#1d4ed8', fontWeight: 500,}),
                        multiValueRemove: (base) => ({...base, color: '#1d4ed8', ':hover': {backgroundColor: '#1d4ed8', color: 'white',},}),
                        menu: (base) => ({...base, borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)', zIndex: 9999,}),
                        placeholder: (base) => ({...base, color: '#9ca3af',}),
                        input: (base) => ({...base, color: '#222',}),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('added_by')}>
                <div className="flex items-center space-x-1">
                  <span>Added By</span>
                  {getSortIcon('added_by')}
                  <button type="button" className="ml-1 focus:outline-none" onClick={e => {e.stopPropagation(); setShowFolderNameFilter(false); setShowPathFilter(false); setShowDescriptionFilter(false); setShowKBFilter(false); setShowDateFilter(false); setShowAddedByFilter(prev => !prev);}} title="Filter Added By">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
                {showAddedByFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                      style={{ padding: '2px', borderRadius: '50%' }}
                      onClick={() => setShowAddedByFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={addedByOptions}
                      value={selectedAddedByFilter.map(val => ({ value: val, label: val }))}
                      onChange={opts => setSelectedAddedByFilter(opts ? opts.map(o => o.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Added By..."
                      styles={{
                        control: (base, state) => ({...base, borderRadius: '12px', borderColor: state.isFocused ? '#2563eb' : '#e5e7eb', boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)', minHeight: '44px', fontSize: '1rem', background: '#f9fafb', transition: 'border-color 0.2s, box-shadow 0.2s',}),
                        option: (base, state) => ({...base, backgroundColor: state.isSelected ? '#2563eb22' : state.isFocused ? '#eff6ff' : '#fff', color: state.isSelected ? '#1d4ed8' : '#222', fontWeight: state.isSelected ? 600 : 400, borderRadius: '8px', margin: '2px 4px', padding: '10px 16px', cursor: 'pointer',}),
                        multiValue: (base) => ({...base, backgroundColor: '#dbeafe', borderRadius: '8px', color: '#1d4ed8', fontWeight: 500,}),
                        multiValueLabel: (base) => ({...base, color: '#1d4ed8', fontWeight: 500,}),
                        multiValueRemove: (base) => ({...base, color: '#1d4ed8', ':hover': {backgroundColor: '#1d4ed8', color: 'white',},}),
                        menu: (base) => ({...base, borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)', zIndex: 9999,}),
                        placeholder: (base) => ({...base, color: '#9ca3af',}),
                        input: (base) => ({...base, color: '#222',}),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('uploaded_at')}>
                <div className="flex items-center space-x-1">
                  <span>Uploaded Date</span>
                  {getSortIcon('uploaded_at')}
                  <button type="button" className="ml-1 focus:outline-none" onClick={e => {e.stopPropagation(); setShowFolderNameFilter(false); setShowPathFilter(false); setShowDescriptionFilter(false); setShowKBFilter(false); setShowAddedByFilter(false); setShowDateFilter(prev => !prev);}} title="Filter Uploaded Date">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
                {showDateFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                      style={{ padding: '2px', borderRadius: '50%' }}
                      onClick={() => setShowDateFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={dateOptions}
                      value={selectedDateFilter.map(val => ({ value: val, label: val }))}
                      onChange={opts => setSelectedDateFilter(opts ? opts.map(o => o.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Uploaded Date..."
                      styles={{
                        control: (base, state) => ({...base, borderRadius: '12px', borderColor: state.isFocused ? '#2563eb' : '#e5e7eb', boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)', minHeight: '44px', fontSize: '1rem', background: '#f9fafb', transition: 'border-color 0.2s, box-shadow 0.2s',}),
                        option: (base, state) => ({...base, backgroundColor: state.isSelected ? '#2563eb22' : state.isFocused ? '#eff6ff' : '#fff', color: state.isSelected ? '#1d4ed8' : '#222', fontWeight: state.isSelected ? 600 : 400, borderRadius: '8px', margin: '2px 4px', padding: '10px 16px', cursor: 'pointer',}),
                        multiValue: (base) => ({...base, backgroundColor: '#dbeafe', borderRadius: '8px', color: '#1d4ed8', fontWeight: 500,}),
                        multiValueLabel: (base) => ({...base, color: '#1d4ed8', fontWeight: 500,}),
                        multiValueRemove: (base) => ({...base, color: '#1d4ed8', ':hover': {backgroundColor: '#1d4ed8', color: 'white',},}),
                        menu: (base) => ({...base, borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)', zIndex: 9999,}),
                        placeholder: (base) => ({...base, color: '#9ca3af',}),
                        input: (base) => ({...base, color: '#222',}),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : sortedDriveFiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'No Google Drive files found matching your search.' : 'No Google Drive files uploaded yet.'}
                </td>
              </tr>
            ) : (
              sortedDriveFiles.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{item.folder_name || item.file_name}</td>
                  <td className="px-4 py-3">{item.relative_path || '-'}</td>
                  <td className="px-4 py-3">{item.description || '-'}</td>
                  <td className="px-4 py-3">
                    {item.knowledge_bases && item.knowledge_bases.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.knowledge_bases.map((kb, kbIdx) => (
                          <span
                            key={kbIdx}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                          >
                            {kb}
                          </span>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3">{item.added_by || '-'}</td>
                  <td className="px-4 py-3">{item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <a href={`https://drive.google.com/file/d/${item.file_id}/view`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">View</a>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800 ml-2 font-semibold underline"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-70">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col gap-4"
            style={{ minWidth: 350 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Upload Folder</h2>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Folder <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={folderName}
                  readOnly
                  className="block w-full text-sm text-gray-700 border border-gray-300 rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
                />
                <span className="text-xs text-gray-500">{selectedFiles.length ? `${selectedFiles.length} file(s) selected` : 'No file chosen'}</span>
              </div>
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
              <div className="text-xs text-gray-500 mt-1">You can search and select multiple. Searched/selected will show on top.</div>
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

export default GoogleDrive;

