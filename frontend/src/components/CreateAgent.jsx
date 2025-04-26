import { useState } from 'react';
import axios from 'axios';

function CreateAgent() {
  const [activeTab, setActiveTab] = useState('Files');
  const [dragging, setDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles((prevFiles) => [...prevFiles, ...files]);

    // Create FormData to send files to the backend
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post('http://localhost:8000/api/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload successful:', response.data);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles((prevFiles) => [...prevFiles, ...files]);

    // Create FormData to send files to the backend
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post('http://localhost:8000/api/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload successful:', response.data);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Files':
        return (
          <div
            className={`w-1/2  border b-2 rounded-lg p-6 text-center ${dragging ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p className="text-gray-600 mb-4" style={{ fontSize: '1.2rem' }}>
              Drag & drop files, or <span className="text-blue-600 cursor-pointer underline" onClick={() => document.getElementById('fileInput').click()}>click here</span>
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="fileInput"
              style={{ display: 'none' }}
            />
            <p className="text-sm text-gray-500">
              Supported File Types: .pdf, .doc, .docx, .txt
            </p>
            {uploadedFiles.length > 0 && (
              <ul className="mt-4  text-left">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="text-sm p-2 text-gray-700 flex justify-between items-center">
                    {file.name}
                    <button
                      className="text-red-500 bg-gray-100 ml-4"
                      onClick={() => handleRemoveFile(index)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case 'Text':
        return (
          <div className="mt-4 w-full flex flex-col items-center">
            <textarea
              rows="10"
              className="w-4/5 p-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your text here..."
              
            />
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Train
            </button>
          </div>
        );
      case 'Excel/CSV':
        return (
          <div
            className={`w-1/2 border b-2 rounded-lg p-6 text-center ${dragging ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const files = Array.from(e.dataTransfer.files).filter((file) =>
                ['application/vnd.ms-excel', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)
              );
              setUploadedFiles((prevFiles) => [...prevFiles, ...files]);
            }}
          >
            <p className="text-gray-600 mb-4" style={{ fontSize: '1.2rem' }}>
              Drag & drop Excel/CSV files, or <span className="text-blue-600 cursor-pointer underline" onClick={() => document.getElementById('excelInput').click()}>click here</span>
            </p>
            <input
              type="file"
              multiple
              accept=".csv, .xls, .xlsx"
              onChange={(e) => {
                const files = Array.from(e.target.files).filter((file) =>
                  ['application/vnd.ms-excel', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)
                );
                setUploadedFiles((prevFiles) => [...prevFiles, ...files]);
              }}
              className="hidden"
              id="excelInput"
              style={{ display: 'none' }}
            />
            <p className="text-sm text-gray-500">
              Supported File Types: .csv, .xls, .xlsx
            </p>
            {uploadedFiles.length > 0 && (
              <ul className="mt-4 text-left">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="text-sm p-2 text-gray-700 flex justify-between items-center">
                    {file.name}
                    <button
                      className="text-red-500 bg-gray-100 ml-4"
                      onClick={() => handleRemoveFile(index)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case 'Q&A':
        return (
          <div className="w-full mt-4 flex flex-col items-center">
            <label className="block text-2xl font-medium text-gray-700 mb-2">
              Q&A Form
            </label>
            <form className="w-full max-w-md space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                  Question
                </label>
                <input
                  type="text"
                  id="question"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your question"
                />
              </div>
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
                  Answer
                </label>
                <textarea
                  id="answer"
                  className="mt-1 block w-full h-24 p-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the answer"
                ></textarea>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <input
                  type="text"
                  id="category"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the category"
                />
              </div>
              <div>
                <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700">
                  Sub Category
                </label>
                <input
                  type="text"
                  id="subCategory"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the sub category"
                />
              </div>
              <div className='w-full flex justify-center items-center'>
              <button

                  type="submit"
                  className=" bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                  Train
                  </button>
              </div>
              
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div style={{width:'20%'}} className=" bg-white shadow-md p-6 flex flex-col justify-center">
        <div className="space-y-4 text-center">
          {['Files', 'Text', 'Excel/CSV', 'Q&A'].map((tab) => (
            <div
              key={tab}
              className={`cursor-pointer p-2 rounded-md ${
                activeTab === tab ? 'bg-blue-600 text-white font-bold' : 'text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex flex-col p-6 justify-center items-center">
        {renderContent()}
        {activeTab === 'Files' && (
          <div className="mt-4 flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-4">
              If you are uploading a PDF, make sure you can select/highlight the text.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Train
            </button>
          </div>
        )}
        {activeTab === 'Excel/CSV' && (
          <div className="mt-4 flex flex-col items-center">
            <p className="text-sm text-gray-500 mb-4">
              If you are uploading an Excel or CSV file, ensure it is properly formatted.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Train
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateAgent;