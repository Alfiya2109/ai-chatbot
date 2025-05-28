import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { IoFilter, IoBarChart } from 'react-icons/io5';
import { FaPencilAlt, FaCheck } from 'react-icons/fa';
import { MdSimCardDownload } from 'react-icons/md';
import Multiselect from 'multiselect-react-dropdown';
import { BASE_URL } from '../base_url';

const API_BASE_URL = BASE_URL;

function Config() {
  const [editId, setEditId] = useState(null);
  const [editAnswer, setEditAnswer] = useState('');
  const [editCategory, setEditCategory] = useState([]);
  const [editSubcategory, setEditSubcategory] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [filters, setFilters] = useState({
    user: '',
    question: '',
    answer: '',
    startDate: '',
    endDate: '',
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
      fetchChatLogs();
    }
  }, [currentUser]);

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

  const handleCategoryChange = (selectedList) => {
    const allCategories = [...new Set(chatLogs.flatMap(log => log.category || []))];
    if (selectedList.some(item => item === 'All')) {
      handleFilterChange('category', filters.category.includes('All') ? [] : ['All', ...allCategories]);
    } else {
      handleFilterChange('category', selectedList);
    }
  };

  const handleSubcategoryChange = (selectedList) => {
    const allSubcategories = [...new Set(chatLogs.flatMap(log => log.subcategory || []))];
    if (selectedList.some(item => item === 'All')) {
      handleFilterChange('subcategory', filters.subcategory.includes('All') ? [] : ['All', ...allSubcategories]);
    } else {
      handleFilterChange('subcategory', selectedList);
    }
  };

  const handleEditCategoryChange = (selectedList) => {
    setEditCategory(selectedList);
  };

  const handleEditSubcategoryChange = (selectedList) => {
    setEditSubcategory(selectedList);
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

    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;

    // Check if log timestamp falls within the date range if set
    const isWithinDateRange =
      (!startDate || ts >= startDate) &&
      (!endDate || ts <= endDate);

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
      isWithinDateRange &&
      matchesCategory &&
      matchesSubcategory &&
      time.includes(filters.time)
    );
  });


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-8 px-2">
      <div className="w-full max-w-7xl bg-white rounded-xl shadow-lg p-2">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Configuration</h2>
        <div>
          <div className="flex justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Chat Logs</h2>
            <div className="flex space-x-2">
              <button onClick={toggleFilters} className="bg-gray-500 text-white rounded-full p-2 hover:bg-gray-500" style={{ width: '30px', height: '30px' }}>
                <IoFilter size={16} />
              </button>
              <button onClick={handleDownloadExcel} className="bg-gray-500 text-white rounded-full p-2 hover:bg-gray-500" style={{ width: '30px', height: '30px' }}>
                <MdSimCardDownload size={16} />
              </button>
              <button onClick={() => navigate('/dashboard')} className="bg-gray-500 text-white rounded-full p-2 hover:bg-gray-500" style={{ width: '30px', height: '30px' }}>
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
                  <th className="border border-gray-300 px-4 py-2">Date Range
                  <div className="flex space-x-1">
                    <input
                      type="date"
                      className="w-1/2 mt-1 px-2 py-1 border rounded"
                      value={filters.startDate}
                      onChange={e => handleFilterChange('startDate', e.target.value)}
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      className="w-1/2 mt-1 px-2 py-1 border rounded"
                      value={filters.endDate}
                      onChange={e => handleFilterChange('endDate', e.target.value)}
                      placeholder="End Date"
                    />
                  </div>
                </th>

                  <th className="border border-gray-300 px-4 py-2">Category
                    <Multiselect
                      options={["All", ...new Set(chatLogs.flatMap(log => log.category || []))]}
                      selectedValues={filters.category}
                      onSelect={handleCategoryChange}
                      onRemove={handleCategoryChange}
                      isObject={false}
                      placeholder="Categories"
                      className="w-full mt-1 px-2 py-1 border rounded"
                    />
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Sub Category
                    <Multiselect
                      options={["All", ...new Set(chatLogs.flatMap(log => log.subcategory || []))]}
                      selectedValues={filters.subcategory}
                      onSelect={handleSubcategoryChange}
                      onRemove={handleSubcategoryChange}
                      isObject={false}
                      placeholder="Subcategories"
                      className="w-full mt-1 px-2 py-1 border rounded"
                    />
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Time
                    <input type="time" className="w-full mt-1 px-2 py-1 border rounded" value={filters.time} onChange={e => handleFilterChange('time', e.target.value)} />
                  </th>
                </tr>
              </thead>
            </table>
          )}

          <table className="table-auto w-full text-xs border-collapse border border-gray-300">
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '45%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '4%' }} />
              <col style={{ width: '2%' }} />
              <col style={{ width: '2%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">User</th>
                <th className="border border-gray-300 px-4 py-2">Title</th>
                <th className="border border-gray-300 px-4 py-2">Question</th>
                <th className="border border-gray-300 px-4 py-2">Answer</th>
                <th className="border border-gray-300 px-4 py-2">Date</th>
                <th className="border border-gray-300 px-4 py-2">Category</th>
                <th className="border border-gray-300 px-4 py-2">Sub Category</th>
                <th className="border border-gray-300 px-4 py-2">Time</th>
                <th className="border border-gray-300 px-4 py-2">Tokens</th>
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
                // Extract user info
                let userDisplay = '';
                if (log.user && typeof log.user === 'object') {
                  const { first_name, last_name, title } = log.user;
                  userDisplay = `${first_name || ''} ${last_name || ''}${title ? ` (${title})` : ''}`.trim();
                } else if (typeof log.user === 'string') {
                  userDisplay = log.user;
                }

                return (
                  <tr key={log.id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2">{userDisplay}</td>
                    <td className="border border-gray-300 px-2 py-2">{log.session_title || ''}</td>
                    <td className="border border-gray-300 px-2 py-2">{log.question}</td>
                    <td className="border flex items-center border-gray-300 px-2 py-2">
                      {isEditingAnswer ? (
                        <input type="text" value={editAnswer} onChange={e => setEditAnswer(e.target.value)} className="w-10/12 px-2 py-1 border rounded" />
                      ) : (
                        <div style={{ width: '90%', textAlign: 'justify' }}>{log.gpt_answer}</div>
                      )}
                      <button onClick={() => isEditingAnswer ? handleUpdateFeedback(log.id) : (setEditId(log.id), setEditAnswer(log.gpt_answer))} className="ml-1 bg-gray-500 text-white rounded-full p-2 hover:bg-gray-500" style={{ width: '30px', height: '30px', alignSelf: 'center' }}>
                        {isEditingAnswer ? <FaCheck size={16} /> : <FaPencilAlt size={16} />}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 whitespace-nowrap">{date}</td>
                    <td className="border border-gray-300 px-2 py-2">
                      {isEditingCategory ? (
                        <Multiselect
                          options={["All", ...new Set(chatLogs.flatMap(log => log.category || []))]}
                          selectedValues={editCategory}
                          onSelect={handleEditCategoryChange}
                          onRemove={handleEditCategoryChange}
                          isObject={false}
                          placeholder="Edit Categories"
                          className="w-11/12 px-2 py-1 border rounded float-right"
                        />
                      ) : (
                        <div style={{ width: '85%', textAlign: 'justify' }}>{log.category.join(', ')}</div>
                      )}
                      <button onClick={() => isEditingCategory ? handleUpdateCategory(log.id) : setEditCategory(log.category)} className="ml-2 bg-gray-500 text-white rounded-full p-2 hover:bg-gray-500 float-right" style={{ width: '30px', height: '30px' }}>
                        {isEditingCategory ? <FaCheck size={16} /> : <FaPencilAlt size={16} />}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      {isEditingSubcategory ? (
                        <Multiselect
                          options={["All", ...new Set(chatLogs.flatMap(log => log.subcategory || []))]}
                          selectedValues={editSubcategory}
                          onSelect={handleEditSubcategoryChange}
                          onRemove={handleEditSubcategoryChange}
                          isObject={false}
                          placeholder="Edit Subcategories"
                          className="w-11/12 px-2 py-1 border rounded float-right"
                        />
                      ) : (
                        <div style={{ width: '85%', textAlign: 'justify' }}>{log.subcategory.join(', ')}</div>
                      )}
                      <button onClick={() => isEditingSubcategory ? handleUpdateSubcategory(log.id) : setEditSubcategory(log.subcategory)} className="ml-2 bg-gray-500 text-white rounded-full p-2 hover:bg-gray-500 float-right" style={{ width: '30px', height: '30px' }}>
                        {isEditingSubcategory ? <FaCheck size={16} /> : <FaPencilAlt size={16} />}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center whitespace-nowrap">{time}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{log.tokens ?? ''}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button onClick={() => handleUpdateFeedback(log.id)} className="bg-gray-500 px-2 py-2 rounded-full text-white hover:bg-green-600">
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
