import React, { useState, useMemo, useEffect } from 'react';
import Select from 'react-select';
import { BASE_URL } from '../base_url';
import { FaPlus, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const CategoriesTab = ({ categoriesList, handleEditCategory, handleDeleteCategory, handleCreateCategory, categoryModalOpen, setCategoryModalOpen, editingCategory, categoryForm, setCategoryForm, categoryFormError, handleCategoryFormSubmit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  // Removed Knowledge Base filter states
  const [showNameFilter, setShowNameFilter] = useState(false);
  const [selectedNameFilter, setSelectedNameFilter] = useState([]);
  const nameOptions = useMemo(() => Array.from(new Set(categoriesList.map(cat => cat.name))).map(name => ({ value: name, label: name })), [categoriesList]);

  // Removed Knowledge Base fetch logic

  // Update filteredCategories to apply multi-select filter before search
  const filteredCategories = useMemo(() => {
    let filtered = categoriesList;
    // Multi-select Name filter
    if (selectedNameFilter.length > 0) {
      filtered = filtered.filter(cat => selectedNameFilter.includes(cat.name));
    }
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(category => category.name.toLowerCase().includes(term));
    }
    return filtered;
  }, [categoriesList, searchTerm, selectedNameFilter]);

  const sortedCategories = useMemo(() => {
    let filtered = filteredCategories;
    if (sortField === 'name') {
      filtered = [...filtered].sort((a, b) => {
        let aValue = (a.name || '').toLowerCase();
        let bValue = (b.name || '').toLowerCase();
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

  // Download Excel logic (without Knowledge Base column)
  const handleDownloadExcel = () => {
    const data = filteredCategories.map(cat => ({
      'Category Name': cat.name || '-',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');
    XLSX.writeFile(workbook, 'categories.xlsx');
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
        <h3 className="text-2xl font-bold text-gray-800">Categories List</h3>
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
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow flex items-center justify-center"
            title="Add Category"
            aria-label="Add Category"
            onClick={handleCreateCategory}
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
        {/* Row Count Display */}
        <div className="mt-2 text-sm text-gray-700">
          {filteredCategories.length === categoriesList.length
            ? `Total categories: ${categoriesList.length}`
            : `Showing ${filteredCategories.length} of ${categoriesList.length} categories`}
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredCategories.length} of {categoriesList.length} categories
          </p>
        )}
      </div>
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-600 text-white ">
          <tr>
            <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
              <div className="flex items-center space-x-1">
                <span>Name</span>
                {getSortIcon('name')}
                <button
                  type="button"
                  className="ml-1 focus:outline-none"
                  onClick={e => {e.stopPropagation(); setShowNameFilter(prev => !prev);}}
                  title="Filter Name"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              {showNameFilter && (
                <div style={{ position: 'relative', zIndex: 9999 }}>
                  <button type="button"
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                    style={{ padding: '2px', borderRadius: '50%' }}
                    onClick={() => setShowNameFilter(false)} title="Close">✖</button>
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
            <th className="px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedCategories.length > 0 ? (
            sortedCategories.map((cat, idx) => (
              <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3">
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2"
                    onClick={() => handleEditCategory(cat)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    onClick={() => handleDeleteCategory(cat)}
                    title="Delete Category"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="px-4 py-8 text-center text-gray-500">
                {searchTerm ? 'No categories found matching your search.' : 'No categories available.'}
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
