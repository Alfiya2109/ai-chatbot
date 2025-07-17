import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { FaPlus, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const ProfileTab = ({ profiles, handleEditProfile, handleDeleteProfile, handleCreateProfile, profileModalOpen, setProfileModalOpen, editingProfile, profileForm, setProfileForm, handleProfileFormSubmit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  // Dropdown filter state
  const [showProfileFilter, setShowProfileFilter] = useState(false);
  const [selectedProfileFilter, setSelectedProfileFilter] = useState([]);
  const [showPermFilter, setShowPermFilter] = useState(false);
  const [selectedPermFilter, setSelectedPermFilter] = useState([]);

  // Unique options for each filter
  const profileNameOptions = useMemo(() => Array.from(new Set(profiles.map(p => p.name))).map(name => ({ value: name, label: name })), [profiles]);
  const permOptions = useMemo(() => {
    const allPerms = [
      { key: 'files_access', label: 'Files' },
      { key: 'text_access', label: 'Text' },
      { key: 'excel_access', label: 'Excel' },
      { key: 'qna_access', label: 'Q&A' },
      { key: 'url_access', label: 'URL' },
      { key: 'chat_history_access', label: 'Chat History' },
      { key: 'user_profile_access', label: 'Profile' },
      { key: 'user_details_access', label: 'User Details' },
    ];
    // Only show permissions that exist in at least one profile
    const permsSet = new Set();
    profiles.forEach(profile => {
      allPerms.forEach(perm => { if (profile[perm.key]) permsSet.add(perm.label); });
    });
    return Array.from(permsSet).map(label => ({ value: label, label }));
  }, [profiles]);

  // Filter logic
  const filteredProfiles = useMemo(() => {
    let filtered = profiles;
    if (selectedProfileFilter.length > 0) {
      filtered = filtered.filter(profile => selectedProfileFilter.includes(profile.name));
    }
    if (selectedPermFilter.length > 0) {
      filtered = filtered.filter(profile => {
        const perms = [
          { key: 'files_access', label: 'Files' },
          { key: 'text_access', label: 'Text' },
          { key: 'excel_access', label: 'Excel' },
          { key: 'qna_access', label: 'Q&A' },
          { key: 'url_access', label: 'URL' },
          { key: 'chat_history_access', label: 'Chat History' },
          { key: 'user_profile_access', label: 'Profile' },
          { key: 'user_details_access', label: 'User Details' },
        ].filter(perm => profile[perm.key]).map(perm => perm.label);
        return perms.some(label => selectedPermFilter.includes(label));
      });
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(profile => {
        if (profile.name.toLowerCase().includes(term)) return true;
        const accessKeys = [
          'files_access', 'text_access', 'excel_access', 'qna_access', 
          'url_access', 'chat_history_access', 'user_profile_access', 'user_details_access'
        ];
        for (const key of accessKeys) {
          const accessName = key.replace('_access', '').replace('_', ' ');
          if (profile[key] && accessName.includes(term)) return true;
        }
        return false;
      });
    }
    return filtered;
  }, [profiles, searchTerm, selectedProfileFilter, selectedPermFilter]);

  const sortedProfiles = useMemo(() => {
    let filtered = filteredProfiles;
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = '';
        let bValue = '';
        switch (sortField) {
          case 'name':
            aValue = (a.name || '').toLowerCase();
            bValue = (b.name || '').toLowerCase();
            break;
          case 'permissions':
            const getPerms = (profile) => [
              { key: 'files_access', label: 'Files' },
              { key: 'text_access', label: 'Text' },
              { key: 'excel_access', label: 'Excel' },
              { key: 'qna_access', label: 'Q&A' },
              { key: 'url_access', label: 'URL' },
              { key: 'chat_history_access', label: 'Chat History' },
              { key: 'user_profile_access', label: 'Profile' },
              { key: 'user_details_access', label: 'User Details' },
            ].filter(perm => profile[perm.key]).map(perm => perm.label).join(', ').toLowerCase();
            aValue = getPerms(a);
            bValue = getPerms(b);
            break;
          default:
            return 0;
        }
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }
    return filtered;
  }, [filteredProfiles, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
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

  // Download Excel logic (same as FileListTab)
  const handleDownloadExcel = () => {
    const data = filteredProfiles.map(profile => ({
      'Profile Name': profile.name || '-',
      'Access Permissions': [
        profile.files_access ? 'Files' : null,
        profile.text_access ? 'Text' : null,
        profile.excel_access ? 'Excel' : null,
        profile.qna_access ? 'Q&A' : null,
        profile.url_access ? 'URL' : null,
        profile.chat_history_access ? 'Chat History' : null,
        profile.user_profile_access ? 'Profile' : null,
        profile.user_details_access ? 'User Details' : null
      ].filter(Boolean).join(', ')
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Profiles');
    XLSX.writeFile(workbook, 'profile_access.xlsx');
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
        <h3 className="text-2xl font-bold text-gray-800">Profile Access Table</h3>
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
            onClick={handleCreateProfile}
            title="Create New Profile"
            aria-label="Create New Profile"
          >
            <FaPlus />
          </button>
        </div>
      </div>
      {/* Add more gap below top bar */}
      <div className="mt-4 mb-5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search profiles by name or access permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        {/* Row Count Display */}
        <div className="mt-2 text-sm text-gray-700">
          {filteredProfiles.length === profiles.length
            ? `Total profiles: ${profiles.length}`
            : `Showing ${filteredProfiles.length} of ${profiles.length} profiles`}
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredProfiles.length} of {profiles.length} profiles
          </p>
        )}
      </div>

    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-600 text-white ">
          <tr>
            <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
              <div className="flex items-center space-x-1">
                <span>Profile</span>
                {getSortIcon('name')}
                <button
                  type="button"
                  className="ml-1 focus:outline-none"
                  onClick={e => {e.stopPropagation(); setShowPermFilter(false); setShowProfileFilter(prev => !prev);}}
                  title="Filter Profile Name"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              {showProfileFilter && (
                <div style={{ position: 'relative', zIndex: 9999 }}>
                  <button type="button"
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                    style={{ padding: '2px', borderRadius: '50%' }}
                    onClick={() => setShowProfileFilter(false)} title="Close">✖</button>
                  <Select
                    isMulti
                    isSearchable
                    options={profileNameOptions}
                    value={selectedProfileFilter.map(val => ({ value: val, label: val }))}
                    onChange={selected => setSelectedProfileFilter(selected ? selected.map(s => s.value) : [])}
                    classNamePrefix="react-select"
                    placeholder="Filter Profile Name..."
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
            <th className="relative px-4 py-3 text-left font-semibold text-white hover:text-black cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('permissions')}>
              <div className="flex items-center space-x-1">
                <span>Access Permissions</span>
                {getSortIcon('permissions')}
                <button
                  type="button"
                  className="ml-1 focus:outline-none"
                  onClick={e => {e.stopPropagation(); setShowProfileFilter(false); setShowPermFilter(prev => !prev);}}
                  title="Filter Access Permissions"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              {showPermFilter && (
                <div style={{ position: 'relative', zIndex: 9999 }}>
                  <button type="button"
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-50 bg-white"
                    style={{ padding: '2px', borderRadius: '50%' }}
                    onClick={() => setShowPermFilter(false)} title="Close">✖</button>
                  <Select
                    isMulti
                    isSearchable
                    options={permOptions}
                    value={selectedPermFilter.map(val => ({ value: val, label: val }))}
                    onChange={selected => setSelectedPermFilter(selected ? selected.map(s => s.value) : [])}
                    classNamePrefix="react-select"
                    placeholder="Filter Access Permissions..."
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
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedProfiles.length > 0 ? (
            sortedProfiles.map((profile, idx) => {
              const permissions = [
                { key: 'files_access', label: 'Files' },
                { key: 'text_access', label: 'Text' },
                { key: 'excel_access', label: 'Excel' },
                { key: 'qna_access', label: 'Q&A' },
                { key: 'url_access', label: 'URL' },
                { key: 'chat_history_access', label: 'Chat History' },
                { key: 'user_profile_access', label: 'Profile' },
                { key: 'user_details_access', label: 'User Details' },
              ].filter(perm => profile[perm.key]).map(perm => perm.label);

              return (
                <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{profile.name}</td>
                  <td className="px-4 py-3">
                    {permissions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {permissions.map((perm, index) => (
                          <span
                            key={index}
                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                      onClick={() => handleEditProfile(profile)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                      onClick={() => handleDeleteProfile(profile.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="3" className="text-center py-4 text-gray-500">
                {searchTerm ? 'No profiles found matching your search.' : 'No profiles available.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    {/* Profile Modal */}
    {profileModalOpen && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setProfileModalOpen(false)}>
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-semibold mb-4">{editingProfile ? 'Edit Profile' : 'Create New Profile'}</h2>
          <form onSubmit={handleProfileFormSubmit} className="space-y-3 text-sm">
            <div>
              <label className="block mb-1 font-medium">Profile Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full p-2 border rounded"
                disabled={!!editingProfile}
              />
            </div>
            {/* Access toggles: if editingProfile is admin, all on and disabled */}
            <div className="grid grid-cols-2 gap-2">
              { [
                { key: 'files_access', label: 'Files' },
                { key: 'text_access', label: 'Text' },
                { key: 'excel_access', label: 'Excel' },
                { key: 'qna_access', label: 'Q&A' },
                { key: 'url_access', label: 'URL' },
                { key: 'chat_history_access', label: 'Chatbot History' },
                { key: 'user_profile_access', label: 'Profile' },
                { key: 'user_details_access', label: 'User Details' },
              ].map(({ key, label }) => {
                const isAdmin = editingProfile && editingProfile.name.toLowerCase() === 'admin';
                const checked = isAdmin ? true : profileForm[key];
                return (
                  <label key={key} className="flex items-center cursor-pointer select-none">
                    <span className="mr-2">{label}</span>
                    <span className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={e => setProfileForm({ ...profileForm, [key]: e.target.checked })}
                        disabled={isAdmin}
                      />
                      <span
                        className={`block w-10 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-green-500' : 'bg-gray-300'} ${isAdmin ? 'opacity-60' : ''}`}
                      ></span>
                      <span
                        className={`dot absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition transform duration-200 ${checked ? 'translate-x-4' : ''}`}
                      ></span>
                    </span>
                  </label>
                );
              }) }
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => { setProfileModalOpen(false); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">{editingProfile ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
};

export default ProfileTab;
