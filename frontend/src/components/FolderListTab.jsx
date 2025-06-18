import React, { useState, useEffect } from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';
import { BASE_URL } from '../base_url';

const FolderListTab = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [relativePaths, setRelativePaths] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKBs, setSelectedKBs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState([]);

  // Fetch uploaded folders
  useEffect(() => {
    fetchFolders();
  }, []);

  // Fetch knowledge bases when modal opens
  useEffect(() => {
    if (showModal) {
      fetchKnowledgeBases();
    }
  }, [showModal]);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${BASE_URL}/api/folder-upload/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledgeBases = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${BASE_URL}/api/knowledgebase/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setKnowledgeBases(data);
      }
    } catch (err) {
      setKnowledgeBases([]);
    }
  };

  const handleFolderChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    if (files.length > 0) {
      // Extract folder name from first file's relative path
      const firstPath = files[0].webkitRelativePath || files[0].name;
      setFolderName(firstPath.split('/')[0]);
    }
    setRelativePaths(files.map(f => f.webkitRelativePath || f.name));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length) return;
    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file, idx) => {
      formData.append('files', file);
      formData.append('relative_paths', relativePaths[idx]);
    });
    formData.append('folder_name', folderName);
    formData.append('description', description);
    selectedKBs.forEach(kb => formData.append('knowledge_bases', kb));
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${BASE_URL}/api/folder-upload/`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        await fetchFolders();
        setShowModal(false);
        setSelectedFiles([]);
        setRelativePaths([]);
        setFolderName('');
        setDescription('');
        setSelectedKBs([]);
      } else {
        alert('Upload failed.');
      }
    } catch (err) {
      alert('Error uploading folder.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this folder?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/folder-upload/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        setFolders(folders.filter(f => f.id !== id));
      }
    } catch (err) {
      // handle error
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Uploaded Folders</h2>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow flex items-center justify-center"
          title="Upload Folder"
        >
          <FaPlus />
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left">Folder Name</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-left">Knowledge Bases</th>
              <th className="px-3 py-2 text-left">Added By</th>
              <th className="px-3 py-2 text-left">Uploaded Date</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
            ) : folders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4">No folders uploaded.</td></tr>
            ) : (
              folders.map(folder => (
                <tr key={folder.id} className="border-b">
                  <td className="px-3 py-2">{folder.title}</td>
                  <td className="px-3 py-2">{folder.description || '-'}</td>
                  <td className="px-3 py-2">
                    {folder.knowledge_bases_info && folder.knowledge_bases_info.length > 0
                      ? folder.knowledge_bases_info.map(kb => kb.name).join(', ')
                      : '-'}
                  </td>
                  <td className="px-3 py-2">{folder.added_by || '-'}</td>
                  <td className="px-3 py-2">{folder.created_at ? new Date(folder.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleDelete(folder.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-70">
          <form
            onSubmit={handleUpload}
            className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col gap-4"
            style={{ minWidth: 350 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Upload Folder</h2>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Folder <span className="text-red-500">*</span>
              </label>
            <input
              type="file"
              webkitdirectory="true"
              directory="true"
              multiple
                required
              onChange={handleFolderChange}
                className="block w-full text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1"
            />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter a description (optional)"
                className="block w-full text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Knowledge Base</label>
              <select
                multiple
                value={selectedKBs}
                onChange={e => setSelectedKBs(Array.from(e.target.selectedOptions, option => option.value))}
                className="block w-full text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1 h-20"
              >
                {knowledgeBases.length === 0 ? (
                  <option disabled>Loading...</option>
                ) : (
                  knowledgeBases.map(kb => (
                    <option key={kb.id} value={kb.id}>{kb.name}</option>
                  ))
                )}
              </select>
              <div className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                disabled={uploading}
              >
                Cancel
            </button>
              <button
                type="submit"
                disabled={uploading || !selectedFiles.length}
                className={`px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700 ${uploading || !selectedFiles.length ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? 'Uploading...' : 'Submit'}
              </button>
          </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FolderListTab;
