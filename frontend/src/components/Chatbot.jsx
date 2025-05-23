import { useState, useRef, useEffect } from 'react'
  import { useNavigate } from 'react-router-dom'
  import { useAuth } from '../context/AuthContext'
  import { BASE_URL } from '../base_url';
  import { FaMicrophone } from "react-icons/fa";
import { FaStop } from "react-icons/fa6";
import { IoSend } from "react-icons/io5";
import { FaRobot } from "react-icons/fa";


  const API_BASE_URL = BASE_URL;

  // SVG Icons
  const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );

  const RobotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.75 6.75 0 111.5 0v4.661c0 .326.277.585.6.544.364-.047.722-.112 1.074-.195a.75.75 0 00.577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0012 .75z" />
      <path fillRule="evenodd" d="M9.75 10.5a1.5 1.5 0 013 0v.75a.75.75 0 001.5 0v-.75a3 3 0 00-6 0v.75a.75.75 0 001.5 0v-.75z" clipRule="evenodd" />
      <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" />
      <path d="M19.741 17.242a.75.75 0 01.897-1.203 5.243 5.243 0 012.05 5.022.75.75 0 01-.625.627 5.243 5.243 0 01-5.022-2.051.75.75 0 111.203-.897 3.744 3.744 0 003.008 1.51 3.744 3.744 0 00-1.51-3.008z" />
    </svg>
  );


function Chatbot() {
  const [question, setQuestion] = useState('')
      const [loading, setLoading] = useState(false)
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [isTranscribing, setIsTranscribing] = useState(false);
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

  const ChatDotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.75 6.75 0 111.5 0v4.661c0 .326.277.585.6.544.364-.047.722-.112 1.074-.195a.75.75 0 00.577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0012 .75z" />
      <path fillRule="evenodd" d="M9.75 10.5a1.5 1.5 0 013 0v.75a.75.75 0 001.5 0v-.75a3 3 0 00-6 0v.75a.75.75 0 001.5 0v-.75z" clipRule="evenodd" />
      <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" />
      <path d="M19.741 17.242a.75.75 0 01.897-1.203 5.243 5.243 0 012.05 5.022.75.75 0 01-.625.627 5.243 5.243 0 01-5.022-2.051.75.75 0 111.203-.897 3.744 3.744 0 003.008 1.51 3.744 3.744 0 00-1.51-3.008z" />
    </svg>
  );




    // Scroll to bottom when messages change
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])
    
    const handleSubmit = async (e) => {
      e.preventDefault()
      
      if (!question.trim()) return
      
      // Add user message
      const userMessage = {
        id: Date.now(),
        text: question,
        sender: 'user',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      
      setMessages(prevMessages => [...prevMessages, userMessage])
      setQuestion('')
      setLoading(true)
      
      try {
        let token = currentUser?.token || localStorage.getItem('access_token')
        
        if (!token) {
          addBotMessage('Authentication required. Please login.')
          logout()
          return
        }
        
        let response = await fetch(`${API_BASE_URL}/api/chatbot/ask/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ question: userMessage.text }),
        })
        
        // If token is expired, try to refresh
        if (response.status === 401) {
          token = await refreshToken()
          
          if (!token) {
            addBotMessage('Session expired. Please login again.')
            return
          }
          
          // Retry with new token
          response = await fetch(`${API_BASE_URL}/api/chatbot/ask/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ question: userMessage.text }),
          })
        }
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const data = await response.json()
        addBotMessage(data.answer || 'No response from chatbot.')
      } catch (error) {
        addBotMessage(`Error: ${error.message}`)
      } finally {
        setLoading(false)
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

    return (
      <div className="min-h-screen h-full min-w-[50%] w-full bg-blue-100 flex items-center justify-center p-4 py-8">
        <div className="chat-container" style={{ maxWidth: '50vw', overflowY: 'auto' }}>
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-title">
              <div className="chat-logo">
                <FaRobot size={28}/>
              </div>
              <div>
                <h3>AI Assistant</h3>
                <div className="chat-subtitle">ONLINE</div>
              </div>
            </div>
            <div className="flex space-x-2 mt-2">
              {isSalesUser && (
                <>
                  <button
                    onClick={handleTrainClick}
                    className="bg-blue-900 hover-bg-indigo-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                  >
                    Train
                  </button>
                  
                </>
              )}
              {!isSalesUser && !isNormalUser && (
                <>
                  <button
                    onClick={handleConfigClick}
                    className="bg-blue-900 hover-bg-indigo-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                  >
                    History
                  </button>
                  <button
                    onClick={handleTrainClick}
                    className="bg-blue-900 hover-bg-indigo-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                  >
                    Admin 
                  </button>
                </>
              )}
              <button
                onClick={logout}
                className="bg-red-500 hover-bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          {/* Chat Body with Messages */}
          <div className="chat-body">
            <div className="chat-messages">
              {messages.map((message) => (
                <div key={message.id} className={message.sender === 'user' ? 'message message-user' : 'message-with-avatar'}>
                  {message.sender === 'bot' && (
                    <div className="message-avatar flex-shrink-0 ">
                      <FaRobot size={18}/>
                    </div>
                  )}
                  <div className={message.sender === 'user' ? '' : 'message message-bot message-content'}>
                    <div>{message.text}</div>
                    <div className="message-time">{message.time}</div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick Options */}
            <div className="chat-options">
              {quickOptions.map((option, index) => (
                <div 
                  key={index} 
                  className="chat-option"
                  onClick={() => handleOptionClick(option)}
                >
                  {option.startsWith("What") ? "👋 " : option === "Pricing" ? "📊 " : "📚 "}
                  {option}
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat Footer with Input */}
          <div className="chat-footer">
            <form onSubmit={handleSubmit}>
              <div className="chat-input-container flex items-center">
                <input
                  type="text"
                  className=" border-none focus:border-0 focus:ring-0 w-full h-12 text-gray-700 placeholder-gray-400"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={isTranscribing ? 'Transcribing...' : 'Type your message here...'}
                  disabled={loading || isTranscribing}
                />
                <button
                  type="button"
                  className={`ml-2 chat-mic-button ${isRecording ? 'bg-red-200' : 'bg-gray-200'} size-12 rounded-full   `}
                  onClick={handleMicClick}
                  title={isRecording ? 'Stop Recording' : 'Start Recording'}
                  disabled={isTranscribing}
                >
                  {isRecording ? (
                    <FaStop/> 
                  ) : (
                    <FaMicrophone/>
                  )}
                </button>
                <button
                  type="submit"
                  className="chat-send-button ml-2"
                  disabled={loading || !question.trim() || isTranscribing}
                >
                  <IoSend />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  export default Chatbot