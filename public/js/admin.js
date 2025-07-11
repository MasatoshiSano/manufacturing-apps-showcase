class AdminPanel {
    constructor() {
        this.token = localStorage.getItem('adminToken');
        this.apps = [];
        this.currentEditingApp = null;
        this.selectedTags = [];
        this.features = [];
        this.existingCategories = [];
        this.existingTags = [];

        this.init();
    }

    async init() {
        if (!this.token) {
            window.location.href = '/admin/login';
            return;
        }

        await this.checkAuth();
        this.bindEvents();
        await this.loadApps();
        await this.loadCategoriesAndTags();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/admin/check', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                localStorage.removeItem('adminToken');
                window.location.href = '/admin/login';
            }
        } catch (error) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login';
        }
    }

    bindEvents() {
        // モーダル制御
        document.getElementById('addAppBtn').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('modalClose').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('appModal').addEventListener('click', (e) => {
            if (e.target.id === 'appModal') {
                this.closeModal();
            }
        });

        // フォーム送信
        document.getElementById('appForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveApp();
        });

        // カテゴリ選択
        document.getElementById('appCategorySelect').addEventListener('change', (e) => {
            this.handleCategorySelect(e.target.value);
        });

        document.getElementById('appCategoryInput').addEventListener('input', (e) => {
            this.handleCategoryInput(e.target.value);
        });

        // タグ選択
        document.getElementById('existingTagsSelect').addEventListener('change', (e) => {
            this.handleExistingTagSelect();
        });

        // タグ入力
        document.getElementById('tagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addNewTag();
            }
        });

        document.getElementById('addTagBtn').addEventListener('click', () => {
            this.addNewTag();
        });

        // 機能入力
        document.getElementById('featureInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addFeature();
            }
        });

        // ログアウト
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    async loadApps() {
        try {
            const response = await fetch('/api/apps');
            this.apps = await response.json();
            this.renderAppsTable();
            this.hideLoading();
        } catch (error) {
            console.error('アプリの読み込みに失敗しました:', error);
            this.hideLoading();
        }
    }

    async loadCategoriesAndTags() {
        try {
            const [categoriesResponse, tagsResponse] = await Promise.all([
                fetch('/api/categories'),
                fetch('/api/tags')
            ]);
            
            this.existingCategories = await categoriesResponse.json();
            this.existingTags = await tagsResponse.json();
            
            this.renderCategoryOptions();
            this.renderExistingTags();
        } catch (error) {
            console.error('カテゴリとタグの読み込みに失敗しました:', error);
        }
    }

    renderCategoryOptions() {
        const select = document.getElementById('appCategorySelect');
        select.innerHTML = '<option value="">既存のカテゴリから選択...</option>';
        
        this.existingCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }

    renderExistingTags() {
        const select = document.getElementById('existingTagsSelect');
        select.innerHTML = '';
        
        this.existingTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            select.appendChild(option);
        });
    }

    renderAppsTable() {
        const tbody = document.getElementById('appsTableBody');
        const table = document.getElementById('appsTable');

        if (this.apps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #aaa;">アプリがありません</td></tr>';
        } else {
            tbody.innerHTML = this.apps.map(app => `
                <tr>
                    <td>${app.id}</td>
                    <td>${app.name}</td>
                    <td>${app.category}</td>
                    <td>${app.avgRating.toFixed(1)}</td>
                    <td>
                        <div class="app-actions">
                            <button class="btn btn-secondary btn-sm" onclick="adminPanel.editApp(${app.id})">
                                <i class="fas fa-edit"></i> 編集
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="adminPanel.deleteApp(${app.id})">
                                <i class="fas fa-trash"></i> 削除
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        table.style.display = 'table';
    }

    openModal(app = null) {
        this.currentEditingApp = app;
        this.selectedTags = [];
        this.features = [];

        if (app) {
            document.getElementById('modalTitle').textContent = 'アプリ編集';
            document.getElementById('appName').value = app.name;
            document.getElementById('appDescription').value = app.description;
            document.getElementById('appDetailedDescription').value = app.detailedDescription || '';
            document.getElementById('appUrl').value = app.url;
            this.selectedTags = [...app.tags];
            this.features = [...(app.features || [])];
            
            // カテゴリ設定
            this.setCategory(app.category);
        } else {
            document.getElementById('modalTitle').textContent = '新規アプリ追加';
            document.getElementById('appForm').reset();
            this.clearCategorySelection();
        }

        this.renderSelectedTags();
        this.renderFeatures();
        document.getElementById('appModal').classList.add('show');
    }

    closeModal() {
        document.getElementById('appModal').classList.remove('show');
        this.currentEditingApp = null;
    }

    handleCategorySelect(value) {
        if (value) {
            document.getElementById('appCategoryInput').value = '';
            document.getElementById('appCategory').value = value;
        }
    }

    handleCategoryInput(value) {
        if (value) {
            document.getElementById('appCategorySelect').value = '';
            document.getElementById('appCategory').value = value;
        }
    }

    setCategory(category) {
        if (this.existingCategories.includes(category)) {
            document.getElementById('appCategorySelect').value = category;
            document.getElementById('appCategoryInput').value = '';
        } else {
            document.getElementById('appCategorySelect').value = '';
            document.getElementById('appCategoryInput').value = category;
        }
        document.getElementById('appCategory').value = category;
    }

    clearCategorySelection() {
        document.getElementById('appCategorySelect').value = '';
        document.getElementById('appCategoryInput').value = '';
        document.getElementById('appCategory').value = '';
    }

    handleExistingTagSelect() {
        const select = document.getElementById('existingTagsSelect');
        const selectedOptions = Array.from(select.selectedOptions);
        
        selectedOptions.forEach(option => {
            const tag = option.value;
            if (!this.selectedTags.includes(tag)) {
                this.selectedTags.push(tag);
            }
            option.selected = false;
        });
        
        this.renderSelectedTags();
    }

    addNewTag() {
        const input = document.getElementById('tagInput');
        const tag = input.value.trim();

        if (tag && !this.selectedTags.includes(tag)) {
            this.selectedTags.push(tag);
            this.renderSelectedTags();
            input.value = '';
        }
    }

    removeSelectedTag(index) {
        this.selectedTags.splice(index, 1);
        this.renderSelectedTags();
    }

    renderSelectedTags() {
        const container = document.getElementById('selectedTagsContainer');
        if (this.selectedTags.length === 0) {
            container.innerHTML = '<span style="color: #666; font-style: italic;">タグが選択されていません</span>';
        } else {
            container.innerHTML = this.selectedTags.map((tag, index) => `
                <div class="selected-tag">
                    ${tag}
                    <button type="button" class="selected-tag-remove" onclick="adminPanel.removeSelectedTag(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    addFeature() {
        const input = document.getElementById('featureInput');
        const feature = input.value.trim();

        if (feature && !this.features.includes(feature)) {
            this.features.push(feature);
            this.renderFeatures();
            input.value = '';
        }
    }

    removeFeature(index) {
        this.features.splice(index, 1);
        this.renderFeatures();
    }

    renderFeatures() {
        const container = document.getElementById('featuresList');
        container.innerHTML = this.features.map((feature, index) => `
            <li class="feature-item">
                ${feature}
                <button type="button" class="feature-remove" onclick="adminPanel.removeFeature(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </li>
        `).join('');
    }

    async saveApp() {
        const category = document.getElementById('appCategory').value;
        if (!category) {
            this.showMessage('カテゴリを選択または入力してください', 'error');
            return;
        }

        const formData = {
            name: document.getElementById('appName').value,
            description: document.getElementById('appDescription').value,
            detailedDescription: document.getElementById('appDetailedDescription').value,
            category: category,
            url: document.getElementById('appUrl').value,
            tags: this.selectedTags,
            features: this.features,
            image: 'default-app.jpg'
        };

        const saveBtn = document.getElementById('saveAppBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';

        try {
            let response;
            if (this.currentEditingApp) {
                response = await fetch(`/api/admin/apps/${this.currentEditingApp.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch('/api/admin/apps', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(formData)
                });
            }

            if (response.ok) {
                this.closeModal();
                await this.loadApps();
                await this.loadCategoriesAndTags();
                this.showMessage('アプリを保存しました', 'success');
            } else {
                const error = await response.json();
                this.showMessage(error.error || '保存に失敗しました', 'error');
            }
        } catch (error) {
            this.showMessage('サーバーエラーが発生しました', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '保存';
        }
    }

    editApp(id) {
        const app = this.apps.find(a => a.id === id);
        if (app) {
            this.openModal(app);
        }
    }

    async deleteApp(id) {
        const app = this.apps.find(a => a.id === id);
        if (!app) return;

        if (!confirm(`「${app.name}」を削除してもよろしいですか？この操作は取り消せません。`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/apps/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                await this.loadApps();
                this.showMessage('アプリを削除しました', 'success');
            } else {
                const error = await response.json();
                this.showMessage(error.error || '削除に失敗しました', 'error');
            }
        } catch (error) {
            this.showMessage('サーバーエラーが発生しました', 'error');
        }
    }

    async logout() {
        try {
            await fetch('/api/admin/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
        } catch (error) {
            console.error('ログアウトエラー:', error);
        }

        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

        if (type === 'success') {
            messageDiv.style.backgroundColor = '#4CAF50';
            messageDiv.style.color = 'white';
        } else if (type === 'error') {
            messageDiv.style.backgroundColor = '#f44336';
            messageDiv.style.color = 'white';
        } else {
            messageDiv.style.backgroundColor = '#2196F3';
            messageDiv.style.color = 'white';
        }

        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// グローバルインスタンス作成
let adminPanel;

document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});