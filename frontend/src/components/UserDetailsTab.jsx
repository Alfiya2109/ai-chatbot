import React, { useState } from 'react';
import { BASE_URL } from '../base_url';

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

const UserDetailsTab = ({ users, userSearch, setUserSearch, onAddUser, modalOpen, setModalOpen, handleRegisterSalesUser, registerForm, setRegisterForm, registerFormError, knowledgeBases, profiles, onRefreshUsers }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editProfile, setEditProfile] = useState('');
  const [editKnowledgeBases, setEditKnowledgeBases] = useState([]);
  const [editError, setEditError] = useState('');

  if (!Array.isArray(users) || users.length === 0) {
    return <p className="text-gray-500">No users found.</p>;
  }

  // Ensure userSearch is always a string
  const searchLower = (userSearch || '').toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!isValidUser(user)) return false;
    return (
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.phone_number.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      new Date(user.created_at).toLocaleDateString().includes(searchLower)
    );
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
          headers: {
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-4 w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">User Details</h3>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
          title="Add Sales User"
          aria-label="Add Sales User"
          onClick={() => setModalOpen(true)}
        >
          +
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Filter by Name, Phone, Email, or Date..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="p-2 border border-gray-300 rounded-md w-full max-w-xs"
        />
      </div>
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1 bg-gray-100 text-left">First Name</th>
            <th className="border px-2 py-1 bg-gray-100 text-left">Last Name</th>
            <th className="border px-2 py-1 bg-gray-100 text-left">Phone</th>
            <th className="border px-2 py-1 bg-gray-100 text-left">Email</th>
            <th className="border px-2 py-1 bg-gray-100 text-left">Created Date</th>
            <th className="border px-2 py-1 bg-gray-100 text-left">Profile</th>
            <th className="border px-2 py-1 bg-gray-100 text-left">Knowledge Base</th>
            <th className="border px-2 py-1 bg-gray-100 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="8" className="border px-3 py-2 text-center text-gray-500">
                No matching users found.
              </td>
            </tr>
          ) : (
            filteredUsers.map((user, idx) => {
              // All property accesses are now safe due to isValidUser
              return (
                <tr key={user.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2">{user.first_name}</td>
                  <td className="border px-3 py-2">{user.last_name}</td>
                  <td className="border px-3 py-2">{user.phone_number}</td>
                  <td className="border px-3 py-2">{user.email}</td>
                  <td className="border px-3 py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="border px-3 py-2">{user.profile_name || ''}</td>
                  <td className="border px-3 py-2">{Array.isArray(user.knowledge_bases) ? user.knowledge_bases.map(kb => typeof kb === 'string' ? kb : kb.name).join(', ') : ''}</td>
                  <td className="border px-3 py-2 space-x-2">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
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
