import React, { useState, useMemo, useEffect } from 'react';
import Select from 'react-select';
import { BASE_URL } from '../base_url';

const CategoriesTab = ({ categoriesList, handleEditCategory, handleDeleteCategory, handleCreateCategory, categoryModalOpen, setCategoryModalOpen, editingCategory, categoryForm, setCategoryForm, categoryFormError, handleCategoryFormSubmit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [selectedKBFilters, setSelectedKBFilters] = useState([]);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [showNameFilter, setShowNameFilter] = useState(false);
  const [selectedNameFilter, setSelectedNameFilter] = useState([]);
  const nameOptions = useMemo(() => Array.from(new Set(categoriesList.map(cat => cat.name))).map(name => ({ value: name, label: name })), [categoriesList]);

  // Fetch knowledge bases on mount and when modal/filter opens
  useEffect(() => {
    fetchKnowledgeBases();
  }, []);
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

  // Filter categories based on search term and KB filter
  const filteredCategories = useMemo(() => {
    let filtered = categoriesList;
    if (selectedNameFilter.length > 0) {
      filtered = filtered.filter(cat => selectedNameFilter.includes(cat.name));
    }
    if (showSearchBox && selectedKBFilters.length > 0) {
      filtered = filtered.filter(category =>
        category.knowledge_bases &&
        category.knowledge_bases.some(kb =>
          typeof kb === 'string'
            ? selectedKBFilters.includes(kb)
            : (kb.name && selectedKBFilters.includes(kb.name))
        )
      );
    } else if (searchTerm) {
    const term = searchTerm.toLowerCase();
      filtered = filtered.filter(category => {
      return category.name.toLowerCase().includes(term);
    });
    }
    return filtered;
  }, [categoriesList, searchTerm, selectedKBFilters, showSearchBox, selectedNameFilter]);

  const sortedCategories = useMemo(() => {
    let filtered = filteredCategories;
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = '';
        let bValue = '';
        switch (sortField) {
          case 'name':
            aValue = (a.name || '').toLowerCase();
            bValue = (b.name || '').toLowerCase();
            break;
          case 'knowledge_bases':
            aValue = a.knowledge_bases ? a.knowledge_bases.map(kb => typeof kb === 'string' ? kb : (kb.name || '')).join(', ').toLowerCase() : '';
            bValue = b.knowledge_bases ? b.knowledge_bases.map(kb => typeof kb === 'string' ? kb : (kb.name || '')).join(', ').toLowerCase() : '';
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
  }, [filteredCategories, sortField, sortDirection]);

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
  <div className="bg-white rounded-xl shadow-lg p-6 mt-4 w-full mx-auto">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">Categories List</h3>
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
        title="Add Category"
        aria-label="Add Category"
        onClick={handleCreateCategory}
      >
        +
      </button>
    </div>
    {/* Search Filter */}
    <div className="mb-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search categories by name..."
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
          Showing {filteredCategories.length} of {categoriesList.length} categories
        </p>
      )}
    </div>
    <div className="bg-white rounded-lg shadow p-4">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="relative px-3 py-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}>
              <div className="flex items-center space-x-1">
                <span>Name</span>
                {getSortIcon('name')}
                <button
                  type="button"
                  className="ml-1 focus:outline-none"
                  onClick={e => {e.stopPropagation(); setShowNameFilter(prev => !prev);}}
                  title="Filter Name"
                >
                  <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              {showNameFilter && (
                <div style={{ position: 'relative', zIndex: 9999 }}>
                  <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50" onClick={() => setShowNameFilter(false)} title="Close">✖</button>
                  <Select
                    isMulti
                    isSearchable
                    options={nameOptions}
                    value={selectedNameFilter.map(val => ({ value: val, label: val }))}
                    onChange={selected => setSelectedNameFilter(selected ? selected.map(s => s.value) : [])}
                    classNamePrefix="react-select"
                    placeholder="Filter Name..."
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
              className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors relative"
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
                    setShowSearchBox(prev => {
                      const next = !prev;
                      if (next) fetchKnowledgeBases();
                      return next;
                    });
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
                    />
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
            <th className="px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedCategories.length > 0 ? (
            sortedCategories.map((cat, idx) => (
              <tr key={cat.id} className="border-b">
                <td className="px-3 py-2 font-medium">{cat.name}</td>
                <td className="px-3 py-2">
                  {cat.knowledge_bases && cat.knowledge_bases.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {cat.knowledge_bases.map((kb, index) => (
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
                <td className="px-3 py-2 flex gap-2">
                  <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                    onClick={() => handleEditCategory(cat)}
                  >
                    Edit
                  </button>
                  <button 
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                    onClick={() => handleDeleteCategory(cat)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center py-4 text-gray-500">
                {searchTerm || selectedKBFilters.length > 0 ? 'No categories found matching your search.' : 'No categories available.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    {/* Category Modal */}
    {categoryModalOpen && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setCategoryModalOpen(false)}>
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-semibold mb-4">{editingCategory ? 'Edit Category' : 'Create New Category'}</h2>
          <form onSubmit={handleCategoryFormSubmit} className="space-y-3 text-sm">
            <div>
              <label className="block mb-1 font-medium">Category Name</label>
              <input
                type="text"
                required
                value={categoryForm.name}
                onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Knowledge Bases</label>
              <Select
                isMulti
                isSearchable
                options={knowledgeBases.map(kb => ({ value: String(kb.id), label: kb.name }))}
                value={knowledgeBases.filter(kb => categoryForm.knowledge_bases && categoryForm.knowledge_bases.includes(String(kb.id))).map(kb => ({ value: String(kb.id), label: kb.name }))}
                onChange={selectedOptions => {
                  setCategoryForm({
                    ...categoryForm,
                    knowledge_bases: selectedOptions ? selectedOptions.map(opt => opt.value) : []
                  });
                }}
                classNamePrefix="react-select"
                placeholder="Select knowledge bases..."
                styles={{ menu: base => ({ ...base, zIndex: 9999 }) }}
              />
              <span className="text-xs text-gray-500">You can search and select multiple. Searched/selected will show on top.</span>
            </div>
            {categoryFormError && <div className="text-red-500 text-xs">{categoryFormError}</div>}
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => { setCategoryModalOpen(false); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">{editingCategory ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
};

export default CategoriesTab;
