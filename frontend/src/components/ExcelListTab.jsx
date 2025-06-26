import React, { useState } from 'react';

const ExcelListTab = ({ uploadedFiles, renderTable, excelModalOpen, setExcelModalOpen, excelForm, setExcelForm, knowledgeBases, excelFormError, handleExcelModalSubmit, fetchKnowledgeBases, onBulkDelete }) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedItems(uploadedFiles.map(item => item.id));
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

    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} Excel/CSV file(s)? This action cannot be undone.`)) {
      try {
        const result = await onBulkDelete(selectedItems);
        if (result.success) {
          setIsMultiSelectMode(false);
          setSelectedItems([]);
          alert(`Successfully deleted ${selectedItems.length} Excel/CSV file(s).`);
        } else {
          alert(result.error || 'Failed to delete Excel/CSV files. Please try again.');
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold mb-4">Uploaded Excel/CSV Files</h3>
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
                title="Add Excel/CSV File"
                aria-label="Add Excel/CSV File"
                onClick={() => { fetchKnowledgeBases && fetchKnowledgeBases(); setExcelModalOpen(true); }}
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
      {renderTable(uploadedFiles, 'excel', {
        isMultiSelectMode,
        selectedItems,
        onSelectAll: handleSelectAll,
        onItemSelect: handleItemSelect
      })}
      {/* Excel Upload Modal */}
      {excelModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setExcelModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Upload Excel/CSV File</h2>
            <form onSubmit={handleExcelModalSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">File <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  required
                  onChange={e => setExcelForm({ ...excelForm, file: e.target.files[0] })}
                  className="w-full p-2 border rounded"
                  accept=".csv,.xls,.xlsx"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={excelForm.description}
                  onChange={e => setExcelForm({ ...excelForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter a description (optional)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                <select
                  multiple
                  value={excelForm.knowledge_bases}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setExcelForm({ ...excelForm, knowledge_bases: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              {excelFormError && <div className="text-red-500 text-xs">{excelFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setExcelModalOpen(false); setExcelForm({ file: null, description: '', knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelListTab;
