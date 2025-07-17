import React, { useState, useMemo } from 'react';
import { BASE_URL } from '../base_url';
import Select from 'react-select';
import { FaPlus, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const isValidUser = (user) => {
  return (
    user &&
    typeof user === 'object' &&
    typeof user.first_name === 'string' &&
    typeof user.last_name === 'string' &&
    typeof user.phone_number === 'string' &&
    typeof user.email === 'string' &&
    typeof user.created_at === 'string'
  );
};

const UserDetailsTab = ({
  users, userSearch, setUserSearch, onAddUser, modalOpen, setModalOpen,
  handleRegisterSalesUser, registerForm, setRegisterForm, registerFormError,
  knowledgeBases, profiles, onRefreshUsers
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editProfile, setEditProfile] = useState('');
  const [editKnowledgeBases, setEditKnowledgeBases] = useState([]);
  const [editError, setEditError] = useState('');
  // Sorting state
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  // Filter dropdown state
  const [showFirstNameFilter, setShowFirstNameFilter] = useState(false);
  const [selectedFirstNameFilter, setSelectedFirstNameFilter] = useState([]);
  const [showLastNameFilter, setShowLastNameFilter] = useState(false);
  const [selectedLastNameFilter, setSelectedLastNameFilter] = useState([]);
  const [showPhoneFilter, setShowPhoneFilter] = useState(false);
  const [selectedPhoneFilter, setSelectedPhoneFilter] = useState([]);
  const [showEmailFilter, setShowEmailFilter] = useState(false);
  const [selectedEmailFilter, setSelectedEmailFilter] = useState([]);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState([]);
  const [showProfileFilter, setShowProfileFilter] = useState(false);
  const [selectedProfileFilter, setSelectedProfileFilter] = useState([]);
  const [showKBFilter, setShowKBFilter] = useState(false);
  const [selectedKBFilter, setSelectedKBFilter] = useState([]);

  // Unique options for each filter
  const firstNameOptions = useMemo(() => Array.from(new Set(users.map(u => u.first_name))).map(name => ({ value: name, label: name })), [users]);
  const lastNameOptions = useMemo(() => Array.from(new Set(users.map(u => u.last_name))).map(name => ({ value: name, label: name })), [users]);
  const phoneOptions = useMemo(() => Array.from(new Set(users.map(u => u.phone_number))).map(phone => ({ value: phone, label: phone })), [users]);
  const emailOptions = useMemo(() => Array.from(new Set(users.map(u => u.email))).map(email => ({ value: email, label: email })), [users]);
  const dateOptions = useMemo(() => Array.from(new Set(users.map(u => new Date(u.created_at).toLocaleDateString()))).map(date => ({ value: date, label: date })), [users]);
  const profileOptions = useMemo(() => Array.from(new Set(users.map(u => u.profile_name || ''))).filter(Boolean).map(profile => ({ value: profile, label: profile })), [users]);
  const kbOptions = useMemo(() => Array.from(new Set(users.flatMap(u => (Array.isArray(u.knowledge_bases) ? u.knowledge_bases.map(kb => typeof kb === 'string' ? kb : (kb.name || '')) : [])))).filter(Boolean).map(kb => ({ value: kb, label: kb })), [users]);

  if (!Array.isArray(users) || users.length === 0) {
    return <p className="text-gray-500">No users found.</p>;
  }

  // Filter logic
  let filteredUsers = users.filter((user) => {
    if (!isValidUser(user)) return false;
    let pass = true;
    if (selectedFirstNameFilter.length > 0) pass = pass && selectedFirstNameFilter.includes(user.first_name);
    if (selectedLastNameFilter.length > 0) pass = pass && selectedLastNameFilter.includes(user.last_name);
    if (selectedPhoneFilter.length > 0) pass = pass && selectedPhoneFilter.includes(user.phone_number);
    if (selectedEmailFilter.length > 0) pass = pass && selectedEmailFilter.includes(user.email);
    if (selectedDateFilter.length > 0) pass = pass && selectedDateFilter.includes(new Date(user.created_at).toLocaleDateString());
    if (selectedProfileFilter.length > 0) pass = pass && selectedProfileFilter.includes(user.profile_name);
    if (selectedKBFilter.length > 0) pass = pass && Array.isArray(user.knowledge_bases) && user.knowledge_bases.some(kb => selectedKBFilter.includes(typeof kb === 'string' ? kb : (kb.name || '')));
    // Text search (keep as fallback)
    if (userSearch) {
      const searchLower = userSearch.toLowerCase();
      pass = pass && (
        user.first_name.toLowerCase().includes(searchLower) ||
        user.last_name.toLowerCase().includes(searchLower) ||
        user.phone_number.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        new Date(user.created_at).toLocaleDateString().includes(searchLower)
      );
    }
    return pass;
  });

  // Sorting logic
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortColumn !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  filteredUsers = [...filteredUsers].sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];
    // For created_at, sort by date
    if (sortColumn === 'created_at') {
      valA = new Date(valA);
      valB = new Date(valB);
    } else {
      valA = valA ? valA.toString().toLowerCase() : '';
      valB = valB ? valB.toString().toLowerCase() : '';
    }
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const openEditModal = (user) => {
    // Always use userprofile id for PATCH, fallback to id if not present
    setEditUser({ ...user, id: user.userprofile_id || user.id });
    setEditProfile(user.profile || (user.profile_name ? (profiles.find(p => p.name === user.profile_name)?.id || '') : ''));
    setEditKnowledgeBases(Array.isArray(user.knowledge_bases) ? user.knowledge_bases.map(kb => (typeof kb === 'object' ? String(kb.id) : String(kb))) : []);
    setEditError('');
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editUser || !editUser.id) {
      setEditError('User ID is missing.');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/userprofiles/${editUser.id}/update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          profile: editProfile,
          knowledge_bases: editKnowledgeBases
        })
      });
      if (!res.ok) throw new Error('Failed to update user');
      setEditModalOpen(false);
      if (onRefreshUsers) onRefreshUsers();
      // Optionally, show a success message here
    } catch (err) {
      setEditError('Failed to update user.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const userId = user.userprofile_id || user.id;
        const res = await fetch(`${BASE_URL}/api/userprofiles/${userId}/update/`, {
          method: 'DELETE',
          headers:
          {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (!res.ok) throw new Error('Failed to delete user');
        if (onRefreshUsers) onRefreshUsers();
        alert('User deleted successfully!');
      } catch (err) {
        alert('Failed to delete user.');
      }
    }
  };

  // Download Excel logic (same as FileListTab)
  const handleDownloadExcel = () => {
    const data = filteredUsers.map(user => ({
      'First Name': user.first_name || '-',
      'Last Name': user.last_name || '-',
      'Phone': user.phone_number || '-',
      'Email': user.email || '-',
      'Created Date': user.created_at ? new Date(user.created_at).toLocaleDateString() : '-',
      'Profile': user.profile_name || '-',
      'Knowledge Bases': Array.isArray(user.knowledge_bases) ? user.knowledge_bases.map(kb => typeof kb === 'string' ? kb : kb.name).join(', ') : '-'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    XLSX.writeFile(workbook, 'user_details.xlsx');
  };

  return (
    <div className="mt-6 w-full">
      {/* Sticky Top Bar - same as FolderListTab and FileListTab */}
      <div
        className="top-0 z-40 shadow-md rounded-b-lg px-6 py-4 flex items-center justify-between mt-6 backdrop-blur-md"
        style={{
          minHeight: 80,
          WebkitBackdropFilter: "blur(8px)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e5e7eb"
        }}
      >
        <h3 className="text-2xl font-bold text-gray-800">User Details</h3>
        <div className="flex items-center gap-5 flex-wrap">
          <button
            className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 shadow flex items-center justify-center"
            title="Download Excel"
            aria-label="Download Excel"
            onClick={handleDownloadExcel}
          >
            <FaDownload />
          </button>
          <button
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow flex items-center justify-center"
            title="Add Sales User"
            aria-label="Add Sales User"
            onClick={() => setModalOpen(true)}
          >
            <FaPlus />
          </button>
        </div>
      </div>
      {/* Add more gap below top bar */}
      <div className="mt-4 mb-5 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Filter by Name, Phone, Email, or Date..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="p-2 border border-gray-300 rounded-md w-full max-w-xs"
        />
      </div>
      {/* Row Count Display */}
      <div className="mb-4 text-sm text-gray-700">
        {filteredUsers.length === users.length
          ? `Total users: ${users.length}`
          : `Showing ${filteredUsers.length} of ${users.length} users`}
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-600 text-white ">
            <tr>
              <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('first_name')}>
                <div className="flex items-center space-x-1">
                  <span>First Name</span>
                  {getSortIcon('first_name')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {e.stopPropagation(); setShowLastNameFilter(false); setShowPhoneFilter(false); setShowEmailFilter(false); setShowDateFilter(false); setShowProfileFilter(false); setShowKBFilter(false); setShowFirstNameFilter(prev => !prev);}}
                    title="Filter First Name"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showFirstNameFilter && (
                  <div style={{ position: 'relative', zIndex: 9999 }}>
                    <button type="button"
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                      style={{ padding: '2px', borderRadius: '50%' }}
                      onClick={() => setShowFirstNameFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={firstNameOptions}
                      value={selectedFirstNameFilter.map(val => ({ value: val, label: val }))}
                      onChange={selected => setSelectedFirstNameFilter(selected ? selected.map(s => s.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter First Name..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="relative px-3 py-2 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('last_name')}>
                <div className="flex items-center space-x-1">
                  <span>Last Name</span>
                  {getSortIcon('last_name')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {e.stopPropagation(); setShowFirstNameFilter(false); setShowPhoneFilter(false); setShowEmailFilter(false); setShowDateFilter(false); setShowProfileFilter(false); setShowKBFilter(false); setShowLastNameFilter(prev => !prev);}}
                    title="Filter Last Name"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showLastNameFilter && (
                  <div style={{ position: 'relative', zIndex: 9999 }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowLastNameFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={lastNameOptions}
                      value={selectedLastNameFilter.map(val => ({ value: val, label: val }))}
                      onChange={selected => setSelectedLastNameFilter(selected ? selected.map(s => s.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Last Name..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="relative px-3 py-2 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('phone_number')}>
                <div className="flex items-center space-x-1">
                  <span>Phone</span>
                  {getSortIcon('phone_number')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {e.stopPropagation(); setShowFirstNameFilter(false); setShowLastNameFilter(false); setShowEmailFilter(false); setShowDateFilter(false); setShowProfileFilter(false); setShowKBFilter(false); setShowPhoneFilter(prev => !prev);}}
                    title="Filter Phone"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showPhoneFilter && (
                  <div style={{ position: 'relative', zIndex: 9999 }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowPhoneFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={phoneOptions}
                      value={selectedPhoneFilter.map(val => ({ value: val, label: val }))}
                      onChange={selected => setSelectedPhoneFilter(selected ? selected.map(s => s.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Phone..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="relative px-3 py-2 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('email')}>
                <div className="flex items-center space-x-1">
                  <span>Email</span>
                  {getSortIcon('email')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {e.stopPropagation(); setShowFirstNameFilter(false); setShowLastNameFilter(false); setShowPhoneFilter(false); setShowDateFilter(false); setShowProfileFilter(false); setShowKBFilter(false); setShowEmailFilter(prev => !prev);}}
                    title="Filter Email"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showEmailFilter && (
                  <div style={{ position: 'relative', zIndex: 9999 }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowEmailFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={emailOptions}
                      value={selectedEmailFilter.map(val => ({ value: val, label: val }))}
                      onChange={selected => setSelectedEmailFilter(selected ? selected.map(s => s.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Email..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="relative px-3 py-2 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('created_at')}>
                <div className="flex items-center space-x-1">
                  <span>Created Date</span>
                  {getSortIcon('created_at')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {e.stopPropagation(); setShowFirstNameFilter(false); setShowLastNameFilter(false); setShowPhoneFilter(false); setShowEmailFilter(false); setShowProfileFilter(false); setShowKBFilter(false); setShowDateFilter(prev => !prev);}}
                    title="Filter Created Date"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showDateFilter && (
                  <div style={{ position: 'relative', zIndex: 9999 }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowDateFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={dateOptions}
                      value={selectedDateFilter.map(val => ({ value: val, label: val }))}
                      onChange={selected => setSelectedDateFilter(selected ? selected.map(s => s.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Created Date..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="relative px-3 py-2 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('profile_name')}>
                <div className="flex items-center space-x-1">
                  <span>Profile</span>
                  {getSortIcon('profile_name')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {e.stopPropagation(); setShowFirstNameFilter(false); setShowLastNameFilter(false); setShowPhoneFilter(false); setShowEmailFilter(false); setShowDateFilter(false); setShowKBFilter(false); setShowProfileFilter(prev => !prev);}}
                    title="Filter Profile"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showProfileFilter && (
                  <div style={{ position: 'relative', zIndex: 9999 }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowProfileFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={profileOptions}
                      value={selectedProfileFilter.map(val => ({ value: val, label: val }))}
                      onChange={selected => setSelectedProfileFilter(selected ? selected.map(s => s.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Profile..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="relative px-3 py-2 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('knowledge_bases')}>
                <div className="flex items-center space-x-1">
                  <span>Knowledge Bases</span>
                  {getSortIcon('knowledge_bases')}
                  <button
                    type="button"
                    className="ml-1 focus:outline-none"
                    onClick={e => {e.stopPropagation(); setShowFirstNameFilter(false); setShowLastNameFilter(false); setShowPhoneFilter(false); setShowEmailFilter(false); setShowDateFilter(false); setShowProfileFilter(false); setShowKBFilter(prev => !prev);}}
                    title="Filter Knowledge Bases"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {showKBFilter && (
                  <div style={{ position: 'relative', zIndex: 9999 }}>
                    <button type="button"
                      className="absolute top-2 right-2 z-50"
                      style={{ background: '#fff', padding: '2px', borderRadius: '50%', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px 0 rgba(60,72,88,0.10)', cursor: 'pointer' }}
                      onClick={() => setShowKBFilter(false)} title="Close">✖</button>
                    <Select
                      isMulti
                      isSearchable
                      options={kbOptions}
                      value={selectedKBFilter.map(val => ({ value: val, label: val }))}
                      onChange={selected => setSelectedKBFilter(selected ? selected.map(s => s.value) : [])}
                      classNamePrefix="react-select"
                      placeholder="Filter Knowledge Bases..."
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '12px',
                          borderColor: state.isFocused ? '#2563eb' : '#e5e7eb',
                          boxShadow: state.isFocused ? '0 0 0 2px #2563eb33' : '0 2px 8px 0 rgba(60,72,88,0.10)',
                          minHeight: '44px',
                          fontSize: '1rem',
                          background: '#f9fafb',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#2563eb22'
                            : state.isFocused
                            ? '#eff6ff'
                            : '#fff',
                          color: state.isSelected ? '#1d4ed8' : '#222',
                          fontWeight: state.isSelected ? 600 : 400,
                          borderRadius: '8px',
                          margin: '2px 4px',
                          padding: '10px 16px',
                          cursor: 'pointer',
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: '#dbeafe',
                          borderRadius: '8px',
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          fontWeight: 500,
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: '#1d4ed8',
                          ':hover': {
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px 0 rgba(60,72,88,0.18)',
                          zIndex: 9999,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af',
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#222',
                        }),
                      }}
                      autoFocus
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                )}
              </th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  {userSearch ? 'No users found matching your search.' : 'No users found.'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, idx) => {
                return (
                  <tr key={user.id || idx} className="border-b">
                    <td className="px-3 py-2">{user.first_name}</td>
                    <td className="px-3 py-2">{user.last_name}</td>
                    <td className="px-3 py-2">{user.phone_number}</td>
                    <td className="px-3 py-2">{user.email}</td>
                    <td className="px-3 py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{user.profile_name || ''}</td>
                    <td className="px-3 py-2">
                      {Array.isArray(user.knowledge_bases) && user.knowledge_bases.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.knowledge_bases.map((kb, kbIdx) => (
                            <span
                              key={kbIdx}
                              className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                            >
                              {typeof kb === 'string' ? kb : kb.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2 flex gap-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                        onClick={() => openEditModal(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                        onClick={() => handleDeleteUser(user)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* User Registration Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Register Sales User</h2>
            <form onSubmit={handleRegisterSalesUser} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">First Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={registerForm.first_name}
                  onChange={e => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Last Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={registerForm.last_name}
                  onChange={e => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={registerForm.phone_number}
                  onChange={e => setRegisterForm({ ...registerForm, phone_number: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  value={registerForm.password}
                  onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                <select
                  multiple
                  value={registerForm.knowledge_bases || []}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setRegisterForm({ ...registerForm, knowledge_bases: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases && knowledgeBases.map(kb => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              {registerFormError && <div className="text-red-500 text-xs">{registerFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {editModalOpen && editUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setEditModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Edit User Profile</h2>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">Profile</label>
                <select
                  value={editProfile || ''}
                  onChange={e => setEditProfile(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Profile</option>
                  {profiles && profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                <select
                  multiple
                  value={editKnowledgeBases}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setEditKnowledgeBases(options);
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases && knowledgeBases.map(kb => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              {editError && <div className="text-red-500 text-xs">{editError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="button" onClick={handleEditSave} className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailsTab;
