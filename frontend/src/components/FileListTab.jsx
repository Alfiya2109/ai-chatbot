import React from 'react';

const FileListTab = ({ uploadedFiles, renderTable, fileModalOpen, setFileModalOpen, fileForm, setFileForm, knowledgeBases, fileFormError, handleFileModalSubmit, fetchKnowledgeBases }) => (
  <div className="mt-6 w-full">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-2xl font-bold text-gray-800">Uploaded Files</h3>
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow"
        title="Add File"
        aria-label="Add File"
        onClick={() => { fetchKnowledgeBases && fetchKnowledgeBases(); setFileModalOpen(true); }}
      >
        <span>+</span>
      </button>
    </div>
    {renderTable(uploadedFiles, 'files')}
    {/* File Upload Modal */}
    {fileModalOpen && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setFileModalOpen(false)}>
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-semibold mb-4">Upload File</h2>
          <form onSubmit={handleFileModalSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block mb-1 font-medium">File <span className="text-red-500">*</span></label>
              <input
                type="file"
                required
                onChange={e => setFileForm({ ...fileForm, file: e.target.files[0] })}
                className="w-full p-2 border rounded"
                accept=".pdf,.doc,.docx,.txt"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Description</label>
              <textarea
                value={fileForm.description}
                onChange={e => setFileForm({ ...fileForm, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Enter a description (optional)"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Knowledge Base</label>
              <select
                multiple
                value={fileForm.knowledge_bases}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  setFileForm({ ...fileForm, knowledge_bases: options });
                }}
                className="w-full p-2 border rounded"
              >
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
            </div>
            {fileFormError && <div className="text-red-500 text-xs">{fileFormError}</div>}
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => { setFileModalOpen(false); setFileForm({ file: null, description: '', knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);

export default FileListTab;
