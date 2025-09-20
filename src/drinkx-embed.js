import './drinkx-embed.css';

// Menu Embed Widget - Standalone JavaScript Bundle
(function(window, document) {
    'use strict';

    // Utility functions
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function createElement(tag, className = '', innerHTML = '') {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    }

    function sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Main Menu Embed Class
    class MenuEmbed {
        constructor(containerId, options = {}) {
            this.containerId = containerId;
            this.container = document.getElementById(containerId);
            this.options = {
                venueId: options.venueId,
                apiUrl: options.apiUrl || 'https://business.untappd.com/api',
                theme: options.theme || 'light',
                showSearch: options.showSearch !== false,
                showRatings: options.showRatings !== false,
                showPrices: options.showPrices !== false,
                ...options
            };
            
            this.menuData = null;
            this.originalMenuData = null;
            this.searchQuery = '';
            this.isSearchActive = false;
            this.currentDisplayMenu = null;
            
            this.init();
        }

        async init() {
            if (!this.container) {
                console.error(`Container with ID "${this.containerId}" not found`);
                return;
            }

            this.render();
            await this.loadMenuData();
        }



        render() {
            this.container.innerHTML = `
                <div class="menu-embed-container">
                    <div class="menu-embed-loading">Loading menu...</div>
                </div>
            `;
        }

        async loadMenuData() {
            try {
                const response = await fetch(`${this.options.apiUrl}/menu/${this.options.venueId}`);
                const rawData = await response.json();
                
                // Transform the menu data to match your structure (same as getMenu())
                const transformedMenu = rawData
                    .filter(item => !item.isSubSection)
                    .map(section => ({
                        ...section,
                        isExpanded: false,
                        subSections: rawData
                            .filter(item => item.isSubSection && item.parentSectionId === section.id)
                            .map(({id, sectionName, sectionOrder}) => ({
                                id, 
                                sectionName, 
                                sectionOrder,
                                isExpanded: false,
                                sectionMenu: [],
                                isLoading: false
                            }))
                    }));
                
                this.menuData = { menu: transformedMenu };
                this.originalMenuData = JSON.parse(JSON.stringify(this.menuData));
                this.currentDisplayMenu = this.menuData;
                
                this.renderMenu();
            } catch (error) {
                console.error('Failed to load menu data:', error);
                this.container.innerHTML = `
                    <div class="menu-embed-container">
                        <div class="menu-embed-empty">Failed to load menu. Please try again later.</div>
                    </div>
                `;
            }
        }

        renderMenu() {
            const menu = this.currentDisplayMenu;
            const sectionCount = (menu.menu && menu.menu.length) || 0;
            
            let html = `
                <div class="menu-embed-container">
                    <div class="menu-embed-header">
                        <p class="menu-embed-section-count">${sanitizeHTML(sectionCount)} Sections On The Menu</p>
                    </div>
            `;
            
            if (this.options.showSearch) {
                html += `
                    <input type="text" class="menu-embed-search" placeholder="Search menu..." value="${sanitizeHTML(this.searchQuery)}">
                `;
            }
            
            if (menu.menu && menu.menu.length > 0) {
                html += '<div class="menu-embed-sections">';
                menu.menu.forEach((section, index) => {
                    html += this.renderSection(section, index);
                });
                html += '</div>';
            } else {
                html += '<div class="menu-embed-empty">This venue hasn\'t added any drinks to their menu yet.</div>';
            }
            
            html += '</div>';
            
            this.container.innerHTML = html;
            this.bindEvents();
        }

        renderSection(section, index) {
            const isExpanded = section.isExpanded;
            const chevronClass = isExpanded ? 'expanded' : '';
            
            let html = `
                <div class="menu-embed-section" data-section-index="${index}">
                    <div class="menu-embed-section-header" data-section-toggle="${index}">
                        <h6 class="menu-embed-section-title">${sanitizeHTML(section.sectionName)}</h6>
                        <span class="menu-embed-chevron ${chevronClass}">▼</span>
                    </div>
                    <div class="menu-embed-section-content ${isExpanded ? '' : 'collapsed'}" data-section-content="${index}">
            `;
            
            if (section.isLoading) {
                html += '<div class="menu-embed-loading">Loading...</div>';
            } else {
                // Render subsections
                if (section.subSections && section.subSections.length > 0) {
                    section.subSections.forEach(subSection => {
                        html += this.renderSubSection(subSection);
                    });
                }
                
                // Render direct section items
                if (section.sectionMenu && section.sectionMenu.length > 0) {
                    section.sectionMenu.forEach(item => {
                        html += this.renderMenuItem(item);
                    });
                    
                    // Pagination
                    if (section.pagination && section.pagination.total_pages > 1) {
                        html += this.renderPagination(section.pagination, index);
                    }
                }
                
                // Empty state
                if ((!section.subSections || section.subSections.length === 0) && 
                    (!section.sectionMenu || section.sectionMenu.length === 0)) {
                    html += '<div class="menu-embed-empty">No items in this section.</div>';
                }
            }
            
            html += '</div></div>';
            return html;
        }

        renderSubSection(subSection) {
            const isExpanded = subSection.isExpanded;
            const chevronClass = isExpanded ? 'expanded' : '';
            
            let html = `
                <div class="menu-embed-section" data-subsection-id="${subSection.id}">
                    <div class="menu-embed-section-header" data-subsection-toggle="${subSection.id}">
                        <h6 class="menu-embed-section-title">${sanitizeHTML(subSection.sectionName)}</h6>
                        <span class="menu-embed-chevron ${chevronClass}">▼</span>
                    </div>
                    <div class="menu-embed-section-content ${isExpanded ? '' : 'collapsed'}">
            `;
            
            if (subSection.isLoading) {
                html += '<div class="menu-embed-loading">Loading...</div>';
            } else if (subSection.sectionMenu && subSection.sectionMenu.length > 0) {
                subSection.sectionMenu.forEach(item => {
                    html += this.renderMenuItem(item);
                });
            } else {
                html += '<div class="menu-embed-empty">No items in this sub-section.</div>';
            }
            
            html += '</div></div>';
            return html;
        }

        renderMenuItem(item) {
            const unavailableClass = item.itemAvailability === false ? 'grayscale(100%)' : 'none';
            const imageHtml = item.photo && item.photo.trim() !== '' 
                ? `<img src="${sanitizeHTML(item.photo)}" alt="${sanitizeHTML(item.name)}" style="filter: ${unavailableClass};">`
                : '<span style="font-size: 28px; color: #d4941e;">🍺</span>';
            
            const ratingHtml = this.options.showRatings ? (
                item.averageRating == 0 
                    ? '<span class="menu-embed-star">☆</span>'
                    : `<div class="menu-embed-rating"><b>${sanitizeHTML(item.averageRating)}</b><span class="menu-embed-star">★</span></div>`
            ) : '';
            
            const priceHtml = this.options.showPrices 
                ? `<p class="menu-embed-item-price">${item.itemPrice <= 0 ? '-' : `$ ${sanitizeHTML(item.itemPrice)} / ${sanitizeHTML(item.servingTypeText) || 'serving'}`}</p>`
                : '';
            
            const unavailableText = item.itemAvailability === false 
                ? '<p class="menu-embed-unavailable">Temporarily Unavailable</p>'
                : '';

            return `
                <div class="menu-embed-item" data-item-id="${item.itemID}">
                    <div class="menu-embed-item-image">
                        ${imageHtml}
                    </div>
                    <div class="menu-embed-item-content">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
                            <h5 class="menu-embed-item-title">${sanitizeHTML(item.name)}${item.variant ? ` [${sanitizeHTML(item.variant)} Vintage]` : ''}</h5>
                            ${ratingHtml}
                        </div>
                        <p class="menu-embed-item-meta">${sanitizeHTML(item.bottler) || 'Unknown Producer'} | ${sanitizeHTML(item.drinkType) || 'N/A type'} | ${item.abv ? sanitizeHTML(item.abv) + '%' : 'N/A ABV'}</p>
                        <p class="menu-embed-item-description">${sanitizeHTML(item.description) || ''}</p>
                        ${priceHtml}
                        ${unavailableText}
                    </div>
                </div>
            `;
        }

        renderPagination(pagination, sectionIndex) {
            return `
                <div class="menu-embed-pagination" data-section-pagination="${sectionIndex}">
                    <button ${pagination.page <= 1 ? 'disabled' : ''} data-page="${pagination.page - 1}">Previous</button>
                    <span>Page ${sanitizeHTML(pagination.page)} of ${sanitizeHTML(pagination.total_pages)}</span>
                    <button ${pagination.page >= pagination.total_pages ? 'disabled' : ''} data-page="${pagination.page + 1}">Next</button>
                </div>
            `;
        }

        bindEvents() {
            // Search functionality
            if (this.options.showSearch) {
                const searchInput = this.container.querySelector('.menu-embed-search');
                if (searchInput) {
                    const debouncedSearch = debounce((e) => this.handleSearch(e.target.value), 500);
                    searchInput.addEventListener('input', debouncedSearch);
                }
            }
            
            // Section toggle events
            this.container.addEventListener('click', (e) => {
                // Section toggles
                if (e.target.closest('[data-section-toggle]')) {
                    const sectionIndex = e.target.closest('[data-section-toggle]').dataset.sectionToggle;
                    this.toggleSection(parseInt(sectionIndex));
                }
                
                // Subsection toggles
                if (e.target.closest('[data-subsection-toggle]')) {
                    const subSectionId = e.target.closest('[data-subsection-toggle]').dataset.subsectionToggle;
                    this.toggleSubSection(subSectionId);
                }
                
                // Pagination
                if (e.target.closest('[data-section-pagination] button')) {
                    const button = e.target.closest('button');
                    const sectionIndex = e.target.closest('[data-section-pagination]').dataset.sectionPagination;
                    const page = parseInt(button.dataset.page);
                    if (!button.disabled) {
                        this.loadSectionMenu(parseInt(sectionIndex), page);
                    }
                }
                
                // Item clicks (optional callback)
                if (e.target.closest('[data-item-id]')) {
                    const itemId = e.target.closest('[data-item-id]').dataset.itemId;
                    if (this.options.onItemClick) {
                        this.options.onItemClick(itemId);
                    }
                }
            });
        }

        async toggleSection(sectionIndex) {
            const section = this.currentDisplayMenu.menu[sectionIndex];
            section.isExpanded = !section.isExpanded;
            
            // Load section data if expanded and empty
            if (section.isExpanded && this.searchQuery.trim() === '' && 
                (!section.sectionMenu || section.sectionMenu.length === 0)) {
                await this.loadSectionMenu(sectionIndex);
            }
            
            this.updateSectionDisplay(sectionIndex);
        }

        async toggleSubSection(subSectionId) {
            // Find subsection
            let targetSubSection = null;
            this.currentDisplayMenu.menu.forEach(section => {
                if (section.subSections) {
                    section.subSections.forEach(sub => {
                        if (sub.id == subSectionId) {
                            targetSubSection = sub;
                        }
                    });
                }
            });
            
            if (targetSubSection) {
                targetSubSection.isExpanded = !targetSubSection.isExpanded;
                
                if (targetSubSection.isExpanded && this.searchQuery.trim() === '' && 
                    (!targetSubSection.sectionMenu || targetSubSection.sectionMenu.length === 0)) {
                    await this.loadSectionMenu(null, 1, targetSubSection);
                }
                
                this.renderMenu(); // Re-render to update subsection
            }
        }

        updateSectionDisplay(sectionIndex) {
            const content = this.container.querySelector(`[data-section-content="${sectionIndex}"]`);
            const chevron = this.container.querySelector(`[data-section-toggle="${sectionIndex}"] .menu-embed-chevron`);
            const section = this.currentDisplayMenu.menu[sectionIndex];
            
            if (content && chevron) {
                if (section.isExpanded) {
                    content.classList.remove('collapsed');
                    chevron.classList.add('expanded');
                } else {
                    content.classList.add('collapsed');
                    chevron.classList.remove('expanded');
                }
            }
        }

        async loadSectionMenu(sectionIndex, page = 1, targetSubSection = null) {
            const section = targetSubSection || this.currentDisplayMenu.menu[sectionIndex];
            const sectionId = section.id;
            
            if (section.isLoading) return;
            
            try {
                section.isLoading = true;
                this.renderMenu(); // Show loading state
                
                const response = await fetch(
                    `${this.options.apiUrl}/getData/getVenueMenu/${sectionId}?page=${page}&limit=30`
                );
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                const items = data.data || [];
                const pagination = data.pagination || { page, limit: 30, total_pages: 1 };
                
                section.sectionMenu = items;
                section.pagination = pagination;
                section.itemCount = pagination.total_items || items.length;
                
            } catch (error) {
                console.error(`Error loading menu section ${sectionId}:`, error);
                section.hasError = true;
                section.sectionMenu = [];
            } finally {
                section.isLoading = false;
                this.renderMenu();
            }
        }

        async handleSearch(query) {
            this.searchQuery = query;
            
            if (query.trim() === '') {
                // Reset to original menu
                this.isSearchActive = false;
                this.currentDisplayMenu = this.originalMenuData;
                this.renderMenu();
                return;
            }
            
            try {
                const response = await fetch(
                    `${this.options.apiUrl}/getData/getVenueMenuBySearch/${this.options.venueId}?searchTerm=${encodeURIComponent(query)}`
                );
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const searchData = await response.json();
                
                // Create search result menu structure
                const searchMenu = JSON.parse(JSON.stringify(this.originalMenuData));
                
                // Clear all items first
                searchMenu.menu.forEach(section => {
                    section.sectionMenu = [];
                    section.isExpanded = false;
                    if (section.subSections) {
                        section.subSections.forEach(sub => {
                            sub.sectionMenu = [];
                            sub.isExpanded = false;
                        });
                    }
                });
                
                // Populate with search results
                if (searchData.menu) {
                    this.populateSearchResults(searchMenu, searchData);
                }
                
                this.currentDisplayMenu = searchMenu;
                this.isSearchActive = true;
                this.renderMenu();
                
            } catch (error) {
                console.error('Search failed:', error);
            }
        }

        populateSearchResults(targetMenu, searchResults) {
            searchResults.menu.forEach(searchSection => {
                const matchingSection = targetMenu.menu.find(section => 
                    section.id === searchSection.id || 
                    section.sectionName === searchSection.sectionName
                );
                
                if (matchingSection) {
                    // Direct section items
                    matchingSection.sectionMenu = searchSection.sectionMenu || [];
                    let hasContent = matchingSection.sectionMenu.length > 0;
                    
                    // Handle subsections
                    if (searchSection.subSections && matchingSection.subSections) {
                        searchSection.subSections.forEach(searchSub => {
                            const matchingSub = matchingSection.subSections.find(sub =>
                                sub.id === searchSub.id || sub.sectionName === searchSub.sectionName
                            );
                            
                            if (matchingSub) {
                                matchingSub.sectionMenu = searchSub.sectionMenu || [];
                                matchingSub.isExpanded = matchingSub.sectionMenu.length > 0;
                                if (matchingSub.isExpanded) hasContent = true;
                            }
                        });
                    }
                    
                    matchingSection.isExpanded = hasContent;
                }
            });
        }

        // Public API methods
        refresh() {
            this.loadMenuData();
        }

        updateOptions(newOptions) {
            this.options = { ...this.options, ...newOptions };
            this.renderMenu();
        }
    }

    // Global API
    window.MenuEmbed = {
        create: function(containerId, options) {
            return new MenuEmbed(containerId, options);
        }
    };

})(window, document);

// Auto-initialize if data attributes are present
document.addEventListener('DOMContentLoaded', function() {
    const embedContainers = document.querySelectorAll('[data-menu-embed]');
    embedContainers.forEach(container => {
        const venueId = container.dataset.venueId;
        const apiUrl = container.dataset.apiUrl;
        const theme = container.dataset.theme;
        
        if (venueId) {
            window.MenuEmbed.create(container.id, {
                venueId: venueId,
                apiUrl: apiUrl,
                theme: theme
            });
        }
    });
});