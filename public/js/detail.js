class AppDetailPage {
    constructor() {
        this.appId = this.getAppIdFromUrl();
        this.app = null;
        this.reviews = [];
        this.selectedRating = 0;
        
        this.init();
    }

    getAppIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return parseInt(pathParts[pathParts.length - 1]);
    }

    async init() {
        this.bindEvents();
        await this.loadAppData();
        await this.loadReviews();
    }

    bindEvents() {
        // レビュー投稿ボタン
        document.getElementById('addReviewBtn').addEventListener('click', () => {
            this.toggleReviewForm();
        });

        // レビュー送信
        document.getElementById('submitReviewBtn').addEventListener('click', () => {
            this.submitReview();
        });

        // 星評価
        document.querySelectorAll('.rating-star').forEach(star => {
            star.addEventListener('click', (e) => {
                this.setRating(parseInt(e.target.dataset.rating));
            });
            
            star.addEventListener('mouseenter', (e) => {
                this.highlightStars(parseInt(e.target.dataset.rating));
            });
        });

        // 星評価のマウスリーブ
        document.getElementById('ratingInput').addEventListener('mouseleave', () => {
            this.highlightStars(this.selectedRating);
        });
    }

    async loadAppData() {
        try {
            const response = await fetch(`/api/apps/${this.appId}`);
            if (!response.ok) {
                throw new Error('App not found');
            }
            
            this.app = await response.json();
            this.renderAppDetail();
        } catch (error) {
            console.error('アプリデータの読み込みに失敗しました:', error);
            this.showError('アプリが見つかりません');
        }
    }

    async loadReviews() {
        try {
            const response = await fetch(`/api/apps/${this.appId}/reviews`);
            this.reviews = await response.json();
            this.renderReviews();
        } catch (error) {
            console.error('レビューの読み込みに失敗しました:', error);
            this.showReviewsError();
        }
    }

    renderAppDetail() {
        if (!this.app) return;

        // アプリ名
        document.getElementById('appName').textContent = this.app.name;
        
        // カテゴリ
        document.getElementById('appCategory').textContent = this.app.category;
        
        // 評価
        document.getElementById('appStars').innerHTML = this.generateStars(this.app.avgRating);
        document.getElementById('appRating').textContent = this.app.avgRating.toFixed(1);
        
        // 説明
        document.getElementById('appDescription').textContent = this.app.detailedDescription || this.app.description;
        
        // タグ
        const tagsHtml = this.app.tags.map(tag => 
            `<span class="tag-large">${tag}</span>`
        ).join('');
        document.getElementById('appTags').innerHTML = tagsHtml;
        
        // URL
        const appUrl = document.getElementById('appUrl');
        appUrl.href = this.app.url;
        appUrl.target = '_blank'; // 新しいタブで開く
        
        // 機能
        if (this.app.features) {
            const featuresHtml = this.app.features.map(feature => `
                <div class="feature-item">
                    <i class="fas fa-check feature-icon"></i>
                    <span class="feature-text">${feature}</span>
                </div>
            `).join('');
            document.getElementById('appFeatures').innerHTML = featuresHtml;
        }

        // ページタイトル更新
        document.title = `${this.app.name} - Manufacturing Apps Showcase`;
    }

    renderReviews() {
        const reviewsList = document.getElementById('reviewsList');
        
        if (this.reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="loading-reviews">
                    <i class="fas fa-comments" style="font-size: 48px; color: #666; margin-bottom: 20px;"></i>
                    <p>まだレビューがありません</p>
                    <p>最初のレビューを投稿してみませんか？</p>
                </div>
            `;
            return;
        }

        const reviewsHtml = this.reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-author">${review.userName}</div>
                    <div class="review-date">${this.formatDate(review.date)}</div>
                </div>
                <div class="review-rating">
                    ${this.generateStars(review.rating)}
                </div>
                <div class="review-comment">${review.comment}</div>
            </div>
        `).join('');

        reviewsList.innerHTML = reviewsHtml;
    }

    toggleReviewForm() {
        const reviewForm = document.getElementById('reviewForm');
        const isVisible = reviewForm.style.display === 'block';
        reviewForm.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            document.getElementById('reviewerName').focus();
        }
    }

    setRating(rating) {
        this.selectedRating = rating;
        this.highlightStars(rating);
    }

    highlightStars(rating) {
        document.querySelectorAll('.rating-star').forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    async submitReview() {
        const reviewerName = document.getElementById('reviewerName').value.trim();
        const reviewComment = document.getElementById('reviewComment').value.trim();
        
        if (!reviewerName) {
            alert('お名前を入力してください');
            return;
        }
        
        if (!this.selectedRating) {
            alert('評価を選択してください');
            return;
        }
        
        if (!reviewComment) {
            alert('コメントを入力してください');
            return;
        }

        const submitBtn = document.getElementById('submitReviewBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = '投稿中...';

        try {
            const response = await fetch(`/api/apps/${this.appId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName: reviewerName,
                    rating: this.selectedRating,
                    comment: reviewComment
                })
            });

            if (!response.ok) {
                throw new Error('レビューの投稿に失敗しました');
            }

            const newReview = await response.json();
            
            // レビューリストに追加
            this.reviews.unshift(newReview);
            this.renderReviews();
            
            // フォームをクリア
            this.clearReviewForm();
            
            // フォームを閉じる
            document.getElementById('reviewForm').style.display = 'none';
            
            // 成功メッセージ
            this.showSuccessMessage('レビューを投稿しました');
            
            // アプリデータを再読み込み（平均評価更新のため）
            await this.loadAppData();
            
        } catch (error) {
            console.error('レビューの投稿に失敗しました:', error);
            alert('レビューの投稿に失敗しました。もう一度お試しください。');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'レビューを投稿';
        }
    }

    clearReviewForm() {
        document.getElementById('reviewerName').value = '';
        document.getElementById('reviewComment').value = '';
        this.selectedRating = 0;
        this.highlightStars(0);
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showError(message) {
        const container = document.querySelector('.app-detail-container');
        container.innerHTML = `
            <div class="back-button">
                <a href="/" style="color: #ff6b6b; text-decoration: none;">
                    <i class="fas fa-arrow-left"></i>
                    <span>一覧に戻る</span>
                </a>
            </div>
            <div style="text-align: center; padding: 60px; color: #aaa;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px; color: #ff6b6b;"></i>
                <h3 style="font-size: 24px; margin-bottom: 10px; color: #fff;">${message}</h3>
                <p>アプリが見つからないか、削除された可能性があります。</p>
            </div>
        `;
    }

    showReviewsError() {
        document.getElementById('reviewsList').innerHTML = `
            <div class="loading-reviews">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 20px;"></i>
                <p>レビューの読み込みに失敗しました</p>
            </div>
        `;
    }

    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    new AppDetailPage();
});