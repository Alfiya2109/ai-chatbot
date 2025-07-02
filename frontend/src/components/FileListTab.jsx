import React, { useState, useMemo } from 'react';
import Loader from './Loader';

const FileListTab = ({ uploadedFiles, renderTable, fileModalOpen, setFileModalOpen, fileForm, setFileForm, knowledgeBases, fileFormError, handleFileModalSubmit, fetchKnowledgeBases, onBulkDelete, isLoading }) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter and sort files based on search term and sort settings
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = uploadedFiles;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = uploadedFiles.filter(file => {
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
  }, [uploadedFiles, searchTerm, sortField, sortDirection]);

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
                className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow"
                title="Add File"
                aria-label="Add File"
                onClick={() => { fetchKnowledgeBases && fetchKnowledgeBases(); setFileModalOpen(true); }}
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
            placeholder="Search files by name, description, knowledge base, or author..."
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
            Showing {filteredAndSortedFiles.length} of {uploadedFiles.length} files
          </p>
        )}
      </div>

      {/* Files Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
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
                className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('file')}
              >
                <div className="flex items-center space-x-1">
                  <span>File Name</span>
                  {getSortIcon('file')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center space-x-1">
                  <span>Description</span>
                  {getSortIcon('description')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('knowledge_bases')}
              >
                <div className="flex items-center space-x-1">
                  <span>Knowledge Bases</span>
                  {getSortIcon('knowledge_bases')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('added_by')}
              >
                <div className="flex items-center space-x-1">
                  <span>Added By</span>
                  {getSortIcon('added_by')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('uploaded_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Upload Date</span>
                  {getSortIcon('uploaded_at')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setFileModalOpen(false)}>
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
                <select
                  multiple
                  value={fileForm.knowledge_bases}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setFileForm({ ...fileForm, knowledge_bases: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
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
