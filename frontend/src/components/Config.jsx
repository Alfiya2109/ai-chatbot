import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { IoFilter, IoBarChart } from 'react-icons/io5';
import { FaPencilAlt, FaCheck } from 'react-icons/fa';
import { MdSimCardDownload } from 'react-icons/md';

const API_BASE_URL = 'http://localhost:8000';

function Config() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState({ question: '', answer: '' });
  const [editId, setEditId] = useState(null);
  const [editAnswer, setEditAnswer] = useState('');
  const [editCategory, setEditCategory] = useState([]);
  const [editSubcategory, setEditSubcategory] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [filters, setFilters] = useState({
    user: '',
    question: '',
    answer: '',
    date: '',
    time: '',
    category: [],
    subcategory: []
  });
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
      const res = await fetch(`${API_BASE_URL}/api/feedbacks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatLogs = async () => {
    try {
      const token = currentUser?.token || localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/api/chatlogs/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setChatLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCategory = async (id) => {
    const token = currentUser?.token || localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/chatlogs/${id}/update-category/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ category_names: editCategory }) // Sending selected categories as category_names
      });
      if (res.ok) {
        setChatLogs(prev => prev.map(log => log.id === id ? { ...log, category: editCategory } : log));
        setEditCategory([]); // Clear selected categories after updating
        setEditId(null); // Reset the editing mode
      } else {
        const errorData = await res.json();
        console.error("Error:", errorData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSubcategory = async (id) => {
    const token = currentUser?.token || localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/chatlogs/${id}/update-subcategory/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subcategory_names: editSubcategory }) // Sending selected subcategories as subcategory_names
      });
      if (res.ok) {
        setChatLogs(prev => prev.map(log => log.id === id ? { ...log, subcategory: editSubcategory } : log));
        setEditSubcategory([]); // Clear selected subcategories after updating
        setEditId(null); // Reset the editing mode
      } else {
        const errorData = await res.json();
        console.error("Error:", errorData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  const toggleFilters = () => setShowFilters(prev => !prev);

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredChatLogs.map(log => {
        const ts = new Date(log.timestamp);
        const date = `${ts.getDate().toString().padStart(2, '0')}-${(ts.getMonth() + 1).toString().padStart(2, '0')}-${ts.getFullYear()}`;
        const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          User: log.user,
          Question: log.question,
          Answer: log.gpt_answer,
          Date: date,
          Category: log.category.name || '',
          Time: time
        };
      })
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chat Logs');
    XLSX.writeFile(workbook, 'ChatLogs.xlsx');
  };

  const filteredChatLogs = chatLogs.filter(log => {
    if (log.is_correct !== null) return false;

    const ts = new Date(log.timestamp);
    const date = `${ts.getFullYear()}-${(ts.getMonth() + 1).toString().padStart(2, '0')}-${ts.getDate().toString().padStart(2, '0')}`;
    const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const username = (log.user || '').toString();

    const matchesCategory = filters.category.length === 0 || filters.category.includes('All') || filters.category.some(fcat =>
      (log.category || []).includes(fcat)
    );

    const matchesSubcategory = filters.subcategory.length === 0 || filters.subcategory.includes('All') || filters.subcategory.some(fsub =>
      (log.subcategory || []).includes(fsub)
    );

    return (
      username.toLowerCase().includes(filters.user.toLowerCase()) &&
      (log.question || '').toLowerCase().includes(filters.question.toLowerCase()) &&
      (log.gpt_answer || '').toLowerCase().includes(filters.answer.toLowerCase()) &&
      date.includes(filters.date) &&
      matchesCategory &&
      matchesSubcategory &&
      time.includes(filters.time)
    );
  });

  return (
    <div className="bg-blue-900 p-4">
      <div className="mx-auto border bg-blue-100 shadow-md rounded-lg p-2" style={{ width: '100%' }}>
        <div className="w-full flex justify-center">
          <h1 className="text-xl font-bold text-blue-900">Sales Feedback Panel</h1>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Chat Logs</h2>
            <div className="flex space-x-2">
              <button onClick={toggleFilters} className="bg-blue-900 text-white rounded-full p-2 hover:bg-blue-700" style={{ width: '30px', height: '30px' }}>
                <IoFilter size={16} />
              </button>
              <button onClick={handleDownloadExcel} className="bg-blue-900 text-white rounded-full p-2 hover:bg-blue-700" style={{ width: '30px', height: '30px' }}>
                <MdSimCardDownload size={16} />
              </button>
              <button onClick={() => navigate('/dashboard')} className="bg-blue-900 text-white rounded-full p-2 hover:bg-blue-700" style={{ width: '30px', height: '30px' }}>
                <IoBarChart size={16} />
              </button>
            </div>
          </div>

          {showFilters && (
            <table className="table-auto w-full text-sm border-collapse border border-gray-300 mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">User
                    <select className="w-full mt-1 px-2 py-1 border rounded" value={filters.user} onChange={e => handleFilterChange('user', e.target.value)}>
                      <option value="">All</option>
                      {[...new Set(chatLogs.map(log => typeof log.user === 'string' ? log.user : ''))]
                        .filter(u => u)
                        .map((u, i) => <option key={i} value={u.name}>{u.name}</option>)}
                    </select>
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Question
                    <input type="text" placeholder="Filter" className="w-full mt-1 px-2 py-1 border rounded" value={filters.question} onChange={e => handleFilterChange('question', e.target.value)} />
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Answer
                    <input type="text" placeholder="Filter" className="w-full mt-1 px-2 py-1 border rounded" value={filters.answer} onChange={e => handleFilterChange('answer', e.target.value)} />
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Date
                    <input type="date" className="w-full mt-1 px-2 py-1 border rounded" value={filters.date} onChange={e => handleFilterChange('date', e.target.value)} />
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Category
                    <select
                      multiple
                      className="w-full mt-1 px-2 py-1 border rounded"
                      value={filters.category}
                      onChange={(e) => {
                        const options = Array.from(e.target.options);
                        const selected = options.filter(opt => opt.selected).map(opt => opt.value);
                        const allCategories = [...new Set(chatLogs.flatMap(log => log.category || []))];

                        if (selected.includes('All')) {
                          handleFilterChange('category', filters.category.includes('All') ? [] : ['All', ...allCategories]);
                        } else {
                          handleFilterChange('category', selected);
                        }
                      }}
                    >
                      <option value="All">All</option>
                      {[...new Set(chatLogs.flatMap(log => log.category || []))].map((cat, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Sub Category
                    <select
                      multiple
                      className="w-full mt-1 px-2 py-1 border rounded"
                      value={filters.subcategory}
                      onChange={(e) => {
                        const options = Array.from(e.target.options);
                        const selected = options.filter(opt => opt.selected).map(opt => opt.value);
                        const allSubcategories = [...new Set(chatLogs.flatMap(log => log.subcategory || []))];

                        if (selected.includes('All')) {
                          handleFilterChange('subcategory', filters.subcategory.includes('All') ? [] : ['All', ...allSubcategories]);
                        } else {
                          handleFilterChange('subcategory', selected);
                        }
                      }}
                    >
                      <option value="All">All</option>
                      {[...new Set(chatLogs.flatMap(log => log.subcategory || []))].map((subcat, i) => (
                        <option key={i} value={subcat}>{subcat}</option>
                      ))}
                    </select>
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Time
                    <input type="time" className="w-full mt-1 px-2 py-1 border rounded" value={filters.time} onChange={e => handleFilterChange('time', e.target.value)} />
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
                <th className="border border-gray-300 px-4 py-2">Category</th>
                <th className="border border-gray-300 px-4 py-2">Sub Category</th>
                <th className="border border-gray-300 px-4 py-2">Time</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChatLogs.map(log => {
                const ts = new Date(log.timestamp);
                const date = `${ts.getDate().toString().padStart(2, '0')}-${(ts.getMonth() + 1).toString().padStart(2, '0')}-${ts.getFullYear()}`;
                const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isEditingAnswer = editId === log.id;
                const isEditingCategory = editCategory === log.category;
                const isEditingSubcategory = editSubcategory === log.subcategory;

                return (
                  <tr key={log.id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2">{log.user}</td>
                    <td className="border border-gray-300 px-2 py-2">{log.question}</td>
                    <td className="border flex justify-between border-gray-300 px-2 py-2">
                      {isEditingAnswer ? (
                        <input type="text" value={editAnswer} onChange={e => setEditAnswer(e.target.value)} className="w-11/12 px-2 py-1 border rounded" />
                      ) : (
                        <div style={{ width: '85%', textAlign: 'justify' }}>{log.gpt_answer}</div>
                      )}
                      <button onClick={() => isEditingAnswer ? handleUpdateFeedback(log.id) : (setEditId(log.id), setEditAnswer(log.gpt_answer))} className="ml-2 bg-blue-900 text-white rounded-full p-2 hover:bg-blue-700" style={{ width: '30px', height: '30px' }}>
                        {isEditingAnswer ? <FaCheck size={16} /> : <FaPencilAlt size={16} />}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 whitespace-nowrap">{date}</td>
                    <td className="border border-gray-300 px-2 py-2">
                      {isEditingCategory ? (
                        <select
                          multiple
                          value={editCategory}
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                            setEditCategory(selectedOptions); // Update the state with selected values
                          }}
                          className="w-11/12 px-2 py-1 border rounded float-right"
                        >
                          <option value="All">All</option>
                          {[...new Set(chatLogs.flatMap(log => log.category || []))].map((cat, i) => (
                            <option key={i} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ width: '85%', textAlign: 'justify' }}>{log.category.join(', ')}</div>
                      )}
                      <button onClick={() => isEditingCategory ? handleUpdateCategory(log.id) : setEditCategory(log.category)} className="ml-2 bg-blue-900 text-white rounded-full p-2 hover:bg-blue-700 float-right" style={{ width: '30px', height: '30px' }}>
                        {isEditingCategory ? <FaCheck size={16} /> : <FaPencilAlt size={16} />}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      {isEditingSubcategory ? (
                        <select
                          multiple
                          value={editSubcategory}
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                            setEditSubcategory(selectedOptions); // Update the state with selected values
                          }}
                          className="w-11/12 px-2 py-1 border rounded float-right"
                        >
                          <option value="All">All</option>
                          {[...new Set(chatLogs.flatMap(log => log.subcategory || []))].map((subcat, i) => (
                            <option key={i} value={subcat}>{subcat}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ width: '85%', textAlign: 'justify' }}>{log.subcategory.join(', ')}</div>
                      )}
                      <button onClick={() => isEditingSubcategory ? handleUpdateSubcategory(log.id) : setEditSubcategory(log.subcategory)} className="ml-2 bg-blue-900 text-white rounded-full p-2 hover:bg-blue-700 float-right" style={{ width: '30px', height: '30px' }}>
                        {isEditingSubcategory ? <FaCheck size={16} /> : <FaPencilAlt size={16} />}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">{time}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button onClick={() => handleUpdateFeedback(log.id)} className="bg-green-500 px-3 py-1 rounded-full text-white hover:bg-green-600">
                        <FaCheck size={12} />
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
