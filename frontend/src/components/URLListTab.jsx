import React from 'react';

const URLListTab = ({ urlList, renderTable, urlModalOpen, setUrlModalOpen, urlForm, setUrlForm, knowledgeBases, urlFormError, handleUrlModalSubmit }) => (
  <div className="mt-6 w-11/12">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold mb-4">Uploaded URLs</h3>
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow"
        title="Add URL"
        aria-label="Add URL"
        onClick={() => setUrlModalOpen(true)}
      >
        <span>+</span>
      </button>
    </div>
    {renderTable(urlList, 'url')}
    {/* URL Upload Modal */}
    {urlModalOpen && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setUrlModalOpen(false)}>
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-semibold mb-4">Add URL</h2>
          <form onSubmit={handleUrlModalSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block mb-1 font-medium">URL <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={urlForm.url}
                onChange={e => setUrlForm({ ...urlForm, url: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Enter the URL"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Description</label>
              <textarea
                value={urlForm.description}
                onChange={e => setUrlForm({ ...urlForm, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Enter a description (optional)"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Knowledge Base</label>
              <select
                multiple
                value={urlForm.knowledge_bases}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  setUrlForm({ ...urlForm, knowledge_bases: options });
                }}
                className="w-full p-2 border rounded"
              >
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
            </div>
            {urlFormError && <div className="text-red-500 text-xs">{urlFormError}</div>}
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => { setUrlModalOpen(false); setUrlForm({ url: '', description: '', knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);

export default URLListTab;
