import React, { useState, useMemo } from 'react';

const KnowledgeBaseTab = ({ knowledgeBases, handleEditKb, handleDeleteKb, handleCreateKb, kbModalOpen, setKbModalOpen, editingKb, kbForm, setKbForm, handleKbFormSubmit }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter knowledge bases based on search term
  const filteredKnowledgeBases = useMemo(() => {
    if (!searchTerm) return knowledgeBases;
    
    const term = searchTerm.toLowerCase();
    return knowledgeBases.filter(kb => {
      // Search in knowledge base name
      return kb.name.toLowerCase().includes(term);
    });
  }, [knowledgeBases, searchTerm]);

  return (
  <div className="bg-white rounded-xl shadow-lg p-6 mt-4 w-full mx-auto">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">Knowledge Base List</h3>
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
        title="Add Knowledge Base"
        aria-label="Add Knowledge Base"
        onClick={handleCreateKb}
      >
        +
      </button>
    </div>
    
    {/* Search Filter */}
    <div className="mb-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search knowledge bases by name..."
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
          Showing {filteredKnowledgeBases.length} of {knowledgeBases.length} knowledge bases
        </p>
      )}
    </div>

    <table className="min-w-full border text-sm">
      <thead>
        <tr>
          <th className="border px-4 py-2 bg-gray-100 text-left">Name</th>
          <th className="border px-4 py-2 bg-gray-100 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredKnowledgeBases.length > 0 ? (
          filteredKnowledgeBases.map((kb) => (
            <tr key={kb.id}>
              <td className="border px-4 py-2 font-medium">{kb.name}</td>
              <td className="border px-4 py-2 space-x-2">
                <button 
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" 
                  onClick={() => handleEditKb(kb)}
                >
                  Edit
                </button>
                <button 
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600" 
                  onClick={() => handleDeleteKb(kb.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="2" className="border px-4 py-8 text-center text-gray-500">
              {searchTerm ? 'No knowledge bases found matching your search.' : 'No knowledge bases available.'}
            </td>
          </tr>
        )}
      </tbody>
    </table>
    {/* Knowledge Base Modal */}
    {kbModalOpen && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setKbModalOpen(false)}>
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-semibold mb-4">{editingKb ? 'Edit Knowledge Base' : 'Create New Knowledge Base'}</h2>
          <form onSubmit={handleKbFormSubmit} className="space-y-3 text-sm">
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <input
                type="text"
                required
                value={kbForm.name}
                onChange={e => setKbForm({ name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => { setKbModalOpen(false); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">{editingKb ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
};

export default KnowledgeBaseTab;
