import React from 'react';

const QAListTab = ({ qaData, renderTable, qaModalOpen, setQaModalOpen, qaForm, setQaForm, categories, subCategories, knowledgeBases, qaFormError, handleQaModalSubmit }) => (
  <div className="mt-6 w-11/12">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold mb-4">Q&A Data</h3>
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow"
        title="Add Q&A"
        aria-label="Add Q&A"
        onClick={() => setQaModalOpen(true)}
      >
        <span>+</span>
      </button>
    </div>
    {renderTable(qaData, 'qa')}
    {/* Q&A Upload Modal */}
    {qaModalOpen && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setQaModalOpen(false)}>
        <div
          className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
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
  </div>
);

export default QAListTab;
