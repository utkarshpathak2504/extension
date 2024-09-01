document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('tabs-container');
    const domainSearch = document.getElementById('domain-search');
    const domainFilter = document.getElementById('domain-filter');
  
    let allTabs = {};
    let filteredTabs = {};
  
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
  
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'tab-actions';
  
          const pinButton = document.createElement('button');
          pinButton.innerText = tab.pinned ? 'Unpin' : 'Pin';
          pinButton.className = 'pin-tab';
          pinButton.onclick = () => {
            chrome.tabs.update(tab.id, { pinned: !tab.pinned }, () => {
              tab.pinned = !tab.pinned;
              pinButton.innerText = tab.pinned ? 'Unpin' : 'Pin';
            });
          };
          actionsDiv.appendChild(pinButton);
  
          const closeButton = document.createElement('button');
          closeButton.innerText = 'close';
          closeButton.className = 'close-tab';
          closeButton.onclick = () => {
            chrome.tabs.remove(tab.id);
            tabDiv.remove(); // Remove the tab from the UI
          };
          actionsDiv.appendChild(closeButton);
  
          tabDiv.appendChild(actionsDiv);
          domainDiv.appendChild(tabDiv);
        });
  
        container.appendChild(domainDiv);
      }
    }
  
    // Function to filter domains based on search and dropdown
    function filterDomains() {
      const searchText = domainSearch.value.toLowerCase();
      const selectedDomain = domainFilter.value;
  
      filteredTabs = {};
  
      for (const domain in allTabs) {
        if (
          (!selectedDomain || domain === selectedDomain) &&
          domain.toLowerCase().includes(searchText)
        ) {
          filteredTabs[domain] = allTabs[domain];
        }
      }
  
      displayGroupedTabs(filteredTabs);
    }
  
    // Load all tabs and initialize the filter options
    chrome.tabs.query({}, (tabs) => {
      allTabs = groupTabsByDomain(tabs);
      filteredTabs = { ...allTabs };
  
      // Populate the domain filter dropdown
      const domains = Object.keys(allTabs);
      domains.forEach((domain) => {
        const option = document.createElement('option');
        option.value = domain;
        option.innerText = domain;
        domainFilter.appendChild(option);
      });
  
      displayGroupedTabs(filteredTabs);
    });
  
    // Reset dropdown to "All Domains" when typing in the search bar
    domainSearch.addEventListener('input', () => {
      domainFilter.value = ""; // Reset the dropdown to "All Domains"
      filterDomains();
    });
  
    // Attach event listeners
    domainFilter.addEventListener('change', filterDomains);
  });
  