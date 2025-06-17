import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import {BASE_URL} from '../base_url';

const GOOGLE_CLIENT_ID = '601820931949-4u7o7k6gvd5its0cmegmgd2pgk8dc0oe.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyDHWkEDkqzwrm-VS23Vo_8m8AMDRwOyTTk';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.csv'];
let googleGISClient;

function openGoogleDrivePicker(accessToken, pickerCallback) {
  if (!window.google || !window.google.picker || !accessToken) {
    alert('Google Picker API or access token missing');
    return;
  }
  const view = new window.google.picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(true);
  const picker = new window.google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(accessToken)
    .setDeveloperKey(GOOGLE_API_KEY)
    .setCallback(pickerCallback)
    .build();
  picker.setVisible(true);
}

function isSupportedFile(fileName) {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

async function listAllFilesRecursively(folderId, accessToken, parentPath = '') {
  let allFiles = [];
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,parents)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  if (!data.files) return allFiles;
  for (const file of data.files) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      const subFiles = await listAllFilesRecursively(file.id, accessToken, parentPath + file.name + '/');
      allFiles = allFiles.concat(subFiles);
    } else if (isSupportedFile(file.name)) {
      allFiles.push({ ...file, relativePath: parentPath + file.name });
    }
  }
  return allFiles;
}

const GoogleDrive = () => {
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedKBs, setSelectedKBs] = useState([]);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [driveFiles, setDriveFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriveFiles();
  }, []);

  useEffect(() => {
    if (showModal) fetchKnowledgeBases();
  }, [showModal]);

  const fetchDriveFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/google-drive-files/`);
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data);
      }
    } catch (err) {
      setDriveFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledgeBases = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/knowledgebase/', {
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

  // Picker callback for both files and folders
  const pickerCallback = async (data) => {
    if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
      const picked = data[window.google.picker.Response.DOCUMENTS][0];
      const accessToken = window.latestGoogleAccessToken || localStorage.getItem('google_access_token') || '';
      if (!accessToken) {
        alert('No Google access token found. Please re-authenticate.');
        return;
      }
      setUploading(true);
      let filesToUpload = [];
      let folder = '';
      if (picked.mimeType === 'application/vnd.google-apps.folder') {
        folder = picked.name;
        filesToUpload = await listAllFilesRecursively(picked.id, accessToken, picked.name + '/');
      } else if (isSupportedFile(picked.name)) {
        folder = '';
        filesToUpload = [{ ...picked, relativePath: picked.name }];
      } else {
        alert('Selected file type is not supported.');
        setUploading(false);
        return;
      }
      if (filesToUpload.length === 0) {
        alert('No supported files found in the selected folder.');
        setUploading(false);
        return;
      }
      setSelectedFiles(filesToUpload);
      setFolderName(folder || (filesToUpload[0] && filesToUpload[0].name) || '');
      setShowModal(true);
      setUploading(false);
    }
  };

  useEffect(() => {
    const loadGoogleApis = async () => {
      try {
        if (!window.gapi) {
          await new Promise((resolve, reject) => {
            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.async = true;
            gapiScript.onload = resolve;
            gapiScript.onerror = reject;
            document.body.appendChild(gapiScript);
          });
        }
        await new Promise((resolve, reject) => {
          window.gapi.load('picker', {
            callback: resolve,
            onerror: reject
          });
        });
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.async = true;
        gisScript.defer = true;
        document.body.appendChild(gisScript);
        await new Promise((resolve, reject) => {
          gisScript.onload = resolve;
          gisScript.onerror = reject;
        });
        googleGISClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          prompt: '',
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              window.latestGoogleAccessToken = tokenResponse.access_token;
              localStorage.setItem('google_access_token', tokenResponse.access_token);
              openGoogleDrivePicker(tokenResponse.access_token, pickerCallback);
            } else {
              alert('Failed to connect to Google Drive. Please try again.');
            }
          },
        });
        setIsGoogleApiLoaded(true);
      } catch (error) {
        alert('Failed to load Google APIs.');
      }
    };
    loadGoogleApis();
    return () => {
      const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (gisScript) gisScript.remove();
    };
  }, []);

  const handleGoogleDriveClick = () => {
    if (!isGoogleApiLoaded) {
      alert('Google APIs are still loading. Please wait.');
      return;
    }
    if (googleGISClient) {
      googleGISClient.requestAccessToken();
    } else {
      alert('Google Identity Services client is not initialized.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length) return;
    setUploading(true);
    const filesMeta = selectedFiles.map(file => ({
      file_id: file.id,
      file_name: file.name,
      mime_type: file.mimeType,
      relative_path: file.relativePath || file.name, // <-- Ensure this is set!
      folder_name: folderName,
      description,
      knowledge_bases: selectedKBs,
    }));
    // Make sure you have accessToken in your component state
    const payload = {
      files: filesMeta,
      folder_name: folderName,
      description,
      knowledge_bases: selectedKBs,
      access_token: window.latestGoogleAccessToken || localStorage.getItem('google_access_token') || '', // <-- Add this line
    };

    try {
      const res = await fetch('http://localhost:8000/api/chatbot/google-drive/upload-folder/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        setSelectedFiles([]);
        setFolderName('');
        setDescription('');
        setSelectedKBs([]);
        fetchDriveFiles();
        alert('Upload complete!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert('Failed to store Google Drive files in backend.' + (errorData.error ? `\n${errorData.error}` : ''));
      }
    } catch (err) {
      alert('Failed to store Google Drive files in backend.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/google-drive-files/${fileId}/`, { method: 'DELETE' });
      if (res.ok) {
        setDriveFiles(driveFiles.filter(f => f.id !== fileId));
      }
    } catch (err) {
      // handle error
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Uploaded Google Drive Folders/Files</h2>
        <button
          onClick={handleGoogleDriveClick}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow flex items-center justify-center"
          title="Upload from Google Drive"
          disabled={uploading}
        >
          <FaPlus />
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left">Folder Name</th>
              <th className="px-3 py-2 text-left">Path</th> {/* New column */}
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-left">Knowledge Bases</th>
              <th className="px-3 py-2 text-left">Added By</th>
              <th className="px-3 py-2 text-left">Uploaded Date</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
            ) : driveFiles.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-4">No Google Drive files uploaded yet.</td></tr>
            ) : (
              driveFiles.map((item, idx) => (
                <tr key={item.id || idx} className="border-b">
                  <td className="px-3 py-2">{item.folder_name || item.file_name}</td>
                  <td className="px-3 py-2">{item.relative_path || '-'}</td> {/* New column */}
                  <td className="px-3 py-2">{item.description || '-'}</td>
                  <td className="px-3 py-2">
                    {item.knowledge_bases && item.knowledge_bases.length > 0
                      ? item.knowledge_bases.join(', ')
                      : '-'}
                  </td>
                  <td className="px-3 py-2">{item.added_by || '-'}</td>
                  <td className="px-3 py-2">{item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <a href={`https://drive.google.com/file/d/${item.file_id}/view`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800 ml-2"
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
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col gap-4"
            style={{ minWidth: 350 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Upload Folder</h2>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Folder <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={folderName}
                  readOnly
                  className="block w-full text-sm text-gray-700 border border-gray-300 rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
                />
                <span className="text-xs text-gray-500">{selectedFiles.length ? `${selectedFiles.length} file(s) selected` : 'No file chosen'}</span>
              </div>
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
                  <option disabled>No knowledge bases found</option>
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

export default GoogleDrive;

