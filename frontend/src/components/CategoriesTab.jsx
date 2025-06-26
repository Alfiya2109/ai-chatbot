import React from 'react';

const CategoriesTab = ({ categoriesList, handleEditCategory, handleDeleteCategory, handleCreateCategory, categoryModalOpen, setCategoryModalOpen, editingCategory, categoryForm, setCategoryForm, categoryFormError, handleCategoryFormSubmit }) => (
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
              <button className="px-3 py-1 bg-blue-500 text-white rounded mr-2" onClick={() => handleEditCategory(cat)}>Edit</button>
              <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={() => handleDeleteCategory(cat)}>Delete</button>
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
