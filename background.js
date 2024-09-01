chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });
  
  chrome.tabs.onUpdated.addListener(() => {
    chrome.storage.local.set({ tabs: [] }, () => {
      chrome.tabs.query({}, (tabs) => {
        const groupedTabs = tabs.reduce((groups, tab) => {
          const domain = new URL(tab.url).hostname;
          if (!groups[domain]) {
            groups[domain] = [];
          }
          groups[domain].push(tab);
          return groups;
        }, {});
  
        chrome.storage.local.set({ tabs: groupedTabs });
      });
    });
  });
  