class AdminPanel {
    constructor() {
        this.token = localStorage.getItem('adminToken');
        this.apps = [];
        this.currentEditingApp = null;
        this.tags = [];
        this.features = [];

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

        // タグ入力
        document.getElementById('tagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTag();
            }
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
        this.tags = [];
        this.features = [];

        if (app) {
            document.getElementById('modalTitle').textContent = 'アプリ編集';
            document.getElementById('appName').value = app.name;
            document.getElementById('appDescription').value = app.description;
            document.getElementById('appDetailedDescription').value = app.detailedDescription || '';
            document.getElementById('appCategory').value = app.category;
            document.getElementById('appUrl').value = app.url;
            this.tags = [...app.tags];
            this.features = [...(app.features || [])];
        } else {
            document.getElementById('modalTitle').textContent = '新規アプリ追加';
            document.getElementById('appForm').reset();
        }

        this.renderTags();
        this.renderFeatures();
        document.getElementById('appModal').classList.add('show');
    }

    closeModal() {
        document.getElementById('appModal').classList.remove('show');
        this.currentEditingApp = null;
    }

    addTag() {
        const input = document.getElementById('tagInput');
        const tag = input.value.trim();

        if (tag && !this.tags.includes(tag)) {
            this.tags.push(tag);
            this.renderTags();
            input.value = '';
        }
    }

    removeTag(index) {
        this.tags.splice(index, 1);
        this.renderTags();
    }

    renderTags() {
        const container = document.getElementById('tagContainer');
        container.innerHTML = this.tags.map((tag, index) => `
            <div class="tag-item">
                ${tag}
                <button type="button" class="tag-remove" onclick="adminPanel.removeTag(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
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
        const formData = {
            name: document.getElementById('appName').value,
            description: document.getElementById('appDescription').value,
            detailedDescription: document.getElementById('appDetailedDescription').value,
            category: document.getElementById('appCategory').value,
            url: document.getElementById('appUrl').value,
            tags: this.tags,
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