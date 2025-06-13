import React from 'react';

const TextListTab = ({ uploadedTexts, renderTable, textModalOpen, setTextModalOpen, textForm, setTextForm, knowledgeBases, textFormError, handleTextModalSubmit }) => (
  <div className="mt-6 w-11/12">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold mb-4">Uploaded Text</h3>
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow"
        title="Add Text"
        aria-label="Add Text"
        onClick={() => setTextModalOpen(true)}
      >
        <span>+</span>
      </button>
    </div>
    {renderTable(uploadedTexts, 'text')}
    {/* Text Upload Modal */}
    {textModalOpen && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setTextModalOpen(false)}>
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-semibold mb-4">Upload Text</h2>
          <form onSubmit={handleTextModalSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block mb-1 font-medium">Text <span className="text-red-500">*</span></label>
              <textarea
                required
                value={textForm.content}
                onChange={e => setTextForm({ ...textForm, content: e.target.value })}
                className="w-full p-2 border rounded"
                rows={4}
                placeholder="Enter your text here..."
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Description</label>
              <textarea
                value={textForm.description}
                onChange={e => setTextForm({ ...textForm, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Enter a description (optional)"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Knowledge Base</label>
              <select
                multiple
                value={textForm.knowledge_bases}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  setTextForm({ ...textForm, knowledge_bases: options });
                }}
                className="w-full p-2 border rounded"
              >
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
            </div>
            {textFormError && <div className="text-red-500 text-xs">{textFormError}</div>}
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => { setTextModalOpen(false); setTextForm({ content: '', description: '', knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);

export default TextListTab;
