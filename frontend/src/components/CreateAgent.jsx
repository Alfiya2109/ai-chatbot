import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';

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
  const navigate = useNavigate();

  const tabs = ['Files', 'Text', 'Excel/CSV', 'Q&A', 'Chatbot', 'History'];

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
    }
  }, [activeTab]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/filesupload/');
      setUploadedFiles(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchText = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/textupload/');
      
      setTextInput('');
      setUploadedTexts(response.data);
    } catch (error) {
      console.error('Error fetching text:', error);
    }
  };

  const fetchExcel = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/excelupload/');
      setUploadedFiles(response.data);
    } catch (error) {
      console.error('Error fetching Excel files:', error);
    }
  };

  const fetchQA = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/qa/');
      setQaData(response.data);
    } catch (error) {
      console.error('Error fetching Q&A data:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/subcategories/');
      setSubCategories(response.data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
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

  const handleFileUploadAndTrain = async (file) => {
    try {
      // Upload the file using filesupload API
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await axios.post('http://127.0.0.1:8000/api/filesupload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Show the uploaded file in preview
      const uploadedFile = uploadResponse.data;
      setUploadedFiles((prevFiles) => [...prevFiles, uploadedFile]);

      // Prepare data for upload-and-train API
      const trainFormData = new FormData();
      trainFormData.append('type', 'file');
      trainFormData.append('file', file);

      // Call upload-and-train API
      const trainResponse = await axios.post('http://127.0.0.1:8000/api/upload-and-train/', trainFormData, {
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
      // Upload the file using excelupload API
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await axios.post('http://127.0.0.1:8000/api/excelupload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Show the uploaded file in preview
      const uploadedFile = uploadResponse.data;
      setUploadedFiles((prevFiles) => [...prevFiles, uploadedFile]);

      // Prepare data for upload-and-train API
      const trainFormData = new FormData();
      trainFormData.append('type', 'file');
      trainFormData.append('file', file);

      // Call upload-and-train API
      const trainResponse = await axios.post('http://127.0.0.1:8000/api/upload-and-train/', trainFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(trainResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during Excel upload and training:', error);
      alert('Failed to upload and train. Please try again.');
    }
  };

  const handleFileDelete = async (fileId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/filesupload/${fileId}/`);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleTextUpload = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/textupload/', { text: textInput });
      fetchText();
    } catch (error) {
      console.error('Error uploading text:', error);
    }
  };

  const handleTextUploadAndTrain = async () => {
    try {
      setIsTraining(true); // Set training state to true

      // Call textupload API
      await axios.post('http://127.0.0.1:8000/api/textupload/', { content: textInput });

      // Refresh the uploaded text list
      fetchText();

      // Prepare data for upload-and-train API
      const trainFormData = new FormData();
      trainFormData.append('type', 'text');
      trainFormData.append('text', textInput);

      // Call upload-and-train API
      const trainResponse = await axios.post('http://127.0.0.1:8000/api/upload-and-train/', trainFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(trainResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during text upload and training:', error);
      alert('Failed to upload and train. Please try again.');
    } finally {
      setIsTraining(false); // Reset training state
    }
  };

  const handleExcelUpload = async (file) => {
    const formData = new FormData()
    formData.append('file', file);

    try {
      await axios.post('http://127.0.0.1:8000/api/excelupload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchExcel();
    } catch (error) {
      console.error('Error uploading Excel file:', error);
    }
  };

  const handleQASubmit = async (qa) => {
    try {
      await axios.post('http://127.0.0.1:8000/api/qa/', qa);
      fetchQA();
    } catch (error) {
      console.error('Error submitting Q&A:', error);
    }
  };

  const handleQnAUploadAndTrain = async (qa) => {
    try {
      setIsTraining(true); // Set training state to true

      // Ensure category and subcategory are sent as IDs
      const formattedQA = {
        ...qa,
        category: qa.category ? [parseInt(qa.category)] : [],
        subcategory: qa.subcategory ? [parseInt(qa.subcategory)] : [],
      };

      // Upload the Q&A using qa API
      const uploadResponse = await axios.post('http://127.0.0.1:8000/api/qa/', formattedQA);

      // Prepare data for upload-and-train API
      const trainFormData = new FormData();
      trainFormData.append('type', 'qna');
      trainFormData.append('question', qa.question);
      trainFormData.append('answer', qa.answer);
      trainFormData.append('category', qa.category || 'general');
      trainFormData.append('subcategory', qa.subcategory || '');

      // Call upload-and-train API
      const trainResponse = await axios.post('http://127.0.0.1:8000/api/upload-and-train/', trainFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(trainResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during Q&A upload and training:', error);
      alert('Failed to upload and train. Please try again.');
    } finally {
      setIsTraining(false); // Reset training state
    }
  };

  const handleTrain = async () => {
    try {
      let requestData = {};

      if (activeTab === 'Files') {
        requestData = { type: 'file', file: uploadedFiles[0]?.file }; // Assuming the first file for simplicity
      } else if (activeTab === 'Text') {
        requestData = { type: 'text', text: textInput };
      } else if (activeTab === 'Q&A') {
        if (qaData.length > 0) {
          const qa = qaData[0]; // Assuming the first Q&A for simplicity
          requestData = {
            type: 'qna',
            question: qa.question,
            answer: qa.answer,
            category: qa.category || 'general',
            subcategory: qa.subcategory || '',
          };
        }
      }

      const response = await axios.post('http://127.0.0.1:8000/api/upload-and-train/', requestData);
      alert(response.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error initiating training:', error);
      alert('Failed to initiate training. Please try again.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Files':
        return (
          <div
            className={`w-1/2 border b-2 rounded-lg p-6 text-center ${dragging ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'}`}
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
        );
      case 'Text':
        return (
          <div className="mt-4 w-full flex flex-col items-center">
            <textarea
              rows="10"
              className="w-4/5 p-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your text here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
            <button
              className={`mt-4 px-4 py-2 rounded ${isTraining ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              onClick={handleTextUploadAndTrain}
              disabled={isTraining}
            >
              {isTraining ? 'Training...' : 'Train'}
            </button>
          </div>
        );
      case 'Excel/CSV':
        return (
          <div
            className={`w-1/2 border b-2 rounded-lg p-6 text-center ${dragging ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'}`}
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
        );
      case 'Q&A':
        return (
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
            
          </div>
        );
      default:
        return null;
    }
  };

  const renderFileList = () => (
    <div className="mt-6 w-1/2">
      <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
      {uploadedFiles.length > 0 ? (
        <ul className="text-left">
          {uploadedFiles.map((file) => (
            <li key={file.id} className="text-sm p-2 text-gray-700 flex justify-between items-center border-b">
              <a
                href={file.file}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {file.file.split('/').pop()}
              </a>
              <FaTrash
                className="text-red-500 cursor-pointer hover:text-red-700"
                onClick={() => handleFileDelete(file.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No files uploaded yet.</p>
      )}
    </div>
  );

  const renderTextList = () => (
    <div className="mt-6 w-1/2">
      <h3 className="text-lg font-semibold mb-4">Uploaded Text</h3>
      {uploadedTexts.length > 0 ? (
        <ul className="text-left">
          {uploadedTexts.map((file) => (
            <li key={file.id} className="text-sm p-2 text-gray-700 flex justify-between items-center border-b">
              <div>{file.content}</div>
              <FaTrash
                className="text-red-500 cursor-pointer hover:text-red-700"
                onClick={() => handleFileDelete(file.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No text uploaded yet.</p>
      )}
    </div>
  );

  const renderExcelList = () => (
    <div className="mt-6 w-1/2">
      <h3 className="text-lg font-semibold mb-4">Uploaded Excel/CSV Files</h3>
      {uploadedFiles.length > 0 ? (
        <ul className="text-left">
          {uploadedFiles.map((file) => (
            <li key={file.id} className="text-sm p-2 text-gray-700 flex justify-between items-center border-b">
              <a
                href={file.file}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {file.file.split('/').pop()}
              </a>
              <FaTrash
                className="text-red-500 cursor-pointer hover:text-red-700"
                onClick={() => handleFileDelete(file.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No Excel/CSV files uploaded yet.</p>
      )}
    </div>
  );

  const renderQAList = () => (
    <div className="mt-6 w-1/2">
      <h3 className="text-lg font-semibold mb-4">Q&A Data</h3>
      {qaData.length > 0 ? (
        <ul className="text-left">
          {qaData.map((qa) => (
            <li key={qa.id} className="text-sm p-2 text-gray-700 border-b flex justify-between items-center">
              <div>
                <strong>Q:</strong> {qa.question} <br />
                <strong>A:</strong> {qa.answer}
              </div>
              <FaTrash
                className="text-red-500 cursor-pointer hover:text-red-700"
                onClick={async () => {
                  try {
                    await axios.delete(`http://127.0.0.1:8000/api/qa/${qa.id}/`);
                    fetchQA(); // Refresh the Q&A list after deletion
                    alert('Q&A deleted successfully!');
                  } catch (error) {
                    console.error('Error deleting Q&A:', error);
                    alert('Failed to delete Q&A. Please try again.');
                  }
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No Q&A data available yet.</p>
      )}
    </div>
  );

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

      <div className="w-full flex flex-col p-6 justify-center items-center">
        {renderContent()}
        {activeTab === 'Files' && renderFileList()}
        {activeTab === 'Text' && renderTextList()}
        {activeTab === 'Excel/CSV' && renderExcelList()}
        {activeTab === 'Q&A' && renderQAList()}
      </div>
    </div>
  );
}

export default CreateAgent;
