import React, { useState, useRef, useEffect } from 'react'
  import { useNavigate } from 'react-router-dom'
  import { useAuth } from '../context/AuthContext'
  import { BASE_URL } from '../base_url';
import { IoMicOutline } from "react-icons/io5";
import { FaStop } from "react-icons/fa6";
import { IoSend } from "react-icons/io5";
import { FaRobot } from "react-icons/fa";
import { FaSearch, FaPlus, FaBook, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { BsLayoutSidebar } from "react-icons/bs";
import { IoSearchOutline } from "react-icons/io5";
import axios from 'axios';
import { FaTrash, FaEllipsisV } from "react-icons/fa"; // Add FaEllipsisV

  const API_BASE_URL = BASE_URL;

  // SVG Icons
  const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );



function SearchChatsModal({ open, onClose, chatSessions, onSessionSelect }) {
  const [search, setSearch] = useState('');
  const filteredSessions = chatSessions.filter(session =>
    session.title?.toLowerCase().includes(search.toLowerCase())
  );
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background: 'rgba(243,244,246,0.5)'}}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-semibold mb-4">Search chats...</h2>
        <input
          type="text"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring"
          placeholder="Search chats..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto">
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium mb-2"
            onClick={() => { onSessionSelect(null); onClose(); }}
          >
            New chat
          </button>
          {filteredSessions.length === 0 && (
            <div className="text-xs text-gray-400 pl-2">No chats found</div>
          )}
          {filteredSessions.map(session => (
            <button
              key={session.id}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              onClick={() => { onSessionSelect(session.id); onClose(); }}
            >
              <span className="truncate">{session.title || `Chat #${session.id}`}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Chatbot() {
  const [question, setQuestion] = useState('')
      const [loading, setLoading] = useState(false)
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { currentUser, logout, refreshToken } = useAuth()
    const navigate = useNavigate()
    const messagesEndRef = useRef(null)
    
    const isSalesUser = currentUser?.role === 'sales'
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: 'Hi there! I\'m your Web Assistant. How can I help you today?', 
      sender: 'bot', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ])


  const isNormalUser = currentUser?.role === 'user' || !currentUser?.role

  const [chatSessions, setChatSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Profile dropdown state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null); // Add this state

    // Scroll to bottom when messages change
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])
    
    // Fetch chat sessions (refactored for reuse)
    const fetchChatSessions = async () => {
      try {
        let token = currentUser?.token || localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/chatsessions/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch chat sessions');
        const data = await response.json();
        setChatSessions(data);
      } catch (err) {
        setChatSessions([]);
      }
    };

    useEffect(() => {
      if (sidebarOpen) fetchChatSessions();
    }, [sidebarOpen, currentUser]);

    useEffect(() => {
      // Fetch current user profile on mount
      const fetchUserProfile = async () => {
        try {
          const token = currentUser?.token || localStorage.getItem('access_token');
          const response = await axios.get(`${API_BASE_URL}/api/userprofiles/me/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserProfile(response.data.userprofile);
        } catch (error) {
          setUserProfile(null);
        }
      };
      fetchUserProfile();
    }, [currentUser]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!question.trim()) return;

      // Add user message
      const userMessage = {
        id: Date.now(),
        text: question,
        sender: 'user',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setQuestion('');
      setLoading(true);

      try {
        let token = currentUser?.token || localStorage.getItem('access_token');
        if (!token) {
          addBotMessage('Authentication required. Please login.');
          logout();
          return;
        }

        let sessionId = activeSession;
        let sessionTitle = 'New Chat';
        let sessionCreated = false;
        // If no session, first summarize the question and create a session with that title
        if (!sessionId) {
          // 1. Summarize the question
          const summaryRes = await fetch(`${API_BASE_URL}/api/chatbot/summarize/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ text: userMessage.text }),
          });
          if (!summaryRes.ok) throw new Error('Failed to summarize question');
          const summaryData = await summaryRes.json();
          sessionTitle = summaryData.summary || summaryData.title || userMessage.text.slice(0, 30);
          // 2. Create new session with generated title
          const sessionRes = await fetch(`${API_BASE_URL}/api/chatsessions/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ title: sessionTitle }),
          });
          if (!sessionRes.ok) throw new Error('Failed to create chat session');
          const sessionData = await sessionRes.json();
          sessionId = sessionData.id;
          setActiveSession(sessionId);
          setChatSessions(prev => [{...sessionData, chat_logs: []}, ...prev]);
          sessionCreated = true;
        }

        // Create ChatLog entry directly
        let response = await fetch(`${API_BASE_URL}/api/ask/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ question: userMessage.text, session: sessionId }),
        });

        // If token is expired, try to refresh
        if (response.status === 401) {
          token = await refreshToken();
          if (!token) {
            addBotMessage('Session expired. Please login again.');
            return;
          }
          // Retry with new token
          response = await fetch(`${API_BASE_URL}/api/ask/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ question: userMessage.text, session: sessionId }),
          });
        }

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        addBotMessage(data.gpt_answer || data.answer || 'No response from chatbot.');
        // Always refresh chat sessions after a new session or message
        await fetchChatSessions();
      } catch (error) {
        addBotMessage(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    const addBotMessage = (text) => {
      const botMessage = {
        id: Date.now(),
        text,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prevMessages => [...prevMessages, botMessage])
    }
    
    const handleConfigClick = () => {
      navigate('/config')
    }

    const handleTrainClick = () => {
      navigate('/train')
    }

    const handleOptionClick = (option) => {
      setQuestion(option)
    }

    // Logout handler
    const handleLogout = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      logout(); // Use the logout from AuthContext
      navigate('/login');
    }
    
    // Sample quick options
    const quickOptions = [
      "Pricing",
      "FAQs"
      
    ]
    
    // Microphone logic
    const handleMicClick = async () => {
      if (isRecording) {
        if (mediaRecorder) {
          mediaRecorder.stop();
        }
        setIsRecording(false);
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new window.MediaRecorder(stream);
          setMediaRecorder(recorder);
          let localChunks = [];
          recorder.ondataavailable = (e) => {
            localChunks.push(e.data);
          };
          recorder.onstop = async () => {
            const audioBlob = new Blob(localChunks, { type: 'audio/webm' });
            await handleTranscribe(audioBlob);
          };
          recorder.start();
          setIsRecording(true);
        } catch (err) {
          alert('Microphone access denied or not available.');
        }
      }
    };

    const handleTranscribe = async (audioBlob) => {
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        let token = currentUser?.token || localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/transcribe/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // 'Content-Type' should NOT be set when sending FormData
          },
          body: formData
        });
        if (!response.ok) throw new Error('Transcription failed');
        const data = await response.json();
        // Show transcript in input box
        setQuestion(data.transcript || '');
      } catch (err) {
        alert('Transcription failed.');
      } finally {
        setIsTranscribing(false);
      }
    };

    // When a session is selected, show its chat_logs directly from chatSessions
    const handleSessionClick = (sessionId) => {
      const session = chatSessions.find(s => s.id === sessionId);
      if (!session) return;
      // Convert chat_logs to messages format
      const chatMessages = [
        { id: 1, text: "Hi there! I'm your Web Assistant. How can I help you today?", sender: 'bot', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...((session.chat_logs || []).map(log => [
          {
            id: log.id + '-q',
            text: log.question,
            sender: 'user',
            time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          },
          {
            id: log.id + '-a',
            text: log.gpt_answer,
            sender: 'bot',
            time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          }
        ]).flat())
      ];
      setMessages(chatMessages);
      setActiveSession(sessionId);
    };

    // Helper: Format bot answer with bold and links
function formatBotAnswer(text) {
  // Replace **bold** with <strong>bold</strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Replace [text](url) with <a ...>text</a>
  formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">$1</a>');
  // Also handle [text]http... (your style)
  formatted = formatted.replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">$1</a>');
  formatted = formatted.replace(/\[(.*?)\]\s*(https?:\/\/[^\s)]+)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">$1</a>');
  return formatted;
}

    // Add this function inside your Chatbot component
const handleDeleteSession = async (sessionId) => {
  if (!window.confirm("Delete this chat? This cannot be undone.")) return;
  try {
    let token = currentUser?.token || localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/chatsessions/${sessionId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to delete chat session');
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSession === sessionId) {
      setActiveSession(null);
      setMessages([
        { 
          id: 1, 
          text: 'Hi there! I\'m your Web Assistant. How can I help you today?', 
          sender: 'bot', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    }
  } catch (err) {
    alert('Failed to delete chat.');
  }
};

    return (
      <div className="flex overflow-auto bg-gray-100">
        {/* Sidebar */}
        <div className="relative">
          <div
            className={`fixed top-0 left-0 h-full z-30 transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64`}
            style={{ willChange: 'transform' }}
          >
            <aside className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-scroll flex flex-col h-full">
              <div className="flex items-center justify-between gap-2 pl-4 pr-2 py-2   ">
                <FaRobot className="text-black text-2xl" />
             
                <button onClick={() => setSidebarOpen(false)} className="focus:outline-none">
                  <BsLayoutSidebar className="text-gray-500 font-extrabold hover:cursor-pointer text-xl" />
                </button>
              </div>
              <nav className="text-sm flex-1 px-2 py-2 space-y-1 overflow-y-auto">
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                  onClick={() => window.location.reload()}
                >
                  <FiEdit /> New chat
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                  onClick={() => setSearchModalOpen(true)}
                >
                  <IoSearchOutline className='text-xl font-semibold' /> Search chats
                </button>
                {/* List chat sessions */}
                <div className="mt-4">
                  <div className="text-xs text-gray-400 mb-2 pl-2">Your Chats</div>
                  {chatSessions.length === 0 && (
                    <div className="text-xs text-gray-400 pl-2">No chats found</div>
                  )}
                  {chatSessions.map(session => (
                    <div key={session.id} className="flex items-center group relative">
                      <button
                        className={`flex-1 text-left flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 ${activeSession === session.id ? 'bg-gray-200' : ''}`}
                        style={{ minWidth: 0 }}
                        onClick={() => handleSessionClick(session.id)}
                        type="button"
                      >
                        <span className="truncate">{session.title || `Chat #${session.id}`}</span>
                      </button>
                      <button
                        className="ml-1 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                        title="More"
                        onClick={e => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === session.id ? null : session.id);
                        }}
                        tabIndex={-1}
                        type="button"
                        style={{ flex: "none" }}
                      >
                        <FaEllipsisV className="text-sm" />
                      </button>
                      {/* Dropdown menu */}
                      {menuOpenId === session.id && (
                        <div className="absolute right-0 top-8 z-50 bg-white border rounded shadow text-sm min-w-[100px]">
                          <button
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                            onClick={e => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              handleDeleteSession(session.id);
                            }}
                          >
                            <FaTrash className="text-xs" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Add more sidebar items as needed */}
              </nav>
              
            </aside>
          </div>
          {/* Sidebar open/close button (when sidebar is closed) */}
          {!sidebarOpen && (
            <button
              className="fixed top-4 left-4 z-40 bg-gray-50 border border-gray-200 rounded-xl p-2 shadow focus:outline-none transition-all duration-300"
              onClick={() => setSidebarOpen(true)}
            >
              <BsLayoutSidebar className="text-gray-500 hover:cursor-pointer font-extrabold text-xl" />
            </button>
          )}
        </div>
        {/* Main Chat Area */}
        <main className={`transition-all duration-300 flex-1 h-screen flex flex-col items-center justify-center bg-white ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {/* Header with AI Chatbot and user icon */}
          <div className="w-full flex items-center justify-between px-8 pt-2 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-800">AI Chatbot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => setProfileDropdownOpen((open) => !open)}
                >
                  <FaUserCircle className="text-2xl text-gray-500" />
                  {userProfile && (
                    <div className="flex flex-col items-start leading-tight">
                      <span className="font-semibold text-gray-900 text-base">
                        {userProfile.first_name} {userProfile.last_name}
                      </span>
                      <span className="text-sm text-gray-500">
                        Profile: {userProfile.profile_name || userProfile.profile}
                      </span>
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
          </div>
          <div className={`${sidebarOpen ? 'max-w-2xl' : 'max-w-3xl'} w-full  mx-auto flex flex-col items-center justify-center h-full relative`}>
            <h1 className={`text-3xl font-semibold  text-gray-800 text-center  ${messages.length > 1 ? 'fixed bottom-0 hidden left-1/2 -translate-x-1/2 max-w-xl z-10' : 'mx-auto mt-6'}`} >
              What can I help with?
            </h1>
            {/* Chat message area */}
            <div className={`flex flex-col w-full gap-4 ${messages.length > 1 ? 'pb-2' : ''}  overflow-y-auto no-scrollbar`} style={{maxHeight: '70vh'}}>
              {messages.slice(1).map((message, idx) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>  
                  <div className={`rounded-xl px-4 py-3 max-w-[80%] shadow text-base whitespace-pre-line ${
                    message.sender === 'user'
                      ? 'bg-gray-100 text-black rounded-full'
                      : 'bg-white text-gray-900 border-none shadow-none'
                  }`}>
                    {message.sender === 'bot' ? (
                      // Table UI fix: wrap HTML tables in a scrollable div for wide tables
                      <span>
                        {/* If the bot answer contains a table, wrap it in a scrollable container */}
                        {message.text && message.text.includes('<table') ? (
                          <div style={{ overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
                            <style>{`
                              .ai-chat-table { border-collapse: collapse; width: 100%; }
                              .ai-chat-table th, .ai-chat-table td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
                              .ai-chat-table th { background: #f3f4f6; white-space: nowrap; font-weight: 600; }
                              .ai-chat-table td { background: #fff; }
                            `}</style>
                            <div style={{ width: '100%', display: 'inline-block' }}>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: formatBotAnswer(
                                    message.text.replace(
                                      /<table(.*?)>/,
                                      '<table class="ai-chat-table"$1>'
                                    )
                                  )
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span dangerouslySetInnerHTML={{ __html: formatBotAnswer(message.text) }} />
                        )}
                      </span>
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))}

              {/* Typing loader */}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-xl px-4 py-3 max-w-[80%] bg-white text-gray-900 border-none shadow-none flex items-center gap-2">
                    <span>
                      <svg className="animate-spin h-5 w-5 text-gray-400 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      AI is typing...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
            
            
            <form
              className={`flex items-center bg-white rounded-full shadow px-4 py-2 ${sidebarOpen ? 'max-w-2xl' : 'max-w-3xl'} ${messages.length > 1 ? 'absolute bottom-4 left-1/2 -translate-x-1/2  w-[95%] z-10' : 'mx-auto mt-6 w-full'} `}
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                className="flex-1 outline-none border-none bg-transparent text-md px-2 "
                placeholder="Ask anything"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                disabled={loading || isTranscribing}
              />
              <button type="button" className="mx-2 text-gray-500 bg-white" onClick={handleMicClick} disabled={isTranscribing}>
                {isRecording ? <FaStop className="text-2xl text-black" /> : <IoMicOutline className="text-2xl text-black" />}
              </button>
              <button
                type="submit"
                className="text-white bg-white hover:bg-gray-100 rounded-full p-2"
                disabled={loading || !question.trim() || isTranscribing}
              >
                <IoSend className="text-xl text-black" />
              </button>
            </form>
          </div>
        </main>
        <SearchChatsModal
          open={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          chatSessions={chatSessions}
          onSessionSelect={handleSessionClick}
        />
      </div>
    )
}