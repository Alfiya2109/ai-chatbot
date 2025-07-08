import React, { useState, useMemo } from 'react';
import Loader from './Loader';


const QAListTab = ({
  qaData,
  qaModalOpen,
  setQaModalOpen,
  qaForm,
  setQaForm,
  categories,
  subCategories,
  knowledgeBases,
  qaFormError,
  handleQaModalSubmit,
  onBulkDelete,
  qaEditModalOpen,
  setQaEditModalOpen,
  editingQa,
  handleQaEditSubmit,
  isLoading // <-- add this
}) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter and sort Q&A data based on search term and sort settings
  const filteredAndSortedQAData = useMemo(() => {
    let filtered = qaData;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = qaData.filter(qa => {
        return (
          (qa.question && qa.question.toLowerCase().includes(term)) ||
          (qa.answer && qa.answer.toLowerCase().includes(term)) ||
          (qa.description && qa.description.toLowerCase().includes(term)) ||
          (qa.category && qa.category.some(cat => typeof cat === 'string' ? cat.toLowerCase().includes(term) : (cat.name && cat.name.toLowerCase().includes(term)))) ||
          (qa.subcategory && qa.subcategory.some(subcat => typeof subcat === 'string' ? subcat.toLowerCase().includes(term) : (subcat.name && subcat.name.toLowerCase().includes(term)))) ||
          (qa.knowledge_bases && qa.knowledge_bases.some(kb => typeof kb === 'string' ? kb.toLowerCase().includes(term) : (kb.name && kb.name.toLowerCase().includes(term)))) ||
          (qa.added_by && qa.added_by.toLowerCase().includes(term))
        );
      });
    }
    // Sorting logic
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = '';
        let bValue = '';
        switch (sortField) {
          case 'question':
            aValue = (a.question || '').toLowerCase();
            bValue = (b.question || '').toLowerCase();
            break;
          case 'answer':
            aValue = (a.answer || '').toLowerCase();
            bValue = (b.answer || '').toLowerCase();
            break;
          case 'description':
            aValue = (a.description || '').toLowerCase();
            bValue = (b.description || '').toLowerCase();
            break;
          case 'category':
            aValue = a.category ? a.category.map(cat => typeof cat === 'string' ? cat : (cat.name || '')).join(', ').toLowerCase() : '';
            bValue = b.category ? b.category.map(cat => typeof cat === 'string' ? cat : (cat.name || '')).join(', ').toLowerCase() : '';
            break;
          case 'subcategory':
            aValue = a.subcategory ? a.subcategory.map(subcat => typeof subcat === 'string' ? subcat : (subcat.name || '')).join(', ').toLowerCase() : '';
            bValue = b.subcategory ? b.subcategory.map(subcat => typeof subcat === 'string' ? subcat : (subcat.name || '')).join(', ').toLowerCase() : '';
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
  }, [qaData, searchTerm, sortField, sortDirection]);

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedItems(filteredAndSortedQAData.map(item => item.id));
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

    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} Q&A item(s)? This action cannot be undone.`)) {
      try {
        const result = await onBulkDelete(selectedItems);
        if (result.success) {
          setIsMultiSelectMode(false);
          setSelectedItems([]);
          alert(`Successfully deleted ${selectedItems.length} Q&A item(s).`);
        } else {
          alert(result.error || 'Failed to delete Q&A items. Please try again.');
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

  return (
    <div className="mt-6 w-11/12">
      {/* Loader overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-white bg-opacity-60">
          <Loader />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold mb-4">Q&A Data</h3>
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
                title="Add Q&A"
                aria-label="Add Q&A"
                onClick={() => setQaModalOpen(true)}
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
            placeholder="Search Q&A by question, answer, description, category, subcategory, knowledge base, or author..."
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
            Showing {filteredAndSortedQAData.length} of {qaData.length} Q&A items
          </p>
        )}
      </div>

      {/* Replace renderTable with a custom table for Q&A */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {isMultiSelectMode && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={e => handleSelectAll(e.target.checked)}
                    checked={selectedItems.length === filteredAndSortedQAData.length && filteredAndSortedQAData.length > 0}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('question')}>
                <div className="flex items-center space-x-1">
                  <span>Question</span>
                  {getSortIcon('question')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('answer')}>
                <div className="flex items-center space-x-1">
                  <span>Answer</span>
                  {getSortIcon('answer')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('description')}>
                <div className="flex items-center space-x-1">
                  <span>Description</span>
                  {getSortIcon('description')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('category')}>
                <div className="flex items-center space-x-1">
                  <span>Category</span>
                  {getSortIcon('category')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('subcategory')}>
                <div className="flex items-center space-x-1">
                  <span>Subcategory</span>
                  {getSortIcon('subcategory')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('knowledge_bases')}>
                <div className="flex items-center space-x-1">
                  <span>Knowledge Bases</span>
                  {getSortIcon('knowledge_bases')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('added_by')}>
                <div className="flex items-center space-x-1">
                  <span>Added By</span>
                  {getSortIcon('added_by')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('uploaded_at')}>
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
                <td colSpan={isMultiSelectMode ? 10 : 9} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <Loader />
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedQAData.length === 0 ? (
              <tr>
                <td colSpan={isMultiSelectMode ? 10 : 9} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'No Q&A found matching your search.' : 'No Q&A uploaded yet.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedQAData.map((qa) => (
                <tr key={qa.id} className="hover:bg-gray-50 transition-colors">
                  {isMultiSelectMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(qa.id)}
                        onChange={e => handleItemSelect(qa.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 max-w-xs truncate" title={qa.question}>{qa.question || '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={qa.answer}>{qa.answer || '-'}</td>
                  <td className="px-4 py-3">{qa.description || '-'}</td>
                  <td className="px-4 py-3">
                    {qa.category && qa.category.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {qa.category.map((cat, idx) => (
                          <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {typeof cat === 'string' ? cat : cat.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {qa.subcategory && qa.subcategory.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {qa.subcategory.map((subcat, idx) => (
                          <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {typeof subcat === 'string' ? subcat : subcat.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {qa.knowledge_bases && qa.knowledge_bases.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {qa.knowledge_bases.map((kb, idx) => (
                          <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {typeof kb === 'string' ? kb : kb.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{qa.added_by || '-'}</td>
                  <td className="px-4 py-3">{qa.uploaded_at ? new Date(qa.uploaded_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    {/* You can add Edit/Delete buttons here if needed */}
                    <button
                      onClick={() => editingQa && editingQa(qa)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onBulkDelete && onBulkDelete([qa.id])}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      title="Delete Q&A"
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
      
      {/* Q&A Upload Modal */}
      {qaModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setQaModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Upload Q&A</h2>
            <form onSubmit={handleQaModalSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">Question <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={qaForm.question}
                  onChange={e => setQaForm({ ...qaForm, question: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter the question..."
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Answer <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={qaForm.answer}
                  onChange={e => setQaForm({ ...qaForm, answer: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter the answer..."
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={qaForm.description}
                  onChange={e => setQaForm({ ...qaForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter a description (optional)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Category</label>
                <select
                  multiple
                  value={qaForm.category}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setQaForm({ ...qaForm, category: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Subcategory</label>
                <select
                  multiple
                  value={qaForm.subcategory}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setQaForm({ ...qaForm, subcategory: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {subCategories.map((sub) => (
                    <option key={sub.id} value={String(sub.id)}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                <select
                  multiple
                  value={qaForm.knowledge_bases}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setQaForm({ ...qaForm, knowledge_bases: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              {qaFormError && <div className="text-red-500 text-xs">{qaFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setQaModalOpen(false); setQaForm({ question: '', answer: '', description: '', category: [], subcategory: [], knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Q&A Edit Modal */}
      {qaEditModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setQaEditModalOpen(false)}>
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Edit Q&A</h2>
            <form onSubmit={handleQaEditSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">Question <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={qaForm.question}
                  onChange={e => setQaForm({ ...qaForm, question: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="3"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Answer <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={qaForm.answer}
                  onChange={e => setQaForm({ ...qaForm, answer: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="3"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={qaForm.description}
                  onChange={e => setQaForm({ ...qaForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="2"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Category</label>
                <select
                  multiple
                  value={qaForm.category}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setQaForm({ ...qaForm, category: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              <div>
                <label className="block mb-1 font-medium">Subcategory</label>
                <select
                  multiple
                  value={qaForm.subcategory}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setQaForm({ ...qaForm, subcategory: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {subCategories.map((subcat) => (
                    <option key={subcat.id} value={String(subcat.id)}>{subcat.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base <span className="text-red-500">*</span></label>
                <select
                  multiple
                  required
                  value={qaForm.knowledge_bases}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setQaForm({ ...qaForm, knowledge_bases: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              {qaFormError && <div className="text-red-500 text-xs">{qaFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setQaEditModalOpen(false); setQaForm({ question: '', answer: '', description: '', category: [], subcategory: [], knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-700">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAListTab;
