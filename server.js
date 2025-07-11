const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// 管理者設定（本番環境では環境変数を使用）
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// セッション管理（簡易実装）
const adminSessions = new Set();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const loadData = (filename) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(`Creating new ${filename} file`);
    return [];
  }
};

const saveData = (filename, data) => {
  fs.writeFileSync(path.join(__dirname, 'data', filename), JSON.stringify(data, null, 2));
};

// 管理者認証ミドルウェア
const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: '管理者認証が必要です' });
  }
  
  next();
};

// 管理者ログイン
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.add(token);
    
    // 24時間後にトークンを削除
    setTimeout(() => {
      adminSessions.delete(token);
    }, 24 * 60 * 60 * 1000);
    
    res.json({ token, message: 'ログインしました' });
  } else {
    res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
  }
});

// 管理者ログアウト
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  adminSessions.delete(token);
  res.json({ message: 'ログアウトしました' });
});

// 管理者認証状態確認
app.get('/api/admin/check', requireAdmin, (req, res) => {
  res.json({ authenticated: true });
});

app.get('/api/apps', (req, res) => {
  const apps = loadData('apps.json');
  const { search, category, tags } = req.query;
  
  let filteredApps = apps;
  
  if (search) {
    filteredApps = filteredApps.filter(app => 
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (category) {
    filteredApps = filteredApps.filter(app => app.category === category);
  }
  
  if (tags) {
    const tagArray = tags.split(',');
    filteredApps = filteredApps.filter(app => 
      tagArray.some(tag => app.tags.includes(tag))
    );
  }
  
  res.json(filteredApps);
});

app.get('/api/apps/:id', (req, res) => {
  const apps = loadData('apps.json');
  const app = apps.find(a => a.id === parseInt(req.params.id));
  
  if (!app) {
    return res.status(404).json({ error: 'App not found' });
  }
  
  res.json(app);
});

app.get('/api/apps/:id/reviews', (req, res) => {
  const reviews = loadData('reviews.json');
  const appReviews = reviews.filter(r => r.appId === parseInt(req.params.id));
  res.json(appReviews);
});

app.post('/api/apps/:id/reviews', (req, res) => {
  const reviews = loadData('reviews.json');
  const { userName, rating, comment } = req.body;
  
  const newReview = {
    id: Date.now(),
    appId: parseInt(req.params.id),
    userName,
    rating,
    comment,
    date: new Date().toISOString()
  };
  
  reviews.push(newReview);
  saveData('reviews.json', reviews);
  
  const apps = loadData('apps.json');
  const appIndex = apps.findIndex(a => a.id === parseInt(req.params.id));
  if (appIndex !== -1) {
    const appReviews = reviews.filter(r => r.appId === parseInt(req.params.id));
    const avgRating = appReviews.reduce((sum, r) => sum + r.rating, 0) / appReviews.length;
    apps[appIndex].avgRating = Math.round(avgRating * 10) / 10;
    saveData('apps.json', apps);
  }
  
  res.json(newReview);
});

app.get('/api/categories', (req, res) => {
  const apps = loadData('apps.json');
  const categories = [...new Set(apps.map(app => app.category))];
  res.json(categories);
});

app.get('/api/tags', (req, res) => {
  const apps = loadData('apps.json');
  const allTags = apps.flatMap(app => app.tags);
  const uniqueTags = [...new Set(allTags)];
  res.json(uniqueTags);
});

// 管理者用：アプリ作成
app.post('/api/admin/apps', requireAdmin, (req, res) => {
  const apps = loadData('apps.json');
  const newApp = {
    id: Math.max(...apps.map(app => app.id), 0) + 1,
    ...req.body,
    avgRating: 0
  };
  
  apps.push(newApp);
  saveData('apps.json', apps);
  res.json(newApp);
});

// 管理者用：アプリ更新
app.put('/api/admin/apps/:id', requireAdmin, (req, res) => {
  const apps = loadData('apps.json');
  const appIndex = apps.findIndex(app => app.id === parseInt(req.params.id));
  
  if (appIndex === -1) {
    return res.status(404).json({ error: 'アプリが見つかりません' });
  }
  
  apps[appIndex] = { ...apps[appIndex], ...req.body };
  saveData('apps.json', apps);
  res.json(apps[appIndex]);
});

// 管理者用：アプリ削除
app.delete('/api/admin/apps/:id', requireAdmin, (req, res) => {
  const apps = loadData('apps.json');
  const appIndex = apps.findIndex(app => app.id === parseInt(req.params.id));
  
  if (appIndex === -1) {
    return res.status(404).json({ error: 'アプリが見つかりません' });
  }
  
  apps.splice(appIndex, 1);
  saveData('apps.json', apps);
  
  // 関連するレビューも削除
  const reviews = loadData('reviews.json');
  const filteredReviews = reviews.filter(review => review.appId !== parseInt(req.params.id));
  saveData('reviews.json', filteredReviews);
  
  res.json({ message: 'アプリを削除しました' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/app/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app-detail.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WSL2 IP: http://172.22.69.141:${PORT}`);
  console.log(`Windows access: Try both URLs above`);
});