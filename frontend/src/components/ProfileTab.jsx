import React from 'react';

const ProfileTab = ({ profiles, handleEditProfile, handleCreateProfile, profileModalOpen, setProfileModalOpen, editingProfile, profileForm, setProfileForm, handleProfileFormSubmit }) => (
  <div className="mt-6 w-full max-w-2xl mx-auto">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">Profile Access Table</h3>
      <button
        className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
        onClick={handleCreateProfile}
      >
        Create New Profile
      </button>
    </div>
    <table className="min-w-full border text-sm">
      <thead>
        <tr>
          <th className="border px-4 py-2 bg-gray-100 text-left">Profile</th>
          <th className="border px-4 py-2 bg-gray-100 text-left">Access</th>
        </tr>
      </thead>
      <tbody>
        {profiles.map((profile) => (
          <tr key={profile.id}>
            <td className="border px-4 py-2">{profile.name}</td>
            <td className="border px-4 py-2">
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded"
                onClick={() => handleEditProfile(profile)}
              >
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
                { key: 'chat_history_access', label: 'Chat History' },
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

export default ProfileTab;
