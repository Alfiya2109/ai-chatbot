import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';
import { BASE_URL } from '../base_url';

function CreateAgent() {
  const [activeTab, setActiveTab] = useState('Files');
  const [dragging, setDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedTexts, setUploadedTexts] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [qaData, setQaData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [urlList, setUrlList] = useState([]);
  const [users, setUsers] = useState([]); // For User Details tab
  const [userSearch, setUserSearch] = useState(''); // User search filter

  const navigate = useNavigate();

  const tabs = ['Files', 'Text', 'Excel/CSV', 'Q&A', 'URL', 'Chatbot', 'History', 'User Details'];

  useEffect(() => {
    if (activeTab === 'Files') {
      fetchFiles();
    } else if (activeTab === 'Text') {
      fetchText();
    } else if (activeTab === 'Excel/CSV') {
      fetchExcel();
    } else if (activeTab === 'Q&A') {
      fetchQA();
      fetchCategories();
      fetchSubCategories();
    } else if (activeTab === 'URL') {
      fetchURLs();
    } else if (activeTab === 'User Details') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/filesupload/`);
      setUploadedFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchText = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/textupload/`);
      setTextInput('');
      setUploadedTexts(response.data);
    } catch (error) {
      console.error('Error fetching text:', error);
    }
  };

  const fetchExcel = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/excelupload/`);
      setUploadedFiles(response.data);
    } catch (error) {
      console.error('Error fetching Excel files:', error);
    }
  };

  const fetchQA = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/qa/`);
      setQaData(response.data);
    } catch (error) {
      console.error('Error fetching Q&A data:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/categories/`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/subcategories/`);
      setSubCategories(response.data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchURLs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/urls/`);
      setUrlList(response.data);
    } catch (error) {
      console.error('Error fetching URLs:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/userprofiles/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === 'Chatbot') {
      navigate('/chatbot');
    } else if (tab === 'History') {
      navigate('/config');
    } else {
      setActiveTab(tab);
    }
  };

  // File Upload and Train Handlers

  const handleFileUploadAndTrain = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('access_token');
      const uploadResponse = await axios.post(`${BASE_URL}/api/filesupload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const uploadedFile = uploadResponse.data;
      setUploadedFiles((prevFiles) => [...prevFiles, uploadedFile]);

      const trainFormData = new FormData();
      trainFormData.append('type', 'file');
      trainFormData.append('file', file);

      const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(trainResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during file upload and training:', error);
      alert('Failed to upload and train. Please try again.');
    }
  };

  const handleExcelUploadAndTrain = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('access_token');
      const uploadResponse = await axios.post(`${BASE_URL}/api/excelupload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const uploadedFile = uploadResponse.data;
      setUploadedFiles((prevFiles) => [...prevFiles, uploadedFile]);

      const trainFormData = new FormData();
      trainFormData.append('type', 'file');
      trainFormData.append('file', file);

      const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(trainResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during Excel upload and training:', error);
      alert('Failed to upload and train. Please try again.');
    }
  };

  // Delete handlers

  const handleFileDelete = async (fileId) => {
    try {
      await axios.delete(`${BASE_URL}/api/filesupload/${fileId}/`);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleExcelDelete = async (fileId) => {
    try {
      await axios.delete(`${BASE_URL}/api/excelupload/${fileId}/`);
      fetchExcel();
    } catch (error) {
      console.error('Error deleting Excel/CSV file:', error);
    }
  };

  const handleTextUpload = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${BASE_URL}/api/textupload/`, { text: textInput }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchText();
    } catch (error) {
      console.error('Error uploading text:', error);
    }
  };

  const handleTextDelete = async (textId) => {
    try {
      await axios.delete(`${BASE_URL}/api/textupload/${textId}/`);
      fetchText();
    } catch (error) {
      console.error('Error deleting text:', error);
    }
  };

  const handleTextUploadAndTrain = async () => {
    try {
      setIsTraining(true);
      const token = localStorage.getItem('access_token');
      await axios.post(`${BASE_URL}/api/textupload/`, { content: textInput }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchText();

      const trainFormData = new FormData();
      trainFormData.append('type', 'text');
      trainFormData.append('text', textInput);

      const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(trainResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during text upload and training:', error);
      alert('Failed to upload and train. Please try again.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleExcelUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${BASE_URL}/api/excelupload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      fetchExcel();
    } catch (error) {
      console.error('Error uploading Excel file:', error);
    }
  };

  const handleQASubmit = async (qa) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${BASE_URL}/api/qa/`, { ...qa }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchQA();
    } catch (error) {
      console.error('Error submitting Q&A:', error);
    }
  };

  const handleQnAUploadAndTrain = async (qa) => {
    try {
      setIsTraining(true);
      const token = localStorage.getItem('access_token');
      const formattedQA = {
        ...qa,
        category: qa.category ? [parseInt(qa.category)] : [],
        subcategory: qa.subcategory ? [parseInt(qa.subcategory)] : [],
      };
      await axios.post(`${BASE_URL}/api/qa/`, formattedQA, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const trainFormData = new FormData();
      trainFormData.append('type', 'qna');
      trainFormData.append('question', qa.question);
      trainFormData.append('answer', qa.answer);
      trainFormData.append('category', qa.category || 'general');
      trainFormData.append('subcategory', qa.subcategory || '');

      const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(trainResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during Q&A upload and training:', error);
      alert('Failed to upload and train. Please try again.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleTrain = async () => {
    try {
      let requestData = {};

      if (activeTab === 'Files') {
        requestData = { type: 'file', file: uploadedFiles[0]?.file };
      } else if (activeTab === 'Text') {
        requestData = { type: 'text', text: textInput };
      } else if (activeTab === 'Q&A') {
        if (qaData.length > 0) {
          const qa = qaData[0];
          requestData = {
            type: 'qna',
            question: qa.question,
            answer: qa.answer,
            category: qa.category || 'general',
            subcategory: qa.subcategory || '',
          };
        }
      }

      const response = await axios.post(`${BASE_URL}/api/upload-and-train/`, requestData);
      alert(response.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error initiating training:', error);
      alert('Failed to initiate training. Please try again.');
    }
  };

  const handleURLTrain = async () => {
    const urlInput = document.querySelector('textarea').value;
    if (!urlInput) {
      alert('Please enter at least one URL.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${BASE_URL}/api/urls/`, { url: urlInput }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const embedResponse = await axios.post(`${BASE_URL}/api/embed-website/`, { url: urlInput }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert(embedResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during URL training:', error);
      alert('Failed to train with the provided URL(s). Please try again.');
    }
  };

  // Render table helper for various data types

  const renderTable = (data, type) => {
    if (!data || data.length === 0) return <p className="text-gray-500">No data available yet.</p>;
    let columns = Object.keys(data[0]).filter((col) => col !== 'id');
    if ((type === 'files' || type === 'excel') && columns.includes('file')) {
      columns = ['file', ...columns.filter((c) => c !== 'file')];
    }
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className="border px-2 py-1 bg-gray-100 text-gray-700">
                  {col === 'file' ? 'File Name' : col.charAt(0).toUpperCase() + col.slice(1)}
                </th>
              ))}
              <th className="border px-2 py-1 bg-gray-100 text-gray-700">View</th>
              <th className="border px-2 py-1 bg-gray-100 text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.file || row.content || row.url || row.question || row.id}>
                {columns.map((col) => (
                  <td key={col} className="border px-2 py-1">
                    {col === 'file' && row[col]
                      ? row[col].split('/').pop()
                      : typeof row[col] === 'string' && row[col].startsWith('http')
                      ? (
                        <a href={row[col]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {row[col]}
                        </a>
                      )
                      : Array.isArray(row[col])
                      ? row[col].join(', ')
                      : String(row[col])}
                  </td>
                ))}
                <td className="border px-2 py-1 text-center">
                  {row.file ? (
                    <button
                      className="text-blue-600 underline hover:text-blue-800"
                      onClick={() => window.open(row.file, '_blank')}
                    >
                      View
                    </button>
                  ) : row.url ? (
                    <button
                      className="text-blue-600 underline hover:text-blue-800"
                      onClick={() => window.open(`${BASE_URL}` + row.url, '_blank')}
                    >
                      View
                    </button>
                  ) : null}
                </td>
                <td className="border px-2 py-1 text-center">
                  <FaTrash
                    className="text-red-500 cursor-pointer hover:text-red-700"
                    onClick={() => {
                      if (type === 'files') handleFileDelete(row.id);
                      else if (type === 'excel') handleExcelDelete(row.id);
                      else if (type === 'text') handleTextDelete(row.id);
                      else if (type === 'qa') {
                        axios.delete(`${BASE_URL}/api/qa/${row.id}/`).then(fetchQA);
                      } else if (type === 'url') {
                        axios.delete(`${BASE_URL}/api/urls/${row.id}/`).then(fetchURLs);
                      }
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderers for each tab content

  const renderFileList = () => (
    <div className="mt-6 w-1/2">
      <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
      {renderTable(uploadedFiles, 'files')}
    </div>
  );

  const renderTextList = () => (
    <div className="mt-6 w-1/2">
      <h3 className="text-lg font-semibold mb-4">Uploaded Text</h3>
      {renderTable(uploadedTexts, 'text')}
    </div>
  );

  const renderExcelList = () => (
    <div className="mt-6 w-1/2">
      <h3 className="text-lg font-semibold mb-4">Uploaded Excel/CSV Files</h3>
      {renderTable(uploadedFiles, 'excel')}
    </div>
  );

  const renderQAList = () => (
    <div className="mt-6 w-1/2">
      <h3 className="text-lg font-semibold mb-4">Q&A Data</h3>
      {renderTable(qaData, 'qa')}
    </div>
  );

  const renderURLList = () => (
    <div className="mt-6 w-1/2">
      <h3 className="text-lg font-semibold mb-4">Uploaded URLs</h3>
      {renderTable(urlList, 'url')}
    </div>
  );

  // Updated User Details UI from previous Config component for consistent UI & filtering

  const renderUserDetails = () => {
    if (!users || users.length === 0) {
      return <p className="text-gray-500">No users found.</p>;
    }

    const filteredUsers = users.filter((user) => {
      const searchLower = userSearch.toLowerCase();
      return (
        (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
        (user.phone_number && user.phone_number.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.role && user.role.toLowerCase().includes(searchLower)) ||
        (user.created_at && new Date(user.created_at).toLocaleDateString().includes(searchLower))
      );
    });

    return (
      <div className="mt-6 w-full max-w-5xl overflow-x-auto bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">User Details</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Filter by Name, Phone, Email, Role, or Date..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="p-2 border border-gray-300 rounded-md w-full max-w-xs"
          />
        </div>

        <table className="min-w-full border text-sm">
          <thead>
            <tr>
              <th className="border px-3 py-2 bg-gray-100 text-left">First Name</th>
              <th className="border px-3 py-2 bg-gray-100 text-left">Last Name</th>
              <th className="border px-3 py-2 bg-gray-100 text-left">Phone</th>
              <th className="border px-3 py-2 bg-gray-100 text-left">Email</th>
              <th className="border px-3 py-2 bg-gray-100 text-left">Created Date</th>
              <th className="border px-3 py-2 bg-gray-100 text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="border px-3 py-2 text-center text-gray-500">
                  No matching users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, idx) => (
                <tr key={user.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2">{user.first_name}</td>
                  <td className="border px-3 py-2">{user.last_name}</td>
                  <td className="border px-3 py-2">{user.phone_number}</td>
                  <td className="border px-3 py-2">{user.email}</td>
                  <td className="border px-3 py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="border px-3 py-2 capitalize">{user.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Files':
        return (
          <>
            <div
              className={`w-1/2 border b-2 rounded-lg p-6 text-center ${
                dragging ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const files = Array.from(e.dataTransfer.files);
                files.forEach((file) => handleFileUploadAndTrain(file));
              }}
            >
              <p className="text-gray-600 mb-4" style={{ fontSize: '1.2rem' }}>
                Drag & drop files, or{' '}
                <span
                  className="text-blue-600 cursor-pointer underline"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  click here
                </span>
              </p>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  files.forEach((file) => handleFileUploadAndTrain(file));
                }}
                className="hidden"
                id="fileInput"
                style={{ display: 'none' }}
              />
              <p className="text-sm text-gray-500">Supported File Types: .pdf, .doc, .docx, .txt</p>
            </div>
            {renderFileList()}
          </>
        );
      case 'Text':
        return (
          <>
            <div className="mt-4 w-full flex flex-col items-center">
              <textarea
                rows="10"
                className="w-4/5 p-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your text here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <button
                className={`mt-4 px-4 py-2 rounded ${
                  isTraining ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
                onClick={handleTextUploadAndTrain}
                disabled={isTraining}
              >
                {isTraining ? 'Training...' : 'Train'}
              </button>
            </div>
            {renderTextList()}
          </>
        );
      case 'Excel/CSV':
        return (
          <>
            <div
              className={`w-1/2 border b-2 rounded-lg p-6 text-center ${
                dragging ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const files = Array.from(e.dataTransfer.files);
                files.forEach((file) => handleExcelUploadAndTrain(file));
              }}
            >
              <p className="text-gray-600 mb-4" style={{ fontSize: '1.2rem' }}>
                Drag & drop Excel/CSV files, or{' '}
                <span
                  className="text-blue-600 cursor-pointer underline"
                  onClick={() => document.getElementById('excelInput').click()}
                >
                  click here
                </span>
              </p>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  files.forEach((file) => handleExcelUploadAndTrain(file));
                }}
                accept=".csv, .xls, .xlsx"
                className="hidden"
                id="excelInput"
                style={{ display: 'none' }}
              />
              <p className="text-sm text-gray-500">Supported File Types: .csv, .xls, .xlsx</p>
            </div>
            {renderExcelList()}
          </>
        );
      case 'Q&A':
        return (
          <>
            <div className="w-full mt-4 flex flex-col items-center">
              <label className="block text-2xl font-medium text-gray-700 mb-2">Q&A Form</label>
              <form
                className="w-full max-w-md space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const question = e.target.question.value;
                  const answer = e.target.answer.value;
                  const category = e.target.category.value;
                  const subCategory = e.target.subCategory.value;

                  if (!question || !answer) {
                    alert('Question and Answer are required!');
                    return;
                  }

                  handleQnAUploadAndTrain({ question, answer, category, subCategory });
                }}
              >
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                    Question
                  </label>
                  <input type="text" id="question" name="question" className="mt-1 block w-full p-2 border rounded-md" />
                </div>
                <div>
                  <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
                    Answer
                  </label>
                  <textarea id="answer" name="answer" className="mt-1 block w-full p-2 border rounded-md h-24" />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select id="category" name="category" className="mt-1 block w-full p-2 border rounded-md">
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700">
                    Sub Category
                  </label>
                  <select id="subCategory" name="subCategory" className="mt-1 block w-full p-2 border rounded-md">
                    <option value="">Select a subcategory</option>
                    {subCategories.map((subCat) => (
                      <option key={subCat.id} value={subCat.id}>
                        {subCat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className={`mt-4 px-4 py-2 rounded ${isTraining ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                  disabled={isTraining}
                >
                  {isTraining ? 'Training...' : 'Train'}
                </button>
              </form>

              {renderQAList()}
            </div>
          </>
        );
      case 'URL':
        return (
          <>
            <div className="mt-6 w-1/2">
              <h3 className="text-lg font-semibold mb-4">URL Management</h3>
              <textarea
                rows="4"
                className="w-full p-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter URLs here, one per line..."
              />
              <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded" onClick={handleURLTrain}>
                Train
              </button>
            </div>
            {renderURLList()}
          </>
        );
      case 'User Details':
        return renderUserDetails();
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div style={{ width: '20%' }} className="bg-white shadow-md p-6 flex flex-col justify-center">
        <div className="space-y-4 text-center">
          {tabs.map((tab) => (
            <div
              key={tab}
              className={`cursor-pointer p-2 rounded-md ${
                activeTab === tab ? 'bg-blue-600 text-white font-bold' : 'text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex flex-col p-6 justify-center items-center">{renderContent()}</div>
    </div>
  );
}

export default CreateAgent;
