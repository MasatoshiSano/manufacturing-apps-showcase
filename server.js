const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/app/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app-detail.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WSL2 IP: http://172.22.69.141:${PORT}`);
  console.log(`Windows access: Try both URLs above`);
});