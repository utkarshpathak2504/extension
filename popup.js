document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded');
    console.log(chrome.storage);
  
    const container = document.getElementById('tabs-container');
  
    chrome.storage.local.get('tabs', (data) => {
      console.log(data); // Check if data is being retrieved correctly
  
      const groups = data.tabs || {};
  
      for (const domain in groups) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'tab-group';
        const domainHeader = document.createElement('h3');
        domainHeader.innerText = domain;
        groupDiv.appendChild(domainHeader);
  
        groups[domain].forEach((tab) => {
          const tabDiv = document.createElement('div');
          tabDiv.className = 'tab';
          tabDiv.innerText = tab.title;
          tabDiv.onclick = () => {
            chrome.tabs.update(tab.id, { active: true });
          };
          groupDiv.appendChild(tabDiv);
        });
  
        container.appendChild(groupDiv);
      }
    });
  });
  