import React, { useState, useMemo } from 'react';

const SubcategoriesTable = ({ subCategories, categories, onAddSubcategory, onEditSubcategory }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [formError, setFormError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter subcategories based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(row => {
      // Search in subcategory name or category name
      return row.subcategoryName.toLowerCase().includes(term) || 
             row.categoryName.toLowerCase().includes(term);
    });
  }, [data, searchTerm]);

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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-4 w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Subcategories List</h3>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
          title="Add Subcategory"
          aria-label="Add Subcategory"
          onClick={() => { setModalOpen(true); setEditMode(false); setSelectedCategory(''); setSubcategoryName(''); setEditId(null); }}
        >
          +
        </button>
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
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredData.length} of {data.length} subcategories
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        {filteredData.length > 0 ? (
          <table className="w-full border text-sm rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold">Category</th>
                <th className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold">Subcategory</th>
                <th className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={row.subcategoryId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-4 py-2 font-medium">{row.categoryName}</td>
                  <td className="border px-4 py-2">{row.subcategoryName}</td>
                  <td className="border px-4 py-2 text-center">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded mr-2 hover:bg-blue-600"
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
          <div className="text-center text-gray-500 py-8">
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
