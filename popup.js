document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('tabs-container');
  
    // Function to group tabs by domain
    function groupTabsByDomain(tabs) {
      const groups = {};
  
      tabs.forEach((tab) => {
        const url = new URL(tab.url);
        const domain = url.hostname;
  
        if (!groups[domain]) {
          groups[domain] = [];
        }
        groups[domain].push(tab);
      });
  
      return groups;
    }
  
    // Function to display grouped tabs
    function displayGroupedTabs(groups) {
      container.innerHTML = '';
  
      for (const domain in groups) {
        const domainDiv = document.createElement('div');
        domainDiv.className = 'domain-group';
  
        const domainTitle = document.createElement('div');
        domainTitle.className = 'domain-title';
        domainTitle.innerText = domain;
        domainDiv.appendChild(domainTitle);
  
        groups[domain].forEach((tab) => {
          const tabDiv = document.createElement('div');
          tabDiv.className = 'tab';
  
          const tabTitle = document.createElement('span');
          tabTitle.innerText = tab.title;
          tabTitle.onclick = () => {
            chrome.tabs.update(tab.id, { active: true });
          };
          tabDiv.appendChild(tabTitle);
  
          const closeButton = document.createElement('button');
          closeButton.innerText = 'close';
          closeButton.className = 'close-tab';
          closeButton.onclick = () => {
            chrome.tabs.remove(tab.id);
            tabDiv.remove(); // Remove the tab from the UI
          };
          tabDiv.appendChild(closeButton);
  
          domainDiv.appendChild(tabDiv);
        });
  
        container.appendChild(domainDiv);
      }
    }
  
    // Load all tabs and display them grouped by domain
    chrome.tabs.query({}, (tabs) => {
      const groupedTabs = groupTabsByDomain(tabs);
      displayGroupedTabs(groupedTabs);
    });
  });
  