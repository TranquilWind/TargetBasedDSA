window.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  setupNavigation(path);
  
  if (path === '/user') initUserPage();
  else if (path === '/public') initPublicPage();
  else if (path === '/logs') initDailyLogs();
});

function setupNavigation(currentPath) {
  // Create navigation bar if it doesn't exist already
  if (!document.querySelector('.navbar')) {
    const header = document.querySelector('.header');
    const navbar = document.createElement('div');
    navbar.className = 'navbar';
    
    navbar.innerHTML = `
      <div class="nav-container">
        <ul class="nav-links">
          <li><a href="/user" ${currentPath === '/user' ? 'class="active"' : ''}>My Dashboard</a></li>
          <li><a href="/public" ${currentPath === '/public' ? 'class="active"' : ''}>Public Leaderboard</a></li>
          <li><a href="/logs" ${currentPath === '/logs' ? 'class="active"' : ''}>Daily Logs</a></li>
        </ul>
      </div>
    `;
    
    // Insert navbar after header
    header.parentNode.insertBefore(navbar, header.nextSibling);
  }
}

async function initUserPage() {
  try {
    const res = await fetch('/progress/current');
    const data = await res.json();
    
    // Update user info card
    const info = document.getElementById('user-info');
    info.innerHTML = `
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Start Date:</strong> ${new Date(data.startDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      })}</p>
      <p><strong>Target:</strong> ${data.target} problems</p>
      <p><strong>Total Solved:</strong> ${data.totalSolved} problems</p>
      <p><strong>Total Active Days:</strong> <span id="total-days">${data.totalActiveDays}</span></p>
      <div class="progress-bar" style="margin-top: 20px; max-width: 400px; margin-left: auto; margin-right: auto;">
        <div class="progress-fill" style="width: ${Math.min(100, (data.totalSolved / data.target) * 100)}%">
          <span class="progress-text">${((data.totalSolved / data.target) * 100).toFixed(1)}%</span>
        </div>
      </div>
    `;
    
    // Set up logout button
    document.getElementById('logout').addEventListener('click', () => {
      window.location = '/logout';
    });
    
    // Set up topics table
    const topicsTable = document.getElementById('topics');
    topicsTable.innerHTML = ''; // Clear any existing content
    
    data.progress.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.topic}</td>
        <td><span id="count-${p.topic}" class="topic-count">${p.solved}</span></td>
        <td><button data-topic="${p.topic}">+</button></td>
      `;
      topicsTable.appendChild(tr);
    });
    
    // Set up click handler for increment buttons
    topicsTable.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') {
        const topic = e.target.dataset.topic;
        const span = document.getElementById(`count-${topic}`);
        span.textContent = parseInt(span.textContent) + 1;
      }
    });
    
    // Set up save progress button
    document.getElementById('save-progress').addEventListener('click', async () => {
      const updated = data.progress.map(p => ({
        topic: p.topic,
        solved: parseInt(document.getElementById(`count-${p.topic}`).textContent)
      }));
      
      try {
        const resp = await fetch('/progress/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress: updated })
        });
        
        const json = await resp.json();
        document.getElementById('logs').value = json.logs.flatMap(l => l.entries).join('\n');
        alert('Progress saved successfully!');
      } catch (error) {
        console.error('Error saving progress:', error);
        alert('Failed to save progress. Please try again.');
      }
    });
    
    // Set up update logs button
    document.getElementById('update-logs').addEventListener('click', async () => {
      const lines = document.getElementById('logs').value.split('\n').filter(l => l.trim());
      
      try {
        const resp = await fetch('/progress/update-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: [{ date: new Date(), entries: lines }] })
        });
        
        const json = await resp.json();
        if (json.totalActiveDays !== undefined) {
          document.getElementById('total-days').textContent = json.totalActiveDays;
        }
        alert('Logs updated successfully!');
      } catch (error) {
        console.error('Error updating logs:', error);
        alert('Failed to update logs. Please try again.');
      }
    });
    
    // Set up reset button
    document.getElementById('reset').addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all your data? This action cannot be undone.')) {
        try {
          await fetch('/progress/reset', { method: 'POST' });
          window.location = '/signup';
        } catch (error) {
          console.error('Error resetting data:', error);
          alert('Failed to reset data. Please try again.');
        }
      }
    });
    
  } catch (error) {
    console.error('Error initializing user page:', error);
    alert('Failed to load user data. Please try refreshing the page.');
  }
}

async function initPublicPage() {
  const res = await fetch('/public/data');
  const users = await res.json();
  const tbody = document.getElementById('public-table');
  
  // Sort users by percentage completion (descending)
  users.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
  
  users.forEach(user => {
    const tr = document.createElement('tr');
    
    // Format the date nicely
    const startDate = new Date(user.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    tr.innerHTML = `
      <td>${user.name}</td>
      <td>${startDate}</td>
      <td>${user.totalSolved}</td>
      <td>${user.target}</td>
        <td>
          <span class="progress-text" style="color: ${
          user.percentage >= 100 ? '#2ecc71' : 
          user.percentage >= 75 ? '#27ae60' : 
          user.percentage >= 50 ? '#f1c40f' : 
          user.percentage >= 25 ? '#e67e22' : '#e74c3c'
          }">${user.percentage}%</span>
        </td>
      <td>${user.totalActiveDays}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function initDailyLogs() {
  try {
    const res = await fetch('/logs/data');
    const data = await res.json();
    
    // If we have data, remove the "loading" message
    if (Object.keys(data).length > 0) {
      document.getElementById('no-logs').remove();
    }
    
    const container = document.getElementById('logs-container');
    
    // Sort dates in descending order (most recent first)
    Object.keys(data).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
      // Create date header
      const dateHeader = document.createElement('div');
      dateHeader.className = 'date-header';
      dateHeader.textContent = new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      container.appendChild(dateHeader);
      
      // For each user on this date
      Object.keys(data[date]).forEach(userName => {
        // Create user card
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        
        // Create user header
        const userHeader = document.createElement('div');
        userHeader.className = 'user-header';
        userHeader.textContent = userName;
        userCard.appendChild(userHeader);
        
        // Create list of entries for this user
        const logList = document.createElement('ul');
        logList.className = 'log-list';
        
        data[date][userName].forEach(entry => {
          const logItem = document.createElement('li');
          logItem.className = 'log-item';
          logItem.textContent = entry;
          logList.appendChild(logItem);
        });
        
        userCard.appendChild(logList);
        container.appendChild(userCard);
      });
      
      // Add a separator between dates
      if (date !== Object.keys(data).sort((a, b) => new Date(b) - new Date(a)).slice(-1)[0]) {
        const separator = document.createElement('div');
        separator.className = 'day-separator';
        container.appendChild(separator);
      }
    });
    
    // Show a message if no logs were found
    if (Object.keys(data).length === 0) {
      document.getElementById('no-logs').textContent = 'No logs found.';
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
    document.getElementById('no-logs').textContent = 'Error loading logs. Please try again later.';
  }
}