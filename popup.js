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
                closeButton.title='close';
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
