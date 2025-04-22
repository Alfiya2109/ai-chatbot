import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

const API_BASE_URL = 'http://localhost:8000';
import { IoFilter } from "react-icons/io5";
import { FaPencilAlt } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { MdSimCardDownload } from "react-icons/md";
import { IoBarChart } from "react-icons/io5";


function Config() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState({ question: '', answer: '' });
  const [editId, setEditId] = useState(null);
  const [editAnswer, setEditAnswer] = useState('');
  const [chatLogs, setChatLogs] = useState([]);
  const [filters, setFilters] = useState({ user: '', question: '', answer: '', date: '', time: '' });
  const [showFilters, setShowFilters] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'sales') {
      navigate('/chatbot');
    } else {
      fetchFeedbacks();
      fetchChatLogs();
    }
  }, [currentUser]);

  const fetchFeedbacks = async () => {
    try {
      const token = currentUser?.token || localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatLogs = async () => {
    try {
      const token = currentUser?.token || localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/chatlogs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setChatLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFeedback = async () => {
    const token = currentUser?.token || localStorage.getItem('access_token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newFeedback),
      });
      if (response.ok) {
        fetchFeedbacks();
        setNewFeedback({ question: '', answer: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateFeedback = async (id) => {
    const token = currentUser?.token || localStorage.getItem('access_token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedbacks/upsert/${id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ correct_answer: editAnswer }),
      });
      if (response.ok) {
        const updatedFeedback = await response.json();

        // Update the chatLogs state with the new answer
        setChatLogs((prevLogs) =>
          prevLogs.map((log) =>
            log.id === id ? { ...log, gpt_answer: editAnswer } : log
          )
        );

        setEditId(null);
        setEditAnswer('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpsertFeedback = async (id, correctAnswer, newCorrectStatus) => {
    try {
      const token = currentUser?.token || localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/api/chatlog/${id}/correct/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ correct_answer: correctAnswer, is_correct: newCorrectStatus }),
      });
      if (res.ok) {
        fetchChatLogs(); // Refresh updated data
        setEditId(null);
        setEditAnswer('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (column, value) => {
    setFilters((prevFilters) => ({ ...prevFilters, [column]: value }));
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredChatLogs.map((log) => {
      const timestamp = new Date(log.timestamp);
      const date = `${timestamp.getDate().toString().padStart(2, '0')}-${(timestamp.getMonth() + 1).toString().padStart(2, '0')}-${timestamp.getFullYear()}`;
      const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        User: log.user,
        Question: log.question,
        Answer: log.gpt_answer,
        Date: date,
        Time: time,
      };
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chat Logs');
    XLSX.writeFile(workbook, 'ChatLogs.xlsx');
  };

  const filteredChatLogs = chatLogs.filter((log) => {
    if (log.is_correct !== null) return false; // Exclude logs where is_correct is not null

    const timestamp = new Date(log.timestamp);
    const date = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1).toString().padStart(2, '0')}-${timestamp.getDate().toString().padStart(2, '0')}`;
    const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const username = (log.user).toString() || '';

    return (
      username.toLowerCase().includes(filters.user.toLowerCase()) &&
      log.question.toLowerCase().includes(filters.question.toLowerCase()) &&
      log.gpt_answer.toLowerCase().includes(filters.answer.toLowerCase()) &&
      date.includes(filters.date) &&
      time.includes(filters.time)
    );
  });

  return (
    <div className=" bg-blue-900  p-4 " >
      <div className=" mx-auto border bg-blue-100 shadow-md rounded-lg p-2" style={{ height: 'auto', width: '100%' }}>

        <div className="w-full flex justify-center ">

          <h1 className="text-xl font-bold text-blue-900">Sales Feedback Panel</h1>

        </div>
        <div>

          <div className="flex justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Chat Logs</h2>
            <div className="flex space-x-2" style={{ gap: '10px' }}>
              <button
                onClick={toggleFilters}
                className="bg-blue-900 text-white rounded-full p-2 flex items-center justify-center hover:bg-blue-700 focus:outline-none"
                style={{ width: '30px', height: '30px' }}
              >
                <IoFilter size={16} />
              </button>
              <button
                onClick={handleDownloadExcel}
                className="bg-blue-900 text-white rounded-full p-2 flex items-center justify-center hover:bg-blue-700 focus:outline-none"
                style={{ width: '30px', height: '30px' }}
              >
                <MdSimCardDownload size={16} />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-900 text-white rounded-full p-2 flex items-center justify-center hover:bg-blue-700 focus:outline-none"
                style={{ width: '30px', height: '30px' }}
              >
                <IoBarChart size={16} />
              </button>
            </div>
          </div>
          {/* Filters */}
          {showFilters && (
            <table className="table-auto w-full text-sm border-collapse border border-gray-300 mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2" style={{ width: '15%' }}>
                    User
                    <select
                      className="w-full mt-1 px-2 py-1 border rounded"
                      value={filters.user}
                      onChange={(e) => handleFilterChange('user', e.target.value)}
                    >
                      <option value="">All</option>
                      {[...new Set(chatLogs.map((log) => typeof log.user === 'string' ? log.user : log.user || ''))]
                        .filter((user) => user)
                        .map((user, index) => (
                          <option key={index} value={user}>{user}</option>
                        ))}
                    </select>
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Question
                    <input
                      type="text"
                      placeholder="Filter"
                      className="w-full mt-1 px-2 py-1 border rounded"
                      value={filters.question}
                      onChange={(e) => handleFilterChange('question', e.target.value)}
                    />
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Answer
                    <input
                      type="text"
                      placeholder="Filter"
                      className="w-full mt-1 px-2 py-1 border rounded"
                      value={filters.answer}
                      onChange={(e) => handleFilterChange('answer', e.target.value)}
                    />
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Date
                    <input
                      type="date"
                      className="w-full mt-1 px-2 py-1 border rounded"
                      value={filters.date}
                      onChange={(e) => handleFilterChange('date', e.target.value)}
                    />
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Time
                    <input
                      type="time"
                      className="w-full mt-1 px-2 py-1 border rounded"
                      value={(() => {
                        const [hours, minutes] = filters.time.split(/[: ]/);
                        const isPM = filters.time.includes("PM");
                        const formattedHours = isPM ? (parseInt(hours, 10) % 12) + 12 : parseInt(hours, 10) % 12;
                        return `${formattedHours.toString().padStart(2, "0")}:${minutes}`;
                      })()}
                      onChange={(e) => {
                        if (!e.target.value) {
                          handleFilterChange("time", "");
                        } else {
                          const [hours, minutes] = e.target.value.split(":");
                          const ampm = hours >= 12 ? "PM" : "AM";
                          const formattedTime = `${(hours % 12 || 12).toString().padStart(2, "0")}:${minutes} ${ampm}`;
                          handleFilterChange("time", formattedTime);
                        }
                      }}
                    />
                  </th>
                </tr>
              </thead>
            </table>
          )}
          <table className="table-auto w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">User</th>
                <th className="border border-gray-300 px-4 py-2">Question</th>
                <th className="border border-gray-300 px-4 py-2">Answer</th>
                <th className="border border-gray-300 px-4 py-2">Date</th>
                <th className="border border-gray-300 px-4 py-2">Time</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChatLogs.map((log) => {
                const timestamp = new Date(log.timestamp);
                const date = `${timestamp.getDate().toString().padStart(2, '0')}-${(timestamp.getMonth() + 1).toString().padStart(2, '0')}-${timestamp.getFullYear()}`;
                const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isEditing = editId === log.id;

                return (
                  <tr key={log.id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2">{log.user}</td>
                    <td className="border border-gray-300 px-2 py-2">{log.question}</td>
                    <td className="border flex justify-between border-gray-300 px-2 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editAnswer}
                          onChange={(e) => setEditAnswer(e.target.value)}
                          className="w-11/12 px-2 py-1 border rounded"
                        />
                      ) : (
                        <div style={{ width: '85%', textAlign: 'justify' }}>{log.gpt_answer}</div>
                      )}
                      <button
                        onClick={() => {
                          if (isEditing) {
                            handleUpdateFeedback(log.id);
                          } else {
                            setEditId(log.id);
                            setEditAnswer(log.gpt_answer);
                          }
                        }}
                        className="ml-2 bg-blue-900 text-white rounded-full p-2 flex items-center justify-center hover:bg-blue-700 focus:outline-none"
                        style={{ width: '30px', height: '30px' }}
                      >
                        {isEditing ? <FaCheck size={16} /> : <FaPencilAlt size={16} />}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 whitespace-nowrap">{date}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">{time}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button
                        onClick={() => handleUpsertFeedback(log.id, log.gpt_answer, true)}
                        className="bg-green-500 px-3 py-1 rounded-full text-white rounded hover:bg-green-600 focus:outline-none"
                      >
                        <FaCheck size={12} className='rounded-full' />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Config;
