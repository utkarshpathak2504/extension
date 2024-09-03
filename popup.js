const fiveDaysInMillis = 3 * 24 * 60 * 60 * 1000; // For testing, set to 30 minutes
let allTabs = {};
let filteredTabs = {};

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('tabs-container');
    const domainSearch = document.getElementById('domain-search');
    const domainFilter = document.getElementById('domain-filter');

    // Function to group tabs by domain
    function groupTabsByDomain(tabs) {
        const groups = {};
        
        tabs.forEach((tab) => {
            const tabId = tab.id;
            const url = new URL(tab.url);
            const domain = url.hostname;
            // const memoryUsage = Math.floor(Math.random() * 100); // Mock memory usage
            const lastActiveTime = tab.lastAccessed // Mock last active time

            if (!groups[domain]) {
                groups[domain] = [];
            }
            groups[domain].push({ ...tab, lastActive: lastActiveTime });
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

            // Calculate total tabs and memory usage for the domain
            const tabCount = groups[domain].length;
            // const memoryUsage = (tabCount * 10).toFixed(2); // Rough estimate (10MB per tab)

            domainTitle.innerText = `${domain} (Tabs: ${tabCount})`;
            domainDiv.appendChild(domainTitle);

            groups[domain].forEach((tab) => {
                const tabDiv = document.createElement('div');
                tabDiv.className = `tab ${Date.now() - tab.lastActive > fiveDaysInMillis ? 'inactive-tab' : ''}`;
                tabDiv.setAttribute('title', 'Inactive');
                //  tabDiv.title = 'Inactive for more than 5 days';

                const tabTitle = document.createElement('span');
                tabTitle.innerText = tab.title;

                tabTitle.onclick = () => {
                    chrome.windows.getCurrent({ populate: true }, (currentWindow) => {
                        let found = false;

                        // First, check in the current window
                        for (const t of currentWindow.tabs) {
                            if (t.id === tab.id) {
                                // If the tab is found in the current window, activate it
                                chrome.tabs.update(t.id, { active: true });
                                found = true;
                                break;
                            }
                        }

                        // If not found in the current window, check other windows
                        if (!found) {
                            chrome.windows.getAll({ populate: true }, (windows) => {
                                for (const window of windows) {
                                    for (const t of window.tabs) {
                                        if (t.id === tab.id) {
                                            // If the tab is found in another window, focus that window
                                            chrome.windows.update(window.id, { focused: true }, () => {
                                                chrome.tabs.update(t.id, { active: true });
                                            });
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (found) break;
                                }

                                // If the tab is still not found, activate it in the current window
                                if (!found) {
                                    chrome.tabs.update(tab.id, { active: true });
                                }
                            });
                        }
                    });
                };

                tabDiv.appendChild(tabTitle);

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'tab-actions';

                // Pin/Unpin Button
                const pinButton = document.createElement('button');
                pinButton.innerHTML = `<img src="./pushpin.png" alt="Pin" height="20px" />`;
                pinButton.title = 'Pin/Unpin Tab';
                pinButton.className = 'pin-tab';
                pinButton.onclick = () => {
                    chrome.tabs.update(tab.id, { pinned: !tab.pinned }, () => {
                        tab.pinned = !tab.pinned;
                        pinButton.innerHTML = tab.pinned
                            ? `<img src="./pushpin.png" alt="Unpin" height="20px" />`
                            : `<img src="./unpin_icon.png" alt="Pin" height="20px" />`;
                    });
                };
                actionsDiv.appendChild(pinButton);

                // Bookmark Button with Tooltip
                const bookmarkButton = document.createElement('button');
                bookmarkButton.innerHTML = `<img src="./star.png" alt="Bookmark" height="20px" />`;
                bookmarkButton.title = 'Move to bookmarks';
                bookmarkButton.onclick = () => {
                    chrome.bookmarks.create({
                        title: tab.title,
                        url: tab.url,
                    }, () => {
                    alert('Tab added to bookmarks!');
                    });
                };
                actionsDiv.appendChild(bookmarkButton);

                // Close Button
                const closeButton = document.createElement('button');
                closeButton.innerHTML = `<img src="./cross.png" alt="Close" height="20px" />`;
                closeButton.title = 'Close';
                closeButton.className = 'close-tab';
                closeButton.onclick = () => {
                    chrome.tabs.remove(tab.id, () => {
                        // Check if the tab was successfully removed
                        if (chrome.runtime.lastError) {
                            console.error('Error closing tab:', chrome.runtime.lastError);
                            return;
                        }
                        
                        // Remove the tab from the current group
                        groups[domain] = groups[domain].filter(t => t.id !== tab.id);
                        
                        // If the domain has no remaining tabs, remove it from the display
                        if (groups[domain].length === 0) {
                            delete groups[domain]; // Remove the domain from the groups
                            domainDiv.remove(); // Remove the domain div from the UI
                        } else {
                            // Update the displayed tabs for that domain
                            displayGroupedTabs(groups);
                    }
                    });
                };
                actionsDiv.appendChild(closeButton);

                tabDiv.appendChild(actionsDiv);
                domainDiv.appendChild(tabDiv);
            });

            container.appendChild(domainDiv);
        }
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

    // Filter domains based on search and dropdown
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

    // Attach event listeners
    domainSearch.addEventListener('input', () => {
        domainFilter.value = ""; // Reset the dropdown to "All Domains"
        filterDomains();
    });

    domainFilter.addEventListener('change', filterDomains);
});
