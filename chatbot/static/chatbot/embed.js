// Minimal embed.js for chatbot widget
(function() {
  var container = document.getElementById('chatbot-container');
  if (!container) return;
  var botId = null;
  // Find the script tag with data-bot-id
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].getAttribute('src') && scripts[i].getAttribute('src').includes('embed.js')) {
      botId = scripts[i].getAttribute('data-bot-id');
      break;
    }
  }
  if (!botId) {
    container.innerHTML = '<div style="color:red">Chatbot: bot_id missing</div>';
    return;
  }
  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.src = 'http://127.0.0.1:8000/api/embed/' + botId + '/';
  iframe.style.width = '100%';
  iframe.style.height = '500px';
  iframe.style.border = '1px solid #ccc';
  iframe.setAttribute('title', 'Chatbot Widget');
  container.appendChild(iframe);
})();
