class ManufacturingAppsShowcase {
    constructor() {
        this.apps = [];
        this.filteredApps = [];
        this.categories = [];
        this.tags = [];
        this.currentFilters = {
            search: '',
            categories: [],
            tags: []
        };
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
        this.renderFilters();
        this.renderApps();
        this.hideLoading();
        this.checkAdminAuth();
    }

    bindEvents() {
        // サイドバー制御
        this.bindSidebarEvents();
        
        // 検索
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.applyFilters();
        });

        // カテゴリフィルター
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.handleFilterChange(e);
            }
        });

        // アプリカードクリック
        document.addEventListener('click', (e) => {
            const appCard = e.target.closest('.app-card');
            if (appCard) {
                const appId = appCard.dataset.appId;
                this.openAppDetail(appId);
            }
        });

        // タッチ操作の最適化
        this.bindTouchEvents();
    }

    bindSidebarEvents() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarClose = document.getElementById('sidebarClose');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const sidebar = document.getElementById('sidebar');

        // サイドバーを開く
        sidebarToggle?.addEventListener('click', () => {
            this.showSidebar();
        });

        // サイドバーを閉じる
        sidebarClose?.addEventListener('click', () => {
            this.hideSidebar();
        });

        // オーバーレイクリックで閉じる
        sidebarOverlay?.addEventListener('click', () => {
            this.hideSidebar();
        });

        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar?.classList.contains('show')) {
                this.hideSidebar();
            }
        });

        // リサイズ時の処理
        window.addEventListener('resize', () => {
            if (window.innerWidth > 1024) {
                this.hideSidebar();
            }
        });
    }

    bindTouchEvents() {
        // スワイプジェスチャーでサイドバー制御
        let startX = 0;
        let startY = 0;
        let isSwipeDetected = false;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipeDetected = false;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = startY - currentY;

            // 水平スワイプの判定
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                isSwipeDetected = true;
                
                // 左端からのスワイプでサイドバーを開く
                if (startX < 50 && diffX < -100) {
                    this.showSidebar();
                }
                
                // 右スワイプでサイドバーを閉じる
                if (diffX < -100 && document.getElementById('sidebar')?.classList.contains('show')) {
                    this.hideSidebar();
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            startX = 0;
            startY = 0;
            isSwipeDetected = false;
        }, { passive: true });

        // タッチフィードバックの改善
        document.querySelectorAll('.app-card, .filter-item, .nav-link').forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
            }, { passive: true });

            element.addEventListener('touchend', function() {
                this.style.opacity = '1';
            }, { passive: true });

            element.addEventListener('touchcancel', function() {
                this.style.opacity = '1';
            }, { passive: true });
        });
    }

    showSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('show');
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    async loadData() {
        try {
            const [appsResponse, categoriesResponse, tagsResponse] = await Promise.all([
                fetch('/api/apps'),
                fetch('/api/categories'),
                fetch('/api/tags')
            ]);

            this.apps = await appsResponse.json();
            this.categories = await categoriesResponse.json();
            this.tags = await tagsResponse.json();
            this.filteredApps = [...this.apps];
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
        }
    }

    renderFilters() {
        this.renderCategoryFilters();
        this.renderTagFilters();
    }

    renderCategoryFilters() {
        const categoryFilters = document.getElementById('categoryFilters');
        
        // すべてのカテゴリフィルター
        const allCategoryHtml = `
            <label class="filter-item">
                <input type="checkbox" value="all" checked>
                <span>すべて</span>
            </label>
        `;
        
        const categoryHtml = this.categories.map(category => `
            <label class="filter-item">
                <input type="checkbox" value="${category}" data-filter="category">
                <span>${category}</span>
            </label>
        `).join('');

        categoryFilters.innerHTML = allCategoryHtml + categoryHtml;
    }

    renderTagFilters() {
        const tagFilters = document.getElementById('tagFilters');
        
        const tagHtml = this.tags.map(tag => `
            <label class="filter-item">
                <input type="checkbox" value="${tag}" data-filter="tag">
                <span>${tag}</span>
            </label>
        `).join('');

        tagFilters.innerHTML = tagHtml;
    }

    handleFilterChange(e) {
        const filterType = e.target.dataset.filter;
        const value = e.target.value;
        const isChecked = e.target.checked;

        if (value === 'all') {
            // すべてが選択された場合
            if (isChecked) {
                this.currentFilters.categories = [];
                // 他のカテゴリチェックボックスをすべて外す
                document.querySelectorAll('[data-filter="category"]').forEach(cb => {
                    cb.checked = false;
                });
            }
        } else if (filterType === 'category') {
            // すべてのチェックを外す
            document.querySelector('[value="all"]').checked = false;
            
            if (isChecked) {
                this.currentFilters.categories.push(value);
            } else {
                this.currentFilters.categories = this.currentFilters.categories.filter(c => c !== value);
            }
            
            // カテゴリが何も選択されていない場合は「すべて」をチェック
            if (this.currentFilters.categories.length === 0) {
                document.querySelector('[value="all"]').checked = true;
            }
        } else if (filterType === 'tag') {
            if (isChecked) {
                this.currentFilters.tags.push(value);
            } else {
                this.currentFilters.tags = this.currentFilters.tags.filter(t => t !== value);
            }
        }

        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.apps];

        // 検索フィルター
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(app =>
                app.name.toLowerCase().includes(searchTerm) ||
                app.description.toLowerCase().includes(searchTerm)
            );
        }

        // カテゴリフィルター
        if (this.currentFilters.categories.length > 0) {
            filtered = filtered.filter(app =>
                this.currentFilters.categories.includes(app.category)
            );
        }

        // タグフィルター
        if (this.currentFilters.tags.length > 0) {
            filtered = filtered.filter(app =>
                this.currentFilters.tags.some(tag => app.tags.includes(tag))
            );
        }

        this.filteredApps = filtered;
        this.renderApps();
    }

    renderApps() {
        const appsGrid = document.getElementById('appsGrid');
        const noResults = document.getElementById('noResults');

        if (this.filteredApps.length === 0) {
            appsGrid.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';

        const appsHtml = this.filteredApps.map(app => `
            <div class="app-card" data-app-id="${app.id}">
                <div class="app-thumbnail">
                    <i class="fas fa-cogs"></i>
                </div>
                <div class="app-info">
                    <h3 class="app-title">${app.name}</h3>
                    <p class="app-description">${app.description}</p>
                    <div class="app-meta">
                        <span class="app-category">${app.category}</span>
                        <div class="app-rating">
                            <div class="stars">
                                ${this.generateStars(app.avgRating)}
                            </div>
                            <span class="rating-text">${app.avgRating}</span>
                        </div>
                    </div>
                    <div class="app-tags">
                        ${app.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        appsGrid.innerHTML = appsHtml;
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        
        // 満点の星
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        // 半分の星
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // 空の星
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    openAppDetail(appId) {
        window.location.href = `/app/${appId}`;
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        loading.style.display = 'none';
    }

    showLoading() {
        const loading = document.getElementById('loading');
        loading.style.display = 'flex';
    }

    async checkAdminAuth() {
        const token = localStorage.getItem('adminToken');
        if (token) {
            try {
                const response = await fetch('/api/admin/check', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const adminLink = document.getElementById('adminLink');
                    if (adminLink) {
                        adminLink.style.display = 'inline-flex';
                        adminLink.href = '/admin';
                        adminLink.innerHTML = '<i class="fas fa-cog"></i> 管理';
                    }
                }
            } catch (error) {
                console.log('管理者認証なし');
            }
        }
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    new ManufacturingAppsShowcase();
});

// スムーズスクロール
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// 検索入力のクリア機能
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput === document.activeElement) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
        }
    }
});