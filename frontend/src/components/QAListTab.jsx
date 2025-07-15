import React, { useState, useMemo } from 'react';
import Loader from './Loader';
import Select from 'react-select';
import { FaPlus } from 'react-icons/fa';


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
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [knowledgeBaseSearch, setKnowledgeBaseSearch] = useState('');
  const [selectedKBFilters, setSelectedKBFilters] = useState([]);

  // Add filter popover state for each column
  const [showQuestionFilter, setShowQuestionFilter] = useState(false);
  const [selectedQuestionFilter, setSelectedQuestionFilter] = useState([]);
  const [showAnswerFilter, setShowAnswerFilter] = useState(false);
  const [selectedAnswerFilter, setSelectedAnswerFilter] = useState([]);
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [selectedDescriptionFilter, setSelectedDescriptionFilter] = useState([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState([]);
  const [showSubcategoryFilter, setShowSubcategoryFilter] = useState(false);
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState([]);
  const [showAddedByFilter, setShowAddedByFilter] = useState(false);
  const [selectedAddedByFilter, setSelectedAddedByFilter] = useState([]);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState([]);

  // Add state for Knowledge Bases filter popover
  const [showKBFilter, setShowKBFilter] = useState(false);

  // Unique options for each filter
  const questionOptions = useMemo(() => {
    const questions = Array.from(new Set(qaData.map(q => q.question || 'Unknown Question')));
    return questions.map(q => ({ value: q, label: q }));
  }, [qaData]);
  const answerOptions = useMemo(() => {
    const answers = Array.from(new Set(qaData.map(q => q.answer || 'Unknown Answer')));
    return answers.map(a => ({ value: a, label: a }));
  }, [qaData]);
  const descriptionOptions = useMemo(() => {
    const descs = Array.from(new Set(qaData.map(q => q.description || '-')));
    return descs.map(desc => ({ value: desc, label: desc }));
  }, [qaData]);
  const categoryOptions = useMemo(() => {
    const cats = Array.from(new Set(qaData.flatMap(q => 
      q.category ? q.category.map(cat => typeof cat === 'string' ? cat : cat.name) : []
    )));
    return cats.map(cat => ({ value: cat, label: cat }));
  }, [qaData]);
  const subcategoryOptions = useMemo(() => {
    const subcats = Array.from(new Set(qaData.flatMap(q => 
      q.subcategory ? q.subcategory.map(subcat => typeof subcat === 'string' ? subcat : subcat.name) : []
    )));
    return subcats.map(subcat => ({ value: subcat, label: subcat }));
  }, [qaData]);
  const addedByOptions = useMemo(() => {
    const users = Array.from(new Set(qaData.map(q => q.added_by || '-')));
    return users.map(user => ({ value: user, label: user }));
  }, [qaData]);
  const dateOptions = useMemo(() => {
    const dates = Array.from(new Set(qaData.map(q => q.uploaded_at ? new Date(q.uploaded_at).toLocaleDateString() : '-')));
    return dates.map(date => ({ value: date, label: date }));
  }, [qaData]);

  // Filter and sort Q&A data based on search term and sort settings
  const filteredAndSortedQAData = useMemo(() => {
    let filtered = qaData;

    // Question filter (multi)
    if (selectedQuestionFilter && selectedQuestionFilter.length > 0) {
      filtered = filtered.filter(q => selectedQuestionFilter.includes(q.question || 'Unknown Question'));
    }
    // Answer filter (multi)
    if (selectedAnswerFilter && selectedAnswerFilter.length > 0) {
      filtered = filtered.filter(q => selectedAnswerFilter.includes(q.answer || 'Unknown Answer'));
    }
    // Description filter (multi)
    if (selectedDescriptionFilter && selectedDescriptionFilter.length > 0) {
      filtered = filtered.filter(q => selectedDescriptionFilter.includes(q.description || '-'));
    }
    // Category filter (multi)
    if (selectedCategoryFilter && selectedCategoryFilter.length > 0) {
      filtered = filtered.filter(q =>
        q.category && q.category.some(cat => selectedCategoryFilter.includes(typeof cat === 'string' ? cat : cat.name))
      );
    }
    // Subcategory filter (multi)
    if (selectedSubcategoryFilter && selectedSubcategoryFilter.length > 0) {
      filtered = filtered.filter(q =>
        q.subcategory && q.subcategory.some(subcat => selectedSubcategoryFilter.includes(typeof subcat === 'string' ? subcat : subcat.name))
      );
    }
    // Added By filter (multi)
    if (selectedAddedByFilter && selectedAddedByFilter.length > 0) {
      filtered = filtered.filter(q => selectedAddedByFilter.includes(q.added_by || '-'));
    }
    // Date filter (multi)
    if (selectedDateFilter && selectedDateFilter.length > 0) {
      filtered = filtered.filter(q => selectedDateFilter.includes(q.uploaded_at ? new Date(q.uploaded_at).toLocaleDateString() : '-'));
    }
    // Knowledge base filter (multi)
    if (showSearchBox && selectedKBFilters.length > 0) {
      filtered = filtered.filter(qa =>
        qa.knowledge_bases &&
        qa.knowledge_bases.some(kb =>
          typeof kb === 'string'
            ? selectedKBFilters.includes(kb)
            : (kb.name && selectedKBFilters.includes(kb.name))
        )
      );
    } else if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(qa => {
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
  }, [qaData, searchTerm, selectedKBFilters, showSearchBox, sortField, sortDirection, selectedQuestionFilter, selectedAnswerFilter, selectedDescriptionFilter, selectedCategoryFilter, selectedSubcategoryFilter, selectedAddedByFilter, selectedDateFilter]);

  const filteredAndSortedFiles = useMemo(() => {
    let filtered = qaData;

    // Knowledge base dropdown filter
    if (showSearchBox && knowledgeBaseSearch) {
      const term = knowledgeBaseSearch.toLowerCase();
      filtered = qaData.filter(qa =>
        qa.knowledge_bases && qa.knowledge_bases.some(kb =>
          typeof kb === 'string'
            ? kb.toLowerCase().includes(term)
            : (kb.name && kb.name.toLowerCase().includes(term))
        )
      );
    } else if (searchTerm) {
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
  }, [qaData, searchTerm, knowledgeBaseSearch, showSearchBox, sortField, sortDirection]);

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
                className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow flex items-center justify-center"
                title="Add Q&A"
                aria-label="Add Q&A"
                onClick={() => setQaModalOpen(true)}
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
          <thead className="bg-gray-600 text-white ">
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
              <th 
                className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('question')}
              >
                <div className="flex items-center space-x-1">
                  <span>Question</span>
                  {getSortIcon('question')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowAnswerFilter(false);
                      setShowDescriptionFilter(false);
                      setShowCategoryFilter(false);
                      setShowSubcategoryFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(false);
                      setShowQuestionFilter(prev => !prev);
                    }}
                    title="Filter Question"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showQuestionFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white" style={{ padding: '2px', borderRadius: '50%' }} onClick={() => setShowQuestionFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={questionOptions}
                      value={questionOptions.filter(opt => selectedQuestionFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedQuestionFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Question..."
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
                onClick={() => handleSort('answer')}
              >
                <div className="flex items-center space-x-1">
                  <span>Answer</span>
                  {getSortIcon('answer')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowQuestionFilter(false);
                      setShowDescriptionFilter(false);
                      setShowCategoryFilter(false);
                      setShowSubcategoryFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(false);
                      setShowAnswerFilter(prev => !prev);
                    }}
                    title="Filter Answer"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showAnswerFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowAnswerFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={answerOptions}
                      value={answerOptions.filter(opt => selectedAnswerFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedAnswerFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Answer..."
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
                      setShowQuestionFilter(false);
                      setShowAnswerFilter(false);
                      setShowCategoryFilter(false);
                      setShowSubcategoryFilter(false);
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
                className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center space-x-1">
                  <span>Category</span>
                  {getSortIcon('category')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowQuestionFilter(false);
                      setShowAnswerFilter(false);
                      setShowDescriptionFilter(false);
                      setShowSubcategoryFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(false);
                      setShowCategoryFilter(prev => !prev);
                    }}
                    title="Filter Category"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showCategoryFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowCategoryFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={categoryOptions}
                      value={categoryOptions.filter(opt => selectedCategoryFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedCategoryFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Category..."
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
                onClick={() => handleSort('subcategory')}
              >
                <div className="flex items-center space-x-1">
                  <span>Subcategory</span>
                  {getSortIcon('subcategory')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowQuestionFilter(false);
                      setShowAnswerFilter(false);
                      setShowDescriptionFilter(false);
                      setShowCategoryFilter(false);
                      setShowAddedByFilter(false);
                      setShowDateFilter(false);
                      setShowSearchBox(false);
                      setShowSubcategoryFilter(prev => !prev);
                    }}
                    title="Filter Subcategory"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showSubcategoryFilter && (
                  <div style={{ position: 'relative' }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowSubcategoryFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={subcategoryOptions}
                      value={subcategoryOptions.filter(opt => selectedSubcategoryFilter.includes(opt.value))}
                      onChange={selectedOptions => setSelectedSubcategoryFilter(selectedOptions ? selectedOptions.map(opt => opt.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Subcategory..."
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
                className="px-3 py-2 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors relative"
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
                      setShowQuestionFilter(false);
                      setShowAnswerFilter(false);
                      setShowDescriptionFilter(false);
                      setShowCategoryFilter(false);
                      setShowSubcategoryFilter(false);
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
                      setShowQuestionFilter(false);
                      setShowAnswerFilter(false);
                      setShowDescriptionFilter(false);
                      setShowCategoryFilter(false);
                      setShowSubcategoryFilter(false);
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
                className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px]"
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
                      setShowQuestionFilter(false);
                      setShowAnswerFilter(false);
                      setShowDescriptionFilter(false);
                      setShowCategoryFilter(false);
                      setShowSubcategoryFilter(false);
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
              <th className="px-4 py-3 text-left font-semibold text-white min-w-[110px]">Actions</th>
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
                  <td className="px-4 py-3 min-w-[120px]">{qa.uploaded_at ? new Date(qa.uploaded_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 min-w-[110px]">
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
                <Select
                  isMulti
                  isSearchable
                  options={knowledgeBases.map(kb => ({ value: String(kb.id), label: kb.name }))}
                  value={knowledgeBases.filter(kb => qaForm.knowledge_bases.includes(String(kb.id))).map(kb => ({ value: String(kb.id), label: kb.name }))}
                  onChange={selectedOptions => {
                    setQaForm({
                      ...qaForm,
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
                <Select
                  isMulti
                  isSearchable
                  options={knowledgeBases.map(kb => ({ value: String(kb.id), label: kb.name }))}
                  value={knowledgeBases.filter(kb => qaForm.knowledge_bases.includes(String(kb.id))).map(kb => ({ value: String(kb.id), label: kb.name }))}
                  onChange={selectedOptions => {
                    setQaForm({
                      ...qaForm,
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
