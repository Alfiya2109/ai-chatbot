// Check if user is authenticated on page load
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('access_token');
  if (token) {
    showChatbot();
  }
});

// Toggle between login and registration forms
function toggleForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
  }
}

// Login user
async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  if (!username || !password) {
    alert('Username and password are required!');
    return;
  }
  
  try {
    const response = await fetch('/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    // Store tokens in localStorage
    localStorage.setItem('access_token', data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    
    // Show chatbot interface
    showChatbot();
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
}

// Register user
async function register() {
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const firstName = document.getElementById('register-firstname').value;
  const lastName = document.getElementById('register-lastname').value;
  const email = document.getElementById('register-email').value;
  const phone = document.getElementById('register-phone').value;
  const role = document.getElementById('register-role').value;
  
  try {
    const response = await fetch('/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
        role
      })
    });
    
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    
    const data = await response.json();
    // Store tokens in localStorage
    localStorage.setItem('access_token', data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    
    // Show chatbot interface
    showChatbot();
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
}

// Logout user
function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  document.getElementById('auth-container').style.display = 'block';
  document.getElementById('chatbot-container').style.display = 'none';
}

// Show chatbot interface
function showChatbot() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('chatbot-container').style.display = 'block';
}

// Ask question with JWT authentication
async function askQuestion() {
  const question = document.getElementById("userInput").value;
  const responseDiv = document.getElementById("response");
  
  if (!question) {
    responseDiv.textContent = "Please enter a question";
    return;
  }

  responseDiv.textContent = "Thinking...";
  
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      responseDiv.textContent = "Authentication required. Please login.";
      logout();
      return;
    }
    
    const response = await fetch("/api/chatbot/ask/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ question }),
    });
    
    // If token is expired, try to refresh
    if (response.status === 401) {
      const refreshSuccess = await refreshToken();
      if (refreshSuccess) {
        // Retry with new token
        return askQuestion();
      } else {
        // If refresh failed, logout
        logout();
        responseDiv.textContent = "Session expired. Please login again.";
        return;
      }
    }

    const data = await response.json();
    responseDiv.textContent = data.answer || "No response.";
  } catch (error) {
    responseDiv.textContent = "❌ Error: " + error.message;
  }
}

// Refresh token
async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch('/api/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    
    return true;
  } catch (error) {
    return false;
  }
}
  