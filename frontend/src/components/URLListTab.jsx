import React, { useState, useMemo } from 'react';
import Loader from './Loader';

const URLListTab = ({ urlList, renderTable, urlModalOpen, setUrlModalOpen, urlForm, setUrlForm, knowledgeBases, urlFormError, handleUrlModalSubmit, onBulkDelete, isLoading }) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter URLs based on search term
  const filteredURLs = useMemo(() => {
    if (!searchTerm) return urlList;
    
    const term = searchTerm.toLowerCase();
    return urlList.filter(url => {
      // Search in URL, description, knowledge bases, and added by
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
  }, [urlList, searchTerm]);

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

      {renderTable(filteredURLs, 'url', {
        isMultiSelectMode,
        selectedItems,
        onSelectAll: handleSelectAll,
        onItemSelect: handleItemSelect
      })}
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
                <select
                  multiple
                  value={urlForm.knowledge_bases}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setUrlForm({ ...urlForm, knowledge_bases: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
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
