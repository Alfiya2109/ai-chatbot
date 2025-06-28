import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTrash, FaEdit, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { BASE_URL } from '../base_url';
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
import FolderListTab from './FolderListTab'; // Import FolderListTab
import GoogleDrive from './GoogleDrive';
import Loader from './Loader'; 

// Define tab structure as per the provided image
const tabSections = [
  {
    label: 'chat',
    tabs: ['chatbot', 'Chatbot History']
  },
  {
    label: 'source data',
    tabs: ['Folder','Files', 'Text', 'Excel/CSV', 'URL', 'Q&A']
  },
  {
    label: 'setup',
    tabs: [ 'User Details', 'Profile', 'Knowledge Base']
  },
  {
    label: 'Master',
    tabs: ['Categories', 'Subcategories']
  },
  {
    label: 'Connections',
    tabs: ['Google Drive']
  }
];

function CreateAgent() {
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileForm, setFileForm] = useState({
    file: null,
    description: '',
    knowledge_bases: [],
  });
  const [fileFormError, setFileFormError] = useState('');
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [excelForm, setExcelForm] = useState({
    file: null,
    description: '',
    knowledge_bases: [],
  });
  const [excelFormError, setExcelFormError] = useState('');
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textForm, setTextForm] = useState({
    content: '',
    description: '',
    knowledge_bases: [],
  });
  const [textFormError, setTextFormError] = useState('');
  const [editingText, setEditingText] = useState(null);
  const [textEditModalOpen, setTextEditModalOpen] = useState(false);
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
  const [editingQa, setEditingQa] = useState(null);
  const [qaEditModalOpen, setQaEditModalOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlForm, setUrlForm] = useState({ url: '', description: '', knowledge_bases: [] });
  const [urlFormError, setUrlFormError] = useState('');
  const [activeTab, setActiveTab] = useState('Files');
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
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [dynamicTabs, setDynamicTabs] = useState([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    if (dynamicTabs.length > 0 && !dynamicTabs.includes(activeTab)) {
      setActiveTab(dynamicTabs[0]);
    }
  }, [dynamicTabs]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${BASE_URL}/api/userprofiles/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserProfile(response.data.userprofile);
      } catch (error) {
        setUserProfile(null);
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

  // Delete category
  const handleDeleteCategory = async (category) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`${BASE_URL}/api/categories/${category.id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchCategoriesList(); // Refresh the list
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category.');
      }
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
    if (tab.toLowerCase() === 'chatbot history' || tab.toLowerCase() === 'history') {
      // Check if user is Non-Sales and show alert
      const profile = localStorage.getItem('profile') || userProfile?.profile;
      if (profile && (profile.toLowerCase() === 'non-sales' || profile.toLowerCase() === 'nonsales')) {
        alert('Access Denied: Non-Sales users are not authorized to view Chatbot History. Please contact your administrator for access.');
        return;
      }
      navigate('/config');
    } else if (tab.toLowerCase() === 'chatbot') {
      navigate('/chatbot');
    } else {
      if (tab === 'Profile') {
        fetchProfiles(); // Always fetch profiles on Profile tab click
      }
      setActiveTab(tab);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

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


  const handleTextDelete = async (textId) => {
    try {
      await axios.delete(`${BASE_URL}/api/textupload/${textId}/`);
      fetchText();
    } catch (error) {
      console.error('Error deleting text:', error);
    }
  };

  const handleTextEdit = (textItem) => {
    setEditingText(textItem);
    setTextForm({
      content: textItem.content || '',
      description: textItem.description || '',
      knowledge_bases: textItem.knowledge_bases ? textItem.knowledge_bases.map(kb => String(typeof kb === 'object' ? kb.id : kb)) : [],
    });
    // Fetch knowledge bases when edit modal opens
    fetchKnowledgeBases();
    setTextEditModalOpen(true);
  };

  const handleTextEditSubmit = async (e) => {
    e.preventDefault();
    setTextFormError('');
    if (!textForm.content) {
      setTextFormError('Please enter some text.');
      return;
    }
    if (!textForm.knowledge_bases || textForm.knowledge_bases.length === 0) {
      setTextFormError('Please select at least one knowledge base.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('content', textForm.content);
      if (textForm.description) formData.append('description', textForm.description);
      const selectedNames = knowledgeBases
        .filter(kb => textForm.knowledge_bases.includes(String(kb.id)))
        .map(kb => kb.name);
      selectedNames.forEach((name) => formData.append('knowledge_bases', name));
      
      const token = localStorage.getItem('access_token');
      await axios.patch(`${BASE_URL}/api/textupload/${editingText.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      
      alert('Text updated successfully!');
      setTextEditModalOpen(false);
      setEditingText(null);
      setTextForm({ content: '', description: '', knowledge_bases: [] });
      fetchText();
    } catch (error) {
      setTextFormError('Failed to update text. Please try again.');
      console.error('Error updating text:', error);
    }
  };

  // Q&A edit handlers
  const handleQaEdit = (qaItem) => {
    setEditingQa(qaItem);
    setQaForm({
      question: qaItem.question || '',
      answer: qaItem.answer || '',
      description: qaItem.description || '',
      category: qaItem.category && qaItem.category.length > 0 ? (typeof qaItem.category[0] === 'object' ? qaItem.category[0].id : qaItem.category[0]) : '',
      subcategory: qaItem.subcategory && qaItem.subcategory.length > 0 ? (typeof qaItem.subcategory[0] === 'object' ? qaItem.subcategory[0].id : qaItem.subcategory[0]) : '',
      knowledge_bases: qaItem.knowledge_bases ? qaItem.knowledge_bases.map(kb => String(typeof kb === 'object' ? kb.id : kb)) : [],
    });
    // Fetch knowledge bases when edit modal opens
    fetchKnowledgeBases();
    setQaEditModalOpen(true);
  };

  const handleQaEditSubmit = async (e) => {
    e.preventDefault();
    setQaFormError('');
    if (!qaForm.question || !qaForm.answer) {
      setQaFormError('Question and Answer are required.');
      return;
    }
    if (!qaForm.knowledge_bases || qaForm.knowledge_bases.length === 0) {
      setQaFormError('Please select at least one knowledge base.');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      
      // Convert knowledge base IDs to names
      const selectedNames = knowledgeBases
        .filter(kb => qaForm.knowledge_bases.includes(String(kb.id)))
        .map(kb => kb.name);
      
      const formattedQA = {
        question: qaForm.question,
        answer: qaForm.answer,
        description: qaForm.description,
        category: qaForm.category ? [parseInt(qaForm.category)] : [],
        subcategory: qaForm.subcategory ? [parseInt(qaForm.subcategory)] : [],
        knowledge_bases: selectedNames,
      };
      
      await axios.patch(`${BASE_URL}/api/qa/${editingQa.id}/`, formattedQA, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      alert('Q&A updated successfully!');
      setQaEditModalOpen(false);
      setEditingQa(null);
      setQaForm({
        question: '',
        answer: '',
        description: '',
        category: [],
        subcategory: [],
        knowledge_bases: [],
      });
      fetchQA();
    } catch (error) {
      setQaFormError('Failed to update Q&A. Please try again.');
      console.error('Error updating Q&A:', error);
    }
  };

  // Bulk delete handlers
  const handleBulkFileDelete = async (fileIds) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${BASE_URL}/api/bulk-delete-files/`, 
        {
          data: { ids: fileIds },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      fetchFiles();
      return { success: true };
    } catch (error) {
      console.error('Error bulk deleting files:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to delete files' };
    }
  };

  const handleBulkTextDelete = async (textIds) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${BASE_URL}/api/bulk-delete-textcontents/`, 
        {
          data: { ids: textIds },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      fetchText();
      return { success: true };
    } catch (error) {
      console.error('Error bulk deleting text content:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to delete text content' };
    }
  };

  const handleBulkExcelDelete = async (excelIds) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${BASE_URL}/api/bulk-delete-excel/`, 
        {
          data: { ids: excelIds },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      fetchExcel();
      return { success: true };
    } catch (error) {
      console.error('Error bulk deleting Excel files:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to delete Excel files' };
    }
  };

  const handleBulkQADelete = async (qaIds) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${BASE_URL}/api/bulk-delete-qa/`, 
        {
          data: { ids: qaIds },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      fetchQA();
      return { success: true };
    } catch (error) {
      console.error('Error bulk deleting Q&A data:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to delete Q&A data' };
    }
  };

  const handleBulkURLDelete = async (urlIds) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${BASE_URL}/api/bulk-delete-urls/`, 
        {
          data: { ids: urlIds },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      fetchURLs();
      return { success: true };
    } catch (error) {
      console.error('Error bulk deleting URLs:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to delete URLs' };
    }
  };

  const handleBulkFolderDelete = async (folderIds) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${BASE_URL}/api/bulk-delete-folders/`, 
        {
          data: { ids: folderIds },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      // Assuming there's a fetchFolders function, if not we'll need to create it
      // fetchFolders();
      return { success: true };
    } catch (error) {
      console.error('Error bulk deleting folders:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to delete folders' };
    }
  };
  // Text Upload and Train Handler

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
      // Validate knowledge base selection
      if (!qa.knowledge_bases || qa.knowledge_bases.length === 0) {
        alert('Please select at least one knowledge base before training.');
        return;
      }

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
      // Add knowledge base names to the training payload
      const selectedNames = knowledgeBases
        .filter(kb => qa.knowledge_bases.includes(String(kb.id)))
        .map(kb => kb.name);
      selectedNames.forEach((name) => trainFormData.append('knowledge_bases', name));

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
      let requestData = new FormData();

      if (activeTab === 'Files') {
        // Validate knowledge base selection
        if (!fileForm.knowledge_bases || fileForm.knowledge_bases.length === 0) {
          alert('Please select at least one knowledge base before training.');
          return;
        }
        requestData.append('type', 'file');
        requestData.append('file', uploadedFiles[0]?.file);
        // Add knowledge base names to the training payload
        const selectedNames = knowledgeBases
          .filter(kb => fileForm.knowledge_bases.includes(String(kb.id)))
          .map(kb => kb.name);
        selectedNames.forEach((name) => requestData.append('knowledge_bases', name));
      } else if (activeTab === 'Text') {
        // Validate knowledge base selection
        if (!textForm.knowledge_bases || textForm.knowledge_bases.length === 0) {
          alert('Please select at least one knowledge base before training.');
          return;
        }
        requestData.append('type', 'text');
        requestData.append('text', textInput);
        // Add knowledge base names to the training payload
        const selectedNames = knowledgeBases
          .filter(kb => textForm.knowledge_bases.includes(String(kb.id)))
          .map(kb => kb.name);
        selectedNames.forEach((name) => requestData.append('knowledge_bases', name));
      } else if (activeTab === 'Q&A') {
        if (qaData.length > 0) {
          const qa = qaData[0];
          // Validate knowledge base selection
          if (!qa.knowledge_bases || qa.knowledge_bases.length === 0) {
            alert('Please select at least one knowledge base before training.');
            return;
          }
          requestData.append('type', 'qna');
          requestData.append('question', qa.question);
          requestData.append('answer', qa.answer);
          requestData.append('category', qa.category || 'general');
          requestData.append('subcategory', qa.subcategory || '');
          // Add knowledge base names to the training payload
          const selectedNames = knowledgeBases
            .filter(kb => qa.knowledge_bases.includes(String(kb.id)))
            .map(kb => kb.name);
          selectedNames.forEach((name) => requestData.append('knowledge_bases', name));
        }
      }

      const response = await axios.post(`${BASE_URL}/api/upload-and-train/`, requestData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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

  // Delete profile
  const handleDeleteProfile = async (id) => {
    if (window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`${BASE_URL}/api/profiles/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchProfiles();
        alert('Profile deleted successfully!');
      } catch (error) {
        alert('Failed to delete profile.');
      }
    }
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
    // Validate knowledge base selection
    if (!fileForm.knowledge_bases || fileForm.knowledge_bases.length === 0) {
      setFileFormError('Please select at least one knowledge base.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', fileForm.file);
      if (fileForm.description) formData.append('description', fileForm.description);
      // Map selected IDs to names for the API
      const selectedNames = knowledgeBases
        .filter(kb => fileForm.knowledge_bases.includes(String(kb.id)))
        .map(kb => kb.name);
      // Send each name as a separate field
      selectedNames.forEach((name) => formData.append('knowledge_bases', name));
      
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
      trainFormData.append('file', fileForm.file);
      // Add knowledge base names to the training payload
      selectedNames.forEach((name) => trainFormData.append('knowledge_bases', name));

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
    // Validate knowledge base selection
    if (!excelForm.knowledge_bases || excelForm.knowledge_bases.length === 0) {
      setExcelFormError('Please select at least one knowledge base.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', excelForm.file);
      if (excelForm.description) formData.append('description', excelForm.description);
      // Map selected IDs to names for the API
      const selectedNames = knowledgeBases
        .filter(kb => excelForm.knowledge_bases.includes(String(kb.id)))
        .map(kb => kb.name);
      selectedNames.forEach((name) => formData.append('knowledge_bases', name));
      
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
      // Add knowledge base names to the training payload
      selectedNames.forEach((name) => trainFormData.append('knowledge_bases', name));

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
    // Validate knowledge base selection
    if (!textForm.knowledge_bases || textForm.knowledge_bases.length === 0) {
      setTextFormError('Please select at least one knowledge base.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('content', textForm.content);
      if (textForm.description) formData.append('description', textForm.description);
      // Map selected IDs to names for the API
      const selectedNames = knowledgeBases
        .filter(kb => textForm.knowledge_bases.includes(String(kb.id)))
        .map(kb => kb.name);
      selectedNames.forEach((name) => formData.append('knowledge_bases', name));
      
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
      // Add knowledge base names to the training payload
      selectedNames.forEach((name) => trainFormData.append('knowledge_bases', name));

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

  const renderTable = (data, type, multiSelectOptions = null, editHandler = null) => {
    if (!data || data.length === 0) return <div>No data available.</div>;

    const { isMultiSelectMode, selectedItems, onSelectAll, onItemSelect } = multiSelectOptions || {};

    // Unified table rendering for all types, including URL
    let columns = Object.keys(data[0]).filter((col) => col !== 'id');
    if ((type === 'files' || type === 'excel') && columns.includes('file')) {
      columns = ['file', ...columns.filter((c) => c !== 'file')];
    }
    // Add 'view' column for files tab
    if (type === 'files' && !columns.includes('view')) {
      columns.push('view');
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
                {isMultiSelectMode && (
                  <th className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold">
                    <input
                      type="checkbox"
                      onChange={e => onSelectAll && onSelectAll(e.target.checked)}
                      checked={selectedItems && selectedItems.length === data.length && data.length > 0}
                      className="rounded"
                    />
                  </th>
                )}
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
                {!isMultiSelectMode && (
                  <th className="border px-4 py-2 bg-gray-100 text-gray-700 font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={row.file || row.content || row.url || row.question || row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {isMultiSelectMode && (
                    <td className="border px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedItems && selectedItems.includes(row.id)}
                        onChange={e => onItemSelect && onItemSelect(row.id, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                  )}
                  {columns.map((col) => {
                    if (col === 'uploaded_date') return <td key="uploaded_date" className="border px-4 py-2">{formatDate(row.uploaded_at || row.created_at)}</td>;
                    if (col === 'uploaded_time') return <td key="uploaded_time" className="border px-4 py-2">{formatTime(row.uploaded_at || row.created_at)}</td>;
                    if (col === 'updated_date') return <td key="updated_date" className="border px-4 py-2">{formatDate(row.updated_at)}</td>;
                    if (col === 'updated_time') return <td key="updated_time" className="border px-4 py-2">{formatTime(row.updated_at)}</td>;
                    if (type === 'qa' && (col === 'category' || col === 'subcategory')) {
                      return <td key={col} className="border px-4 py-2">{Array.isArray(row[col]) ? row[col].map(item => typeof item === 'object' ? item.name : item).join(', ') : ''}</td>;
                    }
                    if (col === 'knowledge_bases') {
                      return <td key={col} className="border px-4 py-2">{row[col] && row[col].length > 0 ? row[col].map((kb) => (typeof kb === 'string' ? kb : kb.name)).join(', ') : '-'}</td>;
                    }
                    if (col === 'url') {
                      return <td key={col} className="border px-4 py-2"><a href={row[col]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{row[col]}</a></td>;
                    }
                    // Add view button for files tab
                    if (col === 'view' && type === 'files') {
                      return (
                        <td key="view" className="border px-4 py-2 text-center">
                          {row.file ? (
                            <a
                              href={`${BASE_URL}${row.file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                      );
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
                  {!isMultiSelectMode && (
                    <td className="border px-4 py-2 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {editHandler && type === 'text' && (
                          <FaEdit
                            className="text-blue-500 cursor-pointer hover:text-blue-700"
                            onClick={() => editHandler(row)}
                            title="Edit"
                          />
                        )}
                        {type === 'qa' && (
                          <FaEdit
                            className="text-blue-500 cursor-pointer hover:text-blue-700"
                            onClick={() => handleQaEdit(row)}
                            title="Edit"
                          />
                        )}
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
                          title="Delete"
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
            fetchKnowledgeBases={fetchKnowledgeBases}
            onBulkDelete={handleBulkFileDelete}
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
            fetchKnowledgeBases={fetchKnowledgeBases}
            onBulkDelete={handleBulkTextDelete}
            handleTextEdit={handleTextEdit}
            textEditModalOpen={textEditModalOpen}
            setTextEditModalOpen={setTextEditModalOpen}
            editingText={editingText}
            handleTextEditSubmit={handleTextEditSubmit}
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
            fetchKnowledgeBases={fetchKnowledgeBases}
            onBulkDelete={handleBulkExcelDelete}
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
            onBulkDelete={handleBulkQADelete}
            qaEditModalOpen={qaEditModalOpen}
            setQaEditModalOpen={setQaEditModalOpen}
            editingQa={editingQa}
            handleQaEditSubmit={handleQaEditSubmit}
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
            onBulkDelete={handleBulkURLDelete}
          />
        );
      case 'Profile':
        return (
          <ProfileTab
            profiles={profiles}
            fetchProfiles={fetchProfiles}
            handleEditProfile={handleEditProfile}
            handleDeleteProfile={handleDeleteProfile}
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
            handleDeleteCategory={handleDeleteCategory}
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
      case 'Folder':
        return <FolderListTab onBulkDelete={handleBulkFolderDelete} />;
      case 'Google Drive':
        return <GoogleDrive />;
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
    if (qaModalOpen || qaEditModalOpen) {
      fetchKnowledgeBases();
      fetchCategories();
      fetchSubCategories();
    }
  }, [qaModalOpen, qaEditModalOpen]);

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
        const embedResponse = await axios.post(`${BASE_URL}/api/embed-website/`, { 
          url: urlForm.url,
          knowledge_bases: urlForm.knowledge_bases.length > 0 ? 
            knowledgeBases
              .filter(kb => urlForm.knowledge_bases.includes(String(kb.id)))
              .map(kb => kb.name) : []
        }, {
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
    // Validate knowledge base selection
    if (!qaForm.knowledge_bases || qaForm.knowledge_bases.length === 0) {
      setQaFormError('Please select at least one knowledge base.');
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
      // Add knowledge base names to the training payload
      selectedKbNames.forEach((name) => trainFormData.append('knowledge_bases', name));

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
    <div className="min-h-screen bg-gray-100">
      <div className="absolute top-4 right-8 flex items-center gap-2 z-50">
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setProfileDropdownOpen((open) => !open)}
          >
            <FaUserCircle className="text-2xl text-gray-500" />
            {userProfile && (
              <div className="flex flex-col items-start leading-tight">
                <span className="font-semibold text-gray-900 text-base">{userProfile.first_name} {userProfile.last_name}</span>
                <span className="text-sm text-gray-500">Profile: {userProfile.profile_name || userProfile.profile}</span>
              </div>
            )}
          </div>
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-32 text-sm bg-white rounded shadow-lg border z-50">
              <div
                className="px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-100"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="text-lg text-gray-700" />
                <span className="font-semibold text-gray-900 text-sm">Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
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
                  <div className="flex text-xs uppercase flex-col items-start pl-4">
                    {section.tabs.map(tab => (
                      <div
                        key={tab}
                        className={`cursor-pointer p-2 rounded-md w-full text-left ${
                          activeTab.toLowerCase() === tab.toLowerCase() ? 'bg-gray-500 text-white font-bold' : 'text-gray-600 hover:bg-gray-200'
                        }`}
                        onClick={() => handleTabClick(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
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
    </div>
  );
}

export default CreateAgent;

