import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';
import { BASE_URL } from '../base_url';
import { FaPlus } from 'react-icons/fa6';
import FileListTab from './FileListTab';
import TextListTab from './TextListTab';
import ExcelListTab from './ExcelListTab';
import QAListTab from './QAListTab';
import URLListTab from './URLListTab';
import ProfileTab from './ProfileTab';
import KnowledgeBaseTab from './KnowledgeBaseTab';
import CategoriesTab from './CategoriesTab';
import SubcategoriesTable from './SubcategoriesTable';
import UserDetailsTab from './UserDetailsTab';

// Define tab structure as per the provided image
const tabSections = [
  {
    label: 'setup',
    tabs: [ 'User Details', 'profile', 'Knowledge Base']
  },
  {
    label: 'source data',
    tabs: ['files', 'text', 'Excel/CSV', 'URL', 'Q&A']
  },
  {
    label: 'chat',
    tabs: ['chatbot', 'Chatbot History']
  },
  {
    label: 'Master',
    tabs: ['Categories', 'Subcategories']
  }
];

function CreateAgent() {
  // Modal state for file upload (must be at the very top, before any useEffect or function that uses it)
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileForm, setFileForm] = useState({
    file: null,
    description: '',
    knowledge_bases: [],
  });
  const [fileFormError, setFileFormError] = useState('');

  // Excel/CSV Modal state
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [excelForm, setExcelForm] = useState({
    file: null,
    description: '',
    knowledge_bases: [],
  });
  const [excelFormError, setExcelFormError] = useState('');

  // TextContent Modal state
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textForm, setTextForm] = useState({
    content: '',
    description: '',
    knowledge_bases: [],
  });
  const [textFormError, setTextFormError] = useState('');

  // Q&A Modal state
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [qaForm, setQaForm] = useState({
    question: '',
    answer: '',
    description: '',
    category: [],
    subcategory: [],
    knowledge_bases: [],
  });
  const [qaFormError, setQaFormError] = useState('');

  // Add URL Modal state
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlForm, setUrlForm] = useState({ url: '', description: '', knowledge_bases: [] });
  const [urlFormError, setUrlFormError] = useState('');

  const [activeTab, setActiveTab] = useState('Files');
  const [dragging, setDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedTexts, setUploadedTexts] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [qaData, setQaData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [urlList, setUrlList] = useState([]);
  const [users, setUsers] = useState([]); // For User Details tab
  const [userSearch, setUserSearch] = useState(''); // User search filter

  const [modalOpen, setModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone_number: '',
    password: '',
    profile: '', // Added profile field
  });

  // Profile Tab State
  const [profiles, setProfiles] = useState([]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    files_access: false,
    text_access: false,
    excel_access: false,
    qna_access: false,
    url_access: false,
    chat_history_access: false,
    user_profile_access: false, // NEW
    user_details_access: false, // NEW
  });

  // Knowledge Base State
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [kbModalOpen, setKbModalOpen] = useState(false);
  const [editingKb, setEditingKb] = useState(null);
  const [kbForm, setKbForm] = useState({ name: '' });

  // Add 'Categories', 'Subcategories', 'Chatbot', and 'History' to the tabs array
  const tabs = [
    'Files',
    'Text',
    'Excel/CSV',
    'Q&A',
    'URL',
    'Chatbot', // RESTORED
    'History', // RESTORED
    'User Details',
    'Profile',
    'Knowledge Base',
    'Categories',
    'Subcategories',
    
  ];

  const navigate = useNavigate();

  // Store current user's profile
  const [userProfile, setUserProfile] = useState(null); // Store current user's profile
  // Remove static tabs, will build dynamically
  const [dynamicTabs, setDynamicTabs] = useState([]);

  // Set the first accessible tab as active when tabs change
  useEffect(() => {
    if (dynamicTabs.length > 0 && !dynamicTabs.includes(activeTab)) {
      setActiveTab(dynamicTabs[0]);
    }
  }, [dynamicTabs]);

  // Fetch current user's profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${BASE_URL}/api/userprofiles/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserProfile(response.data);
        // Dynamically build allowed tabs based on profile access
        const allowedTabs = [];
        if (response.data.allowed_tabs) {
          allowedTabs.push(...response.data.allowed_tabs);
        }
        // Add Profile and User Details tabs based on profile access
        if (response.data.profile && response.data.profile.user_profile_access) {
          if (!allowedTabs.includes('Profile')) allowedTabs.push('Profile');
        }
        if (response.data.profile && response.data.profile.user_details_access) {
          if (!allowedTabs.includes('User Details')) allowedTabs.push('User Details');
        }
        setDynamicTabs(allowedTabs);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

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
    } else if (activeTab === 'URL') {
      fetchURLs();
    } else if (activeTab === 'User Details') {
      fetchUsers();
    } else if (activeTab === 'Profile') {
      fetchProfiles();
    } else if (activeTab === 'Knowledge Base') {
      fetchKnowledgeBases();
    } else if (activeTab === 'Categories') {
      fetchCategoriesList();
    } else if (activeTab === 'Subcategories') {
      fetchSubCategories();
      fetchCategories();
    }
  }, [activeTab]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/filesupload/`);
      setUploadedFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchText = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/textupload/`);
      setTextInput('');
      setUploadedTexts(response.data);
    } catch (error) {
      console.error('Error fetching text:', error);
    }
  };

  const fetchExcel = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/excelupload/`);
      setUploadedFiles(response.data);
    } catch (error) {
      console.error('Error fetching Excel files:', error);
    }
  };

  const fetchQA = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/qa/`);
      setQaData(response.data);
    } catch (error) {
      console.error('Error fetching Q&A data:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/categories/`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/subcategories/`);
      setSubCategories(response.data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchURLs = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/urls/`);
      setUrlList(response.data);
    } catch (error) {
      console.error('Error fetching URLs:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/userprofiles/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch profiles from backend
  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/profiles/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfiles(response.data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  // Fetch Knowledge Bases
  const fetchKnowledgeBases = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/knowledgebase/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKnowledgeBases(response.data);
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
    }
  };

  // State for categories tab
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [categoryFormError, setCategoryFormError] = useState('');

  // Fetch categories from backend
  const fetchCategoriesList = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/categories/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategoriesList(response.data);
    } catch (error) {
      // Optionally handle error
    }
  };

  // Open create modal
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '' });
    setCategoryModalOpen(true);
  };

  // Open edit modal
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name });
    setCategoryModalOpen(true);
  };

  // Create or update category
  const handleCategoryFormSubmit = async (e) => {
    e.preventDefault();
    setCategoryFormError('');
    if (!categoryForm.name) {
      setCategoryFormError('Category name is required.');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      if (editingCategory) {
        // Update
        await axios.put(`${BASE_URL}/api/categories/${editingCategory.id}/`, { name: categoryForm.name }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create
        await axios.post(`${BASE_URL}/api/categories/`, { name: categoryForm.name }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '' });
      fetchCategoriesList();
    } catch (error) {
      setCategoryFormError('Failed to save category.');
    }
  };

  // Fetch categories when any modal opens
  useEffect(() => {
    if (fileModalOpen || excelModalOpen || textModalOpen || categoryModalOpen) {
      fetchCategories();
    }
  }, [fileModalOpen, excelModalOpen, textModalOpen, categoryModalOpen]);

  // Add Knowledge Base tab if user has access
  useEffect(() => {
    if (userProfile && dynamicTabs.length > 0) {
      if (!dynamicTabs.includes('Knowledge Base')) {
        setDynamicTabs((prevTabs) => [...prevTabs, 'Knowledge Base']);
      }
    }
  }, [userProfile, dynamicTabs]);

  // Fetch knowledge bases when tab is active
  useEffect(() => {
    if (activeTab === 'Knowledge Base') {
      fetchKnowledgeBases();
    }
  }, [activeTab]);

  const handleTabClick = (tab) => {
    if (tab === 'Chatbot History') {
      navigate('/config');
    } else {
      setActiveTab(tab);
    }
  };

  // File Upload and Train Handlers

  const handleFileUploadAndTrain = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('access_token');
      const uploadResponse = await axios.post(`${BASE_URL}/api/filesupload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const uploadedFile = uploadResponse.data;
      setUploadedFiles((prevFiles) => [...prevFiles, uploadedFile]);

      const trainFormData = new FormData();
      trainFormData.append('type', 'file');
      trainFormData.append('file', file);

      const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
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
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('access_token');
      const uploadResponse = await axios.post(`${BASE_URL}/api/excelupload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const uploadedFile = uploadResponse.data;
      setUploadedFiles((prevFiles) => [...prevFiles, uploadedFile]);

      const trainFormData = new FormData();
      trainFormData.append('type', 'file');
      trainFormData.append('file', file);

      const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(trainResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during Excel upload and training:', error);
      alert('Failed to upload and train. Please try again.');
    }
  };

  // Delete handlers

  const handleFileDelete = async (fileId) => {
    try {
      await axios.delete(`${BASE_URL}/api/filesupload/${fileId}/`);
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleExcelDelete = async (fileId) => {
    try {
      await axios.delete(`${BASE_URL}/api/excelupload/${fileId}/`);
      fetchExcel();
    } catch (error) {
      console.error('Error deleting Excel/CSV file:', error);
    }
  };

  const handleTextUpload = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${BASE_URL}/api/textupload/`, { text: textInput }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchText();
    } catch (error) {
      console.error('Error uploading text:', error);
    }
  };

  const handleTextDelete = async (textId) => {
    try {
      await axios.delete(`${BASE_URL}/api/textupload/${textId}/`);
      fetchText();
    } catch (error) {
      console.error('Error deleting text:', error);
    }
  };

  const handleTextUploadAndTrain = async () => {
    try {
      setIsTraining(true);
      const token = localStorage.getItem('access_token');
      await axios.post(`${BASE_URL}/api/textupload/`, { content: textInput }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchText();

      const trainFormData = new FormData();
      trainFormData.append('type', 'text');
      trainFormData.append('text', textInput);

      const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(trainResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during text upload and training:', error);
      alert('Failed to upload and train. Please try again.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleExcelUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${BASE_URL}/api/excelupload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      fetchExcel();
    } catch (error) {
      console.error('Error uploading Excel file:', error);
    }
  };

  const handleQASubmit = async (qa) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${BASE_URL}/api/qa/`, { ...qa }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchQA();
    } catch (error) {
      console.error('Error submitting Q&A:', error);
    }
  };

  const handleQnAUploadAndTrain = async (qa) => {
    try {
      setIsTraining(true);
      const token = localStorage.getItem('access_token');
      const formattedQA = {
        ...qa,
        category: qa.category ? [parseInt(qa.category)] : [],
        subcategory: qa.subcategory ? [parseInt(qa.subcategory)] : [],
      };
      await axios.post(`${BASE_URL}/api/qa/`, formattedQA, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const trainFormData = new FormData();
      trainFormData.append('type', 'qna');
      trainFormData.append('question', qa.question);
      trainFormData.append('answer', qa.answer);
      trainFormData.append('category', qa.category || 'general');
      trainFormData.append('subcategory', qa.subcategory || '');

      const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(trainResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during Q&A upload and training:', error);
      alert('Failed to upload and train. Please try again.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleTrain = async () => {
    try {
      let requestData = {};

      if (activeTab === 'Files') {
        requestData = { type: 'file', file: uploadedFiles[0]?.file };
      } else if (activeTab === 'Text') {
        requestData = { type: 'text', text: textInput };
      } else if (activeTab === 'Q&A') {
        if (qaData.length > 0) {
          const qa = qaData[0];
          requestData = {
            type: 'qna',
            question: qa.question,
            answer: qa.answer,
            category: qa.category || 'general',
            subcategory: qa.subcategory || '',
          };
        }
      }

      const response = await axios.post(`${BASE_URL}/api/upload-and-train/`, requestData);
      alert(response.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error initiating training:', error);
      alert('Failed to initiate training. Please try again.');
    }
  };

  const handleURLTrain = async () => {
    const urlInput = document.querySelector('textarea').value;
    if (!urlInput) {
      alert('Please enter at least one URL.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${BASE_URL}/api/urls/`, { url: urlInput }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const embedResponse = await axios.post(`${BASE_URL}/api/embed-website/`, { url: urlInput }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert(embedResponse.data.message || 'Training initiated successfully!');
    } catch (error) {
      console.error('Error during URL training:', error);
      alert('Failed to train with the provided URL(s). Please try again.');
    }
  };

  // Register Sales User API call
  const [registerFormError, setRegisterFormError] = useState('');

  const handleRegisterSalesUser = async (e) => {
    e.preventDefault();
    setRegisterFormError('');
    if (!newUserData.first_name || !newUserData.last_name || !newUserData.email || !newUserData.phone_number || !newUserData.password || !newUserData.profile) {
      setRegisterFormError('All fields are required.');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        ...newUserData,
        username: newUserData.email,
      };
      await axios.post(`${BASE_URL}/api/register/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('User registered successfully!');
      setModalOpen(false);
      setNewUserData({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        phone_number: '',
        password: '',
        profile: '',
      });
      if (activeTab === 'User Details') fetchUsers();
    } catch (error) {
      setRegisterFormError('Failed to register user.');
      console.error('Error registering user:', error);
    }
  };

  // Create or update profile
  const handleProfileFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (editingProfile) {
        await axios.put(`${BASE_URL}/api/profiles/${editingProfile.id}/`, profileForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${BASE_URL}/api/profiles/`, profileForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setProfileModalOpen(false);
      setEditingProfile(null);
      setProfileForm({
        name: '',
        files_access: false,
        text_access: false,
        excel_access: false,
        qna_access: false,
        url_access: false,
        chat_history_access: false,
        user_profile_access: false, // NEW
        user_details_access: false, // NEW
      });
      fetchProfiles();
    } catch (error) {
      alert('Failed to save profile.');
    }
  };

  // Open edit modal
  const handleEditProfile = (profile) => {
    setEditingProfile(profile);
    setProfileForm({ ...profile });
    setProfileModalOpen(true);
  };

  // Open create modal
  const handleCreateProfile = () => {
    setEditingProfile(null);
    setProfileForm({
      name: '',
      files_access: false,
      text_access: false,
      excel_access: false,
      qna_access: false,
      url_access: false,
      chat_history_access: false,
      user_profile_access: false, // NEW
      user_details_access: false, // NEW
    });
    setProfileModalOpen(true);
  };

  // Create or update knowledge base
  const handleKbFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      if (editingKb) {
        await axios.put(`${BASE_URL}/api/knowledgebase/${editingKb.id}/`, kbForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${BASE_URL}/api/knowledgebase/`, kbForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setKbModalOpen(false);
      setEditingKb(null);
      setKbForm({ name: '' });
      fetchKnowledgeBases();
    } catch (error) {
      alert('Failed to save knowledge base.');
    }
  };

  const handleEditKb = (kb) => {
    setEditingKb(kb);
    setKbForm({ name: kb.name });
    setKbModalOpen(true);
  };

  const handleCreateKb = () => {
    setEditingKb(null);
    setKbForm({ name: '' });
    setKbModalOpen(true);
  };

  const handleDeleteKb = async (id) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${BASE_URL}/api/knowledgebase/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchKnowledgeBases();
    } catch (error) {
      alert('Failed to delete knowledge base.');
    }
  };

  // File upload handler for modal
  const handleFileModalSubmit = async (e) => {
    e.preventDefault();
    setFileFormError('');
    if (!fileForm.file) {
      setFileFormError('Please select a file.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', fileForm.file);
      if (fileForm.description) formData.append('description', fileForm.description);
      if (fileForm.knowledge_bases.length > 0) {
        // Map selected IDs to names for the API
        const selectedNames = knowledgeBases
          .filter(kb => fileForm.knowledge_bases.includes(String(kb.id)))
          .map(kb => kb.name);
        // Send each name as a separate field
        selectedNames.forEach((name) => formData.append('knowledge_bases', name));
      }
      const token = localStorage.getItem('access_token');
      // First, upload the file
      const uploadResponse = await axios.post(`${BASE_URL}/api/filesupload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      // After successful upload, trigger training
      const uploadedFile = uploadResponse.data;
      const trainFormData = new FormData();
      trainFormData.append('type', 'file');
      // If the backend expects the file itself, send it; if it expects an ID or path, adjust accordingly
      // Here, we send the file again (adjust if your backend expects a file ID or path)
      trainFormData.append('file', fileForm.file);
      try {
        const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert(trainResponse.data.message || 'Training initiated successfully!');
        setFileModalOpen(false);
        setFileForm({ file: null, description: '', knowledge_bases: [] });
        fetchFiles();
      } catch (trainError) {
        setFileFormError('File uploaded, but training failed. Please try again.');
      }
    } catch (error) {
      setFileFormError('Failed to upload file. Please try again.');
    }
  };

  // Excel upload handler for modal
  const handleExcelModalSubmit = async (e) => {
    e.preventDefault();
    setExcelFormError('');
    if (!excelForm.file) {
      setExcelFormError('Please select a file.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', excelForm.file);
      if (excelForm.description) formData.append('description', excelForm.description);
      if (excelForm.knowledge_bases.length > 0) {
        const selectedNames = knowledgeBases
          .filter(kb => excelForm.knowledge_bases.includes(String(kb.id)))
          .map(kb => kb.name);
        selectedNames.forEach((name) => formData.append('knowledge_bases', name));
      }
      const token = localStorage.getItem('access_token');
      // First, upload the Excel/CSV file
      const uploadResponse = await axios.post(`${BASE_URL}/api/excelupload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      // After successful upload, trigger training
      const uploadedFile = uploadResponse.data;
      const trainFormData = new FormData();
      trainFormData.append('type', 'file');
      trainFormData.append('file', excelForm.file);
      try {
        const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert(trainResponse.data.message || 'Training initiated successfully!');
        setExcelModalOpen(false);
        setExcelForm({ file: null, description: '', knowledge_bases: [] });
        fetchExcel();
      } catch (trainError) {
        setExcelFormError('File uploaded, but training failed. Please try again.');
      }
    } catch (error) {
      setExcelFormError('Failed to upload file. Please try again.');
    }
  };

  // TextContent upload handler for modal
  const handleTextModalSubmit = async (e) => {
    e.preventDefault();
    setTextFormError('');
    if (!textForm.content) {
      setTextFormError('Please enter some text.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('content', textForm.content);
      if (textForm.description) formData.append('description', textForm.description);
      if (textForm.knowledge_bases.length > 0) {
        const selectedNames = knowledgeBases
          .filter(kb => textForm.knowledge_bases.includes(String(kb.id)))
          .map(kb => kb.name);
        selectedNames.forEach((name) => formData.append('knowledge_bases', name));
      }
      const token = localStorage.getItem('access_token');
      // First, upload the text
      const uploadResponse = await axios.post(`${BASE_URL}/api/textupload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      // After successful upload, trigger training
      const uploadedText = uploadResponse.data;
      const trainFormData = new FormData();
      trainFormData.append('type', 'text');
      trainFormData.append('text', textForm.content);
      try {
        const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert(trainResponse.data.message || 'Training initiated successfully!');
        setTextModalOpen(false);
        setTextForm({ content: '', description: '', knowledge_bases: [] });
        fetchText();
      } catch (trainError) {
        setTextFormError('Text uploaded, but training failed. Please try again.');
      }
    } catch (error) {
      setTextFormError('Failed to upload text. Please try again.');
    }
  };

  // Date and time formatting helpers
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Render table helper for various data types

  const renderTable = (data, type) => {
    if (!data || data.length === 0) return <div>No data available.</div>;

    // Unified table rendering for all types, including URL
    let columns = Object.keys(data[0]).filter((col) => col !== 'id');
    if ((type === 'files' || type === 'excel') && columns.includes('file')) {
      columns = ['file', ...columns.filter((c) => c !== 'file')];
    }
    if (type === 'text' && columns.includes('created_at')) {
      columns.splice(columns.indexOf('created_at'), 1, 'uploaded_date', 'uploaded_time');
    }
    if (columns.includes('uploaded_at')) {
      columns.splice(columns.indexOf('uploaded_at'), 1, 'uploaded_date', 'uploaded_time');
    }
    if (columns.includes('updated_at')) {
      columns.splice(columns.indexOf('updated_at'), 1, 'updated_date', 'updated_time');
    }
    // For URL type, ensure columns are in the same order as others
    if (type === 'url') {
      columns = ['url', 'description', 'knowledge_bases', 'created_at', 'updated_at', 'added_by', 'updated_by'];
      columns = [
        'url',
        'description',
        'knowledge_bases',
        'uploaded_date',
        'uploaded_time',
        'updated_date',
        'updated_time',
        'added_by',
        'updated_by',
      ];
    }
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mt-4 w-full mx-auto">
        <div className="overflow-x-auto">
          <table className="w-full border text-sm rounded-lg overflow-hidden">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold">
                    {col === 'file' ? 'File attachment' :
                     col === 'url' ? 'Url' :
                     col === 'knowledge_bases' ? 'Knowledge Bases' :
                     col === 'added_by' ? 'Added By' :
                     col === 'updated_by' ? 'Updated By' :
                     col === 'uploaded_date' ? 'Uploaded Date' :
                     col === 'uploaded_time' ? 'Uploaded Time' :
                     col === 'updated_date' ? 'Updated Date' :
                     col === 'updated_time' ? 'Updated Time' :
                     col.charAt(0).toUpperCase() + col.slice(1)}
                  </th>
                ))}
                <th className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={row.file || row.content || row.url || row.question || row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map((col) => {
                    if (col === 'uploaded_date') return <td key="uploaded_date" className="border px-4 py-2">{formatDate(row.uploaded_at || row.created_at)}</td>;
                    if (col === 'uploaded_time') return <td key="uploaded_time" className="border px-4 py-2">{formatTime(row.uploaded_at || row.created_at)}</td>;
                    if (col === 'updated_date') return <td key="updated_date" className="border px-4 py-2">{formatDate(row.updated_at)}</td>;
                    if (col === 'updated_time') return <td key="updated_time" className="border px-4 py-2">{formatTime(row.updated_at)}</td>;
                    if (type === 'qa' && (col === 'category' || col === 'subcategory')) {
                      return <td key={col} className="border px-4 py-2">{Array.isArray(row[col]) ? row[col].join(', ') : ''}</td>;
                    }
                    if (col === 'knowledge_bases') {
                      return <td key={col} className="border px-4 py-2">{row[col] && row[col].length > 0 ? row[col].map((kb) => (typeof kb === 'string' ? kb : kb.name)).join(', ') : '-'}</td>;
                    }
                    if (col === 'url') {
                      return <td key={col} className="border px-4 py-2"><a href={row[col]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{row[col]}</a></td>;
                    }
                    return (
                      <td key={col} className="border px-4 py-2">
                        {col === 'file' && row[col]
                          ? row[col].split('/').pop()
                          : typeof row[col] === 'string' && row[col].startsWith('http')
                          ? (
                            <a href={row[col]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {row[col]}
                            </a>
                          )
                          : Array.isArray(row[col])
                          ? row[col].join(', ')
                          : String(row[col])}
                      </td>
                    );
                  })}
                  <td className="border px-4 py-2 text-center">
                    <FaTrash
                      className="text-red-500 cursor-pointer hover:text-red-700"
                      onClick={() => {
                        if (type === 'files') handleFileDelete(row.id);
                        else if (type === 'excel') handleExcelDelete(row.id);
                        else if (type === 'text') handleTextDelete(row.id);
                        else if (type === 'qa') {
                          axios.delete(`${BASE_URL}/api/qa/${row.id}/`).then(fetchQA);
                        } else if (type === 'url') {
                          axios.delete(`${BASE_URL}/api/urls/${row.id}/`).then(fetchURLs);
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Renderers for each tab content

  const renderFileList = () => (
    <div className="mt-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-800">Uploaded Files</h3>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow"
          title="Add File"
          aria-label="Add File"
          onClick={() => setFileModalOpen(true)}
        >
          <span>+</span>
        </button>
      </div>
      {renderTable(uploadedFiles, 'files')}
      {/* File Upload Modal */}
      {fileModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setFileModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Upload File</h2>
            <form onSubmit={handleFileModalSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">File <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  required
                  onChange={e => setFileForm({ ...fileForm, file: e.target.files[0] })}
                  className="w-full p-2 border rounded"
                  accept=".pdf,.doc,.docx,.txt"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={fileForm.description}
                  onChange={e => setFileForm({ ...fileForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter a description (optional)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                <select
                  multiple
                  value={fileForm.knowledge_bases}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setFileForm({ ...fileForm, knowledge_bases: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              {fileFormError && <div className="text-red-500 text-xs">{fileFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setFileModalOpen(false); setFileForm({ file: null, description: '', knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderTextList = () => (
    <div className="mt-6 w-11/12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold mb-4">Uploaded Text</h3>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow"
          title="Add Text"
          aria-label="Add Text"
          onClick={() => setTextModalOpen(true)}
        >
          <span>+</span>
        </button>
      </div>
      {renderTable(uploadedTexts, 'text')}
      {/* Text Upload Modal */}
      {textModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setTextModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Upload Text</h2>
            <form onSubmit={handleTextModalSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">Text <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={textForm.content}
                  onChange={e => setTextForm({ ...textForm, content: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={4}
                  placeholder="Enter your text here..."
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={textForm.description}
                  onChange={e => setTextForm({ ...textForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter a description (optional)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                <select
                  multiple
                  value={textForm.knowledge_bases}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setTextForm({ ...textForm, knowledge_bases: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              {textFormError && <div className="text-red-500 text-xs">{textFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setTextModalOpen(false); setTextForm({ content: '', description: '', knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderExcelList = () => (
    <div className="mt-6 w-11/12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold mb-4">Uploaded Excel/CSV Files</h3>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow"
          title="Add Excel/CSV File"
          aria-label="Add Excel/CSV File"
          onClick={() => setExcelModalOpen(true)}
        >
          <span>+</span>
        </button>
      </div>
      {renderTable(uploadedFiles, 'excel')}
      {/* Excel Upload Modal */}
      {excelModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setExcelModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Upload Excel/CSV File</h2>
            <form onSubmit={handleExcelModalSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">File <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  required
                  onChange={e => setExcelForm({ ...excelForm, file: e.target.files[0] })}
                  className="w-full p-2 border rounded"
                  accept=".csv,.xls,.xlsx"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={excelForm.description}
                  onChange={e => setExcelForm({ ...excelForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter a description (optional)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                <select
                  multiple
                  value={excelForm.knowledge_bases}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setExcelForm({ ...excelForm, knowledge_bases: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              {excelFormError && <div className="text-red-500 text-xs">{excelFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setExcelModalOpen(false); setExcelForm({ file: null, description: '', knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderQAList = () => (
    <div className="mt-6 w-11/12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold mb-4">Q&A Data</h3>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow"
          title="Add Q&A"
          aria-label="Add Q&A"
          onClick={() => setQaModalOpen(true)}
        >
          <span>+</span>
        </button>
      </div>
      {renderTable(qaData, 'qa')}
      {/* Q&A Upload Modal */}
      {qaModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setQaModalOpen(false)}>
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Upload Q&A</h2>
            <form onSubmit={handleQaModalSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">Question <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={qaForm.question}
                  onChange={e => setQaForm({ ...qaForm, question: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter the question..."
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Answer <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={qaForm.answer}
                  onChange={e => setQaForm({ ...qaForm, answer: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter the answer..."
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={qaForm.description}
                  onChange={e => setQaForm({ ...qaForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter a description (optional)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Category</label>
                <select
                  multiple
                  value={qaForm.category}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setQaForm({ ...qaForm, category: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Subcategory</label>
                <select
                  multiple
                  value={qaForm.subcategory}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setQaForm({ ...qaForm, subcategory: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {subCategories.map((sub) => (
                    <option key={sub.id} value={String(sub.id)}>{sub.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                <select
                  multiple
                  value={qaForm.knowledge_bases}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setQaForm({ ...qaForm, knowledge_bases: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              {qaFormError && <div className="text-red-500 text-xs">{qaFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setQaModalOpen(false); setQaForm({ question: '', answer: '', description: '', category: [], subcategory: [], knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderURLList = () => (
    <div className="mt-6 w-11/12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold mb-4">Uploaded URLs</h3>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow"
          title="Add URL"
          aria-label="Add URL"
          onClick={() => setUrlModalOpen(true)}
        >
          <span>+</span>
        </button>
      </div>
      {renderTable(urlList, 'url')}
      {/* URL Upload Modal */}
      {urlModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setUrlModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Add URL</h2>
            <form onSubmit={handleUrlModalSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">URL <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={urlForm.url}
                  onChange={e => setUrlForm({ ...urlForm, url: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter the URL"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                  value={urlForm.description}
                  onChange={e => setUrlForm({ ...urlForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Enter a description (optional)"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                <select
                  multiple
                  value={urlForm.knowledge_bases}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setUrlForm({ ...urlForm, knowledge_bases: options });
                  }}
                  className="w-full p-2 border rounded"
                >
                  {knowledgeBases.map((kb) => (
                    <option key={kb.id} value={String(kb.id)}>{kb.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</span>
              </div>
              {urlFormError && <div className="text-red-500 text-xs">{urlFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setUrlModalOpen(false); setUrlForm({ url: '', description: '', knowledge_bases: [] }); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to group subcategories by category
  const getCategorySubcategoryMap = () => {
    const map = {};
    categories.forEach(cat => {
      map[cat.id] = { name: cat.name, subcategories: [] };
    });
    subCategories.forEach(sub => {
      if (map[sub.category]) {
        map[sub.category].subcategories.push(sub.name);
      }
    });
    return Object.values(map);
  };

  const renderSubcategoriesTable = () => {
    // Flatten subcategories for table: each row is a subcategory with its parent category
    const data = subCategories.map((sub) => {
      const parent = categories.find((cat) => cat.id === sub.category);
      return {
        subcategoryId: sub.id,
        subcategoryName: sub.name,
        categoryId: parent ? parent.id : '',
        categoryName: parent ? parent.name : '',
      };
    });
    if (!data.length) return <div>No subcategories available.</div>;
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mt-4 w-full mx-auto">
        <h3 className="text-lg font-semibold mb-4">Subcategories List</h3>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold">Category</th>
                <th className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold">Subcategory</th>
                <th className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={row.subcategoryId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-4 py-2">{row.categoryName}</td>
                  <td className="border px-4 py-2">{row.subcategoryName}</td>
                  <td className="border px-4 py-2 text-center">
                    {/* TODO: Add edit/delete buttons here for each subcategory */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render User Details (remove Role column)
  const renderUserDetails = () => {
    if (!users || users.length === 0) {
      return <p className="text-gray-500">No users found.</p>;
    }

    const filteredUsers = users.filter((user) => {
      const searchLower = userSearch.toLowerCase();
      return (
        (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
        (user.phone_number && user.phone_number.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.created_at && new Date(user.created_at).toLocaleDateString().includes(searchLower))
      );
    });

    return (
      <div className="mt-6 w-full max-w-5xl overflow-x-auto bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">User Details</h3>
          <button
            className="bg-gray-500 hover:bg-gray-300 font-bold text-white rounded-full w-8 h-8 flex text-center items-center justify-center"
            title="Add Sales User"
            aria-label="Add Sales User"
            onClick={() => setModalOpen(true)}
          >
            <span className="text-xl"><FaPlus/></span>
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
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="border px-3 py-2 text-center text-gray-500">
                  No matching users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, idx) => (
                <tr key={user.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2">{user.first_name}</td>
                  <td className="border px-3 py-2">{user.last_name}</td>
                  <td className="border px-3 py-2">{user.phone_number}</td>
                  <td className="border px-3 py-2">{user.email}</td>
                  <td className="border px-3 py-2">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="border px-3 py-2">{user.profile_name || ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderProfileTab = () => (
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
                  { key: 'user_profile_access', label: 'Profile' }, // NEW
                  { key: 'user_details_access', label: 'User Details' }, // NEW
                ].map(({ key, label }) => {
                  const isAdmin = editingProfile && editingProfile.name.toLowerCase() === 'Admin';
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
                <button type="button" onClick={() => { setProfileModalOpen(false); setEditingProfile(null); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">{editingProfile ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderKnowledgeBaseTab = () => (
    <div className="mt-6 w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Knowledge Base</h3>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
          onClick={handleCreateKb}
        >
          <FaPlus />
        </button>
      </div>
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th className="border px-4 py-2 bg-gray-100 text-left">Name</th>
            <th className="border px-4 py-2 bg-gray-100 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {knowledgeBases.map((kb) => (
            <tr key={kb.id}>
              <td className="border px-4 py-2">{kb.name}</td>
              <td className="border px-4 py-2 space-x-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={() => handleEditKb(kb)}>Edit</button>
                <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={() => handleDeleteKb(kb.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Knowledge Base Modal */}
      {kbModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setKbModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">{editingKb ? 'Edit Knowledge Base' : 'Create New Knowledge Base'}</h2>
            <form onSubmit={handleKbFormSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">Name</label>
                <input
                  type="text"
                  required
                  value={kbForm.name}
                  onChange={e => setKbForm({ name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setKbModalOpen(false); setEditingKb(null); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">{editingKb ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="mt-6 w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Categories</h3>
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
          onClick={handleCreateCategory}
        >
          +
        </button>
      </div>
      <table className="min-w-full border text-sm">
        <thead>
          <tr>
            <th className="border px-4 py-2 bg-gray-100 text-left">Name</th>
            <th className="border px-4 py-2 bg-gray-100 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categoriesList.map((cat) => (
            <tr key={cat.id}>
              <td className="border px-4 py-2">{cat.name}</td>
              <td className="border px-4 py-2">
                <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={() => handleEditCategory(cat)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setCategoryModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">{editingCategory ? 'Edit Category' : 'Create New Category'}</h2>
            <form onSubmit={handleCategoryFormSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block mb-1 font-medium">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              {categoryFormError && <div className="text-red-500 text-xs">{categoryFormError}</div>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setCategoryModalOpen(false); setEditingCategory(null); }} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700">{editingCategory ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState(() => {
    // By default, expand all sections
    const initial = {};
    tabSections.forEach(section => { initial[section.label] = true; });
    return initial;
  });

  const handleSectionToggle = (label) => {
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Files':
        return (
          <FileListTab
            uploadedFiles={uploadedFiles}
            renderTable={renderTable}
            fileModalOpen={fileModalOpen}
            setFileModalOpen={setFileModalOpen}
            fileForm={fileForm}
            setFileForm={setFileForm}
            knowledgeBases={knowledgeBases}
            fileFormError={fileFormError}
            handleFileModalSubmit={handleFileModalSubmit}
          />
        );
      case 'Text':
        return (
          <TextListTab
            uploadedTexts={uploadedTexts}
            renderTable={renderTable}
            textModalOpen={textModalOpen}
            setTextModalOpen={setTextModalOpen}
            textForm={textForm}
            setTextForm={setTextForm}
            knowledgeBases={knowledgeBases}
            textFormError={textFormError}
            handleTextModalSubmit={handleTextModalSubmit}
          />
        );
      case 'Excel/CSV':
        return (
          <ExcelListTab
            uploadedFiles={uploadedFiles}
            renderTable={renderTable}
            excelModalOpen={excelModalOpen}
            setExcelModalOpen={setExcelModalOpen}
            excelForm={excelForm}
            setExcelForm={setExcelForm}
            knowledgeBases={knowledgeBases}
            excelFormError={excelFormError}
            handleExcelModalSubmit={handleExcelModalSubmit}
          />
        );
      case 'Q&A':
        return (
          <QAListTab
            qaData={qaData}
            renderTable={renderTable}
            qaModalOpen={qaModalOpen}
            setQaModalOpen={setQaModalOpen}
            qaForm={qaForm}
            setQaForm={setQaForm}
            categories={categories}
            subCategories={subCategories}
            knowledgeBases={knowledgeBases}
            qaFormError={qaFormError}
            handleQaModalSubmit={handleQaModalSubmit}
          />
        );
      case 'URL':
        return (
          <URLListTab
            urlList={urlList}
            renderTable={renderTable}
            urlModalOpen={urlModalOpen}
            setUrlModalOpen={setUrlModalOpen}
            urlForm={urlForm}
            setUrlForm={setUrlForm}
            knowledgeBases={knowledgeBases}
            urlFormError={urlFormError}
            handleUrlModalSubmit={handleUrlModalSubmit}
          />
        );
      case 'Profile':
        return (
          <ProfileTab
            profiles={profiles}
            handleEditProfile={handleEditProfile}
            handleCreateProfile={handleCreateProfile}
            profileModalOpen={profileModalOpen}
            setProfileModalOpen={setProfileModalOpen}
            editingProfile={editingProfile}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            handleProfileFormSubmit={handleProfileFormSubmit}
          />
        );
      case 'Knowledge Base':
        return (
          <KnowledgeBaseTab
            knowledgeBases={knowledgeBases}
            handleEditKb={handleEditKb}
            handleDeleteKb={handleDeleteKb}
            handleCreateKb={handleCreateKb}
            kbModalOpen={kbModalOpen}
            setKbModalOpen={setKbModalOpen}
            editingKb={editingKb}
            kbForm={kbForm}
            setKbForm={setKbForm}
            handleKbFormSubmit={handleKbFormSubmit}
          />
        );
      case 'Categories':
        return (
          <CategoriesTab
            categoriesList={categoriesList}
            handleEditCategory={handleEditCategory}
            handleCreateCategory={handleCreateCategory}
            categoryModalOpen={categoryModalOpen}
            setCategoryModalOpen={setCategoryModalOpen}
            editingCategory={editingCategory}
            categoryForm={categoryForm}
            setCategoryForm={setCategoryForm}
            categoryFormError={categoryFormError}
            handleCategoryFormSubmit={handleCategoryFormSubmit}
          />
        );
      case 'Subcategories':
        return (
          <SubcategoriesTable
            subCategories={subCategories}
            categories={categories}
            onAddSubcategory={handleAddSubcategory}
            onEditSubcategory={handleEditSubcategory}
          />
        );
      case 'User Details':
        return (
          <UserDetailsTab
            users={users}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            handleRegisterSalesUser={handleRegisterSalesUser}
            registerForm={newUserData}
            setRegisterForm={setNewUserData}
            registerFormError={registerFormError}
            knowledgeBases={knowledgeBases}
            profiles={profiles}
            onRefreshUsers={fetchUsers}
          />
        );
      case 'Chatbot History':
        return null;
      default:
        return null;
    }
  };

  // Fetch profiles when registration modal opens
  useEffect(() => {
    if (modalOpen) {
      fetchProfiles();
    }
  }, [modalOpen]);

  // Fetch knowledge bases when user registration modal opens
  useEffect(() => {
    if (modalOpen) {
      fetchKnowledgeBases();
    }
  }, [modalOpen]);

  // Fetch knowledge bases, categories, and subcategories when Q&A modal opens
  useEffect(() => {
    if (qaModalOpen) {
      fetchKnowledgeBases();
      fetchCategories();
      fetchSubCategories();
    }
  }, [qaModalOpen]);

  // Fetch knowledge bases when URL modal opens
  useEffect(() => {
    if (urlModalOpen) {
      fetchKnowledgeBases();
    }
  }, [urlModalOpen]);

  // Fetch profiles and knowledge bases when User Details tab is activated
  useEffect(() => {
    if (activeTab === 'User Details') {
      fetchProfiles();
      fetchKnowledgeBases();
    }
  }, [activeTab]);

  // URL upload modal submit handler

  const handleUrlModalSubmit = async (e) => {
    e.preventDefault();
    setUrlFormError('');
    if (!urlForm.url) {

      setUrlFormError('Please enter a URL.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('url', urlForm.url);
      if (urlForm.description) formData.append('description', urlForm.description);
      if (urlForm.knowledge_bases.length > 0) {
        const selectedNames = knowledgeBases
          .filter(kb => urlForm.knowledge_bases.includes(String(kb.id)))
          .map(kb => kb.name);
        selectedNames.forEach((name) => formData.append('knowledge_bases', name));
      }
      const token = localStorage.getItem('access_token');
      // First, upload the URL
      await axios.post(`${BASE_URL}/api/urls/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      // After successful upload, trigger training
      try {
        const embedResponse = await axios.post(`${BASE_URL}/api/embed-website/`, { url: urlForm.url }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        alert(embedResponse.data.message || 'Training initiated successfully!');
        setUrlModalOpen(false);
        setUrlForm({ url: '', description: '', knowledge_bases: [] });
        fetchURLs();
      } catch (trainError) {
        setUrlFormError('URL uploaded, but training failed. Please try again.');
      }
    } catch (error) {
      setUrlFormError('Failed to upload URL. Please try again.');
    }
  };

  // Q&A modal submit handler
  const handleQaModalSubmit = async (e) => {
    e.preventDefault();
    setQaFormError('');
    if (!qaForm.question || !qaForm.answer) {
      setQaFormError('Question and Answer are required!');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      // Map selected knowledge base IDs to names
      const selectedKbNames = knowledgeBases
        .filter(kb => qaForm.knowledge_bases.includes(String(kb.id)))
        .map(kb => kb.name);
      const payload = {
        ...qaForm,
        knowledge_bases: selectedKbNames,
      };
      await axios.post(`${BASE_URL}/api/qa/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // After successful upload, trigger training
      const trainFormData = new FormData();
      trainFormData.append('type', 'qna');
      trainFormData.append('question', qaForm.question);
      trainFormData.append('answer', qaForm.answer);
      trainFormData.append('category', qaForm.category && qaForm.category.length > 0 ? qaForm.category[0] : 'general');
      trainFormData.append('subcategory', qaForm.subcategory && qaForm.subcategory.length > 0 ? qaForm.subcategory[0] : '');
      try {
        const trainResponse = await axios.post(`${BASE_URL}/api/upload-and-train/`, trainFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert(trainResponse.data.message || 'Training initiated successfully!');
        setQaModalOpen(false);
        setQaForm({ question: '', answer: '', description: '', category: [], subcategory: [], knowledge_bases: [] });
        fetchQA();
      } catch (trainError) {
        setQaFormError('Q&A uploaded, but training failed. Please try again.');
      }
    } catch (error) {
      setQaFormError('Failed to upload Q&A. Please try again.');
    }
  };

  // Add subcategory handler
  const handleAddSubcategory = async (data) => {
    try {
      await axios.post(`${BASE_URL}/api/subcategories/`, data);
      fetchSubCategories();
    } catch (error) {
      alert('Failed to add subcategory.');
    }
  };

  const handleEditSubcategory = async (data) => {
    try {
      await axios.patch(`${BASE_URL}/api/subcategories/${data.id}/`, data);
      fetchSubCategories();
    } catch (error) {
      alert('Failed to update subcategory.');
    }
  };

  return (
    <div className="flex  min-h-screen bg-gray-100">
      <div
        style={{ width: '20%', top: 0, height: '100vh' }}
        className="bg-white shadow-md p-6 flex flex-col justify-center sticky left-0"
      >
        <div className="space-y-4 text-center">
          {tabSections.map(section => (
            <div key={section.label} className="mb-2 w-full">
              <div
                className="font-bold text-gray-700 text-left mb-1 uppercase text-xs tracking-wider flex items-center cursor-pointer select-none"
                onClick={() => handleSectionToggle(section.label)}
              >
                <span className="mr-2">{expandedSections[section.label] ? '▼' : '►'}</span>
                {section.label}
              </div>
              {expandedSections[section.label] && (
                <div className="flex flex-col items-start pl-4">
                  {section.tabs.map(tab => (
                    <div
                      key={tab}
                      className={`cursor-pointer p-2 rounded-md w-full text-left ${
                        activeTab.toLowerCase() === tab.toLowerCase() ? 'bg-gray-500 text-white font-bold' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => handleTabClick(tab.charAt(0).toUpperCase() + tab.slice(1))}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Removed + Button from here */}
      </div>

      <div className="w-full flex flex-col p-6 justify-center items-center">{renderContent()}</div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-gray-500 b-50 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Register User</h2>
            <form onSubmit={handleRegisterSalesUser} className="space-y-1 text-sm">
              <div>
                <label className="block mb-1 font-medium">First Name</label>
                <input
                  type="text"
                  required
                  value={newUserData.first_name}
                  onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Last Name</label>
                <input
                  type="text"
                  required
                  value={newUserData.last_name}
                  onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Email</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value, username: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Phone Number</label>
                <input
                  type="tel"
                  value={newUserData.phone_number}
                  onChange={(e) => setNewUserData({ ...newUserData, phone_number: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Password</label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Profile</label>
                <select
                  required
                  value={newUserData.profile}
                  onChange={(e) => setNewUserData({ ...newUserData, profile: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Profile</option>
                  {profiles && profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Knowledge Base</label>
                <select
                  multiple
                  value={newUserData.knowledge_bases || []}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setNewUserData({ ...newUserData, knowledge_bases: options });
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
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-700"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateAgent;

