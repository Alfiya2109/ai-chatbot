import React, { useState, useMemo } from 'react';

const ProfileTab = ({ profiles, handleEditProfile, handleDeleteProfile, handleCreateProfile, profileModalOpen, setProfileModalOpen, editingProfile, profileForm, setProfileForm, handleProfileFormSubmit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter profiles based on search term
  const filteredProfiles = useMemo(() => {
    if (!searchTerm) return profiles;
    
    const term = searchTerm.toLowerCase();
    return profiles.filter(profile => {
      // Search in profile name
      if (profile.name.toLowerCase().includes(term)) return true;
      
      // Search in access permissions
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
  }, [profiles, searchTerm]);

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
        <svg className="w-4 h-4 text-blue-600 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-blue-600 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  return (
  <div className="bg-white rounded-xl shadow-lg p-6 mt-4 w-full mx-auto">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">Profile Access Table</h3>
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
        onClick={handleCreateProfile}
        title="Create New Profile"
        aria-label="Create New Profile"
      >
        +
      </button>
    </div>
    
    {/* Search Filter */}
    <div className="mb-4">
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
      {searchTerm && (
        <p className="mt-2 text-sm text-gray-600">
          Showing {filteredProfiles.length} of {profiles.length} profiles
        </p>
      )}
    </div>

    <div className="bg-white rounded-lg shadow p-4">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}>
              <div className="flex items-center space-x-1">
                <span>Profile</span>
                {getSortIcon('name')}
              </div>
            </th>
            <th className="px-3 py-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('permissions')}>
              <div className="flex items-center space-x-1">
                <span>Access Permissions</span>
                {getSortIcon('permissions')}
              </div>
            </th>
            <th className="px-3 py-2 text-left">Actions</th>
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
                <tr key={profile.id} className="border-b">
                  <td className="px-3 py-2 font-medium">{profile.name}</td>
                  <td className="px-3 py-2">
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
                  <td className="px-3 py-2 flex gap-2">
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
