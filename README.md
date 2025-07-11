# Manufacturing Apps Showcase

製造業向け便利アプリを紹介するYouTube風のモダンなWebアプリケーション

## 特徴

- **YouTube風のモダンなUI** - 直感的で使いやすいインターフェース
- **アプリ検索機能** - 名前と説明文による高速検索
- **カテゴリ・タグフィルタリング** - 効率的なアプリ発見
- **詳細なアプリ情報** - 機能、スクリーンショット、レビュー
- **レビュー・評価システム** - 5段階評価とコメント機能
- **レスポンシブデザイン** - PC・タブレット・スマートフォン対応

## 技術スタック

- **バックエンド**: Node.js + Express.js
- **データベース**: JSON ファイル
- **フロントエンド**: HTML5 + CSS3 + Vanilla JavaScript
- **UI**: YouTube風のダークテーマ
- **アイコン**: Font Awesome
- **フォント**: Inter

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. サーバーの起動

```bash
# 本番環境
npm start

# 開発環境（ファイル変更時の自動再起動）
npm run dev
```

### 3. アプリケーションにアクセス

ブラウザで `http://localhost:3000` を開きます

## プロジェクト構成

```
manufacturing-apps-showcase/
├── server.js              # Express サーバー
├── package.json          # 依存関係
├── data/
│   ├── apps.json        # アプリデータ
│   └── reviews.json     # レビューデータ
├── public/
│   ├── index.html       # メインページ
│   ├── app-detail.html  # アプリ詳細ページ
│   ├── css/
│   │   └── style.css    # スタイルシート
│   ├── js/
│   │   ├── main.js      # メインページ機能
│   │   └── detail.js    # 詳細ページ機能
│   └── images/          # アプリ画像
└── README.md            # このファイル
```

## API エンドポイント

### アプリ関連
- `GET /api/apps` - アプリ一覧取得（検索・フィルタ対応）
- `GET /api/apps/:id` - 特定のアプリ詳細取得
- `GET /api/categories` - カテゴリ一覧取得
- `GET /api/tags` - タグ一覧取得

### レビュー関連
- `GET /api/apps/:id/reviews` - 特定のアプリのレビュー一覧取得
- `POST /api/apps/:id/reviews` - レビューの投稿

## 機能詳細

### 1. アプリ一覧ページ
- グリッドレイアウトでアプリを表示
- サイドバーでカテゴリとタグによるフィルタリング
- 検索バーでアプリ名・説明文の検索
- 各アプリカードには評価、タグ、説明を表示

### 2. アプリ詳細ページ
- アプリの詳細情報（機能、スクリーンショット等）
- レビューの表示と投稿
- 5段階評価システム
- アプリへの外部リンク

### 3. レビューシステム
- 5段階の星評価
- コメント機能
- 投稿日時の表示
- 平均評価の自動計算

## カスタマイズ

### 新しいアプリの追加
`data/apps.json` にアプリ情報を追加します：

```json
{
  "id": 7,
  "name": "アプリ名",
  "description": "短い説明",
  "detailedDescription": "詳細な説明",
  "category": "カテゴリ名",
  "tags": ["タグ1", "タグ2"],
  "image": "image.jpg",
  "url": "https://example.com",
  "avgRating": 4.5,
  "features": ["機能1", "機能2", "機能3"]
}
```

### スタイルのカスタマイズ
`public/css/style.css` を編集してデザインを変更できます。

## 開発

### 新機能の追加
1. バックエンドAPIの追加（`server.js`）
2. フロントエンドJavaScriptの実装（`public/js/`）
3. スタイルの追加（`public/css/style.css`）

### デバッグ
- ブラウザの開発者ツールでコンソールログを確認
- サーバーログでAPIエラーを確認

## ライセンス

MIT License

## 貢献

プルリクエストや問題の報告を歓迎します。