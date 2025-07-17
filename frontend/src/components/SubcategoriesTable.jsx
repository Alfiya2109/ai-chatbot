import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { FaPlus, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const SubcategoriesTable = ({ subCategories, categories, onAddSubcategory, onEditSubcategory }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [formError, setFormError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  // Dropdown filter state
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState([]);
  const [showSubcategoryFilter, setShowSubcategoryFilter] = useState(false);
  const [selectedSubcategoryFilter, setSelectedSubcategoryFilter] = useState([]);

  // Flatten subcategories for table: each row is a subcategory with its parent category
  const data = subCategories.map((sub) => {
    const parent = categories.find((cat) => cat.id === sub.category);
    return {
      subcategoryId: sub.id,
      subcategoryName: sub.name,
      categoryId: parent ? parent.id : '',
      categoryName: parent ? parent.name : '',
    };
  });

  // Unique options for each filter
  const categoryOptions = useMemo(() => Array.from(new Set(data.map(row => row.categoryName))).map(name => ({ value: name, label: name })), [data]);
  const subcategoryOptions = useMemo(() => Array.from(new Set(data.map(row => row.subcategoryName))).map(name => ({ value: name, label: name })), [data]);

  // Update filteredData to apply multi-select filters before search
  const filteredData = useMemo(() => {
    let filtered = data;
    // Multi-select Category filter
    if (selectedCategoryFilter.length > 0) {
      filtered = filtered.filter(row => selectedCategoryFilter.includes(row.categoryName));
    }
    // Multi-select Subcategory filter
    if (selectedSubcategoryFilter.length > 0) {
      filtered = filtered.filter(row => selectedSubcategoryFilter.includes(row.subcategoryName));
    }
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(row => {
        return row.subcategoryName.toLowerCase().includes(term) || 
               row.categoryName.toLowerCase().includes(term);
      });
    }
    return filtered;
  }, [data, searchTerm, selectedCategoryFilter, selectedSubcategoryFilter]);

  const sortedData = useMemo(() => {
    let filtered = filteredData;
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = '';
        let bValue = '';
        switch (sortField) {
          case 'categoryName':
            aValue = (a.categoryName || '').toLowerCase();
            bValue = (b.categoryName || '').toLowerCase();
            break;
          case 'subcategoryName':
            aValue = (a.subcategoryName || '').toLowerCase();
            bValue = (b.subcategoryName || '').toLowerCase();
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
  }, [filteredData, sortField, sortDirection]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!selectedCategory || !subcategoryName.trim()) {
      setFormError('Both fields are required.');
      return;
    }
    if (editMode && onEditSubcategory) {
      onEditSubcategory({ id: editId, category: selectedCategory, name: subcategoryName.trim() });
    } else if (onAddSubcategory) {
      onAddSubcategory({ category: selectedCategory, name: subcategoryName.trim() });
    }
    setModalOpen(false);
    setSelectedCategory('');
    setSubcategoryName('');
    setEditMode(false);
    setEditId(null);
  };

  const openEditModal = (row) => {
    setEditMode(true);
    setEditId(row.subcategoryId);
    setSelectedCategory(row.categoryId);
    setSubcategoryName(row.subcategoryName);
    setModalOpen(true);
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
    const data = filteredData.map(row => ({
      'Category Name': row.categoryName || '-',
      'Subcategory Name': row.subcategoryName || '-',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Subcategories');
    XLSX.writeFile(workbook, 'subcategories.xlsx');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-4 w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Subcategories List</h3>
        <div className="flex items-center gap-4">
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
            title="Add Subcategory"
            aria-label="Add Subcategory"
            onClick={() => { setModalOpen(true); setEditMode(false); setSelectedCategory(''); setSubcategoryName(''); setEditId(null); }}
          >
            <FaPlus />
          </button>
        </div>
      </div>
      
      {/* Search Filter */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search subcategories by name or category..."
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
          {filteredData.length === data.length
            ? `Total subcategories: ${data.length}`
            : `Showing ${filteredData.length} of ${data.length} subcategories`}
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredData.length} of {data.length} subcategories
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredData.length > 0 ? (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-600 text-white ">
              <tr>
                <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('categoryName')}>
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    {getSortIcon('categoryName')}
                    <button
                      type="button"
                      className="ml-1 focus:outline-none"
                      onClick={e => {e.stopPropagation(); setShowSubcategoryFilter(false); setShowCategoryFilter(prev => !prev);}}
                      title="Filter Category"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                  {showCategoryFilter && (
                    <div style={{ position: 'relative', zIndex: 9999 }}>
                      <button type="button"
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                        style={{ padding: '2px', borderRadius: '50%' }}
                        onClick={() => setShowCategoryFilter(false)} title="Close">✖</button>
                      <Select
                        isMulti
                        isSearchable
                        options={categoryOptions}
                        value={selectedCategoryFilter.map(val => ({ value: val, label: val }))}
                        onChange={selected => setSelectedCategoryFilter(selected ? selected.map(s => s.value) : [])}
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
                <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('subcategoryName')}>
                  <div className="flex items-center space-x-1">
                    <span>Subcategory</span>
                    {getSortIcon('subcategoryName')}
                    <button
                      type="button"
                      className="ml-1 focus:outline-none"
                      onClick={e => {e.stopPropagation(); setShowCategoryFilter(false); setShowSubcategoryFilter(prev => !prev);}}
                      title="Filter Subcategory"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                  {showSubcategoryFilter && (
                    <div style={{ position: 'relative', zIndex: 9999 }}>
                      <button type="button"
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                        style={{ padding: '2px', borderRadius: '50%' }}
                        onClick={() => setShowSubcategoryFilter(false)} title="Close">✖</button>
                      <Select
                        isMulti
                        isSearchable
                        options={subcategoryOptions}
                        value={selectedSubcategoryFilter.map(val => ({ value: val, label: val }))}
                        onChange={selected => setSelectedSubcategoryFilter(selected ? selected.map(s => s.value) : [])}
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
                <th className="px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((row, idx) => (
                <tr key={row.subcategoryId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{row.categoryName}</td>
                  <td className="px-4 py-3">{row.subcategoryName}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                      onClick={() => openEditModal(row)}
                    >
                      Edit
                    </button>
                    {/* TODO: Add delete button if needed */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            {searchTerm ? 'No subcategories found matching your search.' : 'No subcategories available.'}
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit Subcategory' : 'Add Subcategory'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">Category <span className="text-red-500">*</span></label>
                <select
                  required
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Subcategory <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={subcategoryName}
                  onChange={e => setSubcategoryName(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter subcategory name"
                />
              </div>
              {formError && <div className="text-red-500 text-xs">{formError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">{editMode ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubcategoriesTable;
