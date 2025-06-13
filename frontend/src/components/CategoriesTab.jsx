import React from 'react';

const CategoriesTab = ({ categoriesList, handleEditCategory, handleCreateCategory, categoryModalOpen, setCategoryModalOpen, editingCategory, categoryForm, setCategoryForm, categoryFormError, handleCategoryFormSubmit }) => (
  <div className="mt-6 w-full max-w-2xl mx-auto">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">Categories</h3>
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
        onClick={handleCreateCategory}
      >
        +
      </button>
    </div>
    <table className="min-w-full border text-sm">
      <thead>
        <tr>
          <th className="border px-4 py-2 bg-gray-100 text-left">Name</th>
          <th className="border px-4 py-2 bg-gray-100 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {categoriesList.map((cat) => (
          <tr key={cat.id}>
            <td className="border px-4 py-2">{cat.name}</td>
            <td className="border px-4 py-2">
              <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={() => handleEditCategory(cat)}>Edit</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
                onChange={e => setCategoryForm({ name: e.target.value })}
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

export default CategoriesTab;
