# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start
```

### Server Management
- Server runs on port 3000 by default
- Access via http://localhost:3000
- In WSL2 environments, may need to use WSL IP address

## Architecture Overview

This is a Node.js web application showcasing manufacturing apps with a YouTube-like interface. It consists of:

### Backend (server.js)
- Express.js server serving static files and REST API
- JSON file-based data storage (no database)
- RESTful API endpoints for apps, reviews, categories, and tags
- Automatic review aggregation and rating calculation

### Frontend Structure
- **index.html**: Main app listing page with search and filtering
- **app-detail.html**: Individual app detail pages with reviews
- **main.js**: Handles app listing, search, filtering, and navigation
- **detail.js**: Manages app detail display and review submission
- **style.css**: YouTube-inspired dark theme with responsive design

### Data Model
- **data/apps.json**: App information including metadata, features, ratings
- **data/reviews.json**: User reviews with ratings and automatic aggregation
- Apps have categories, tags, descriptions, features, and external URLs
- Reviews automatically update app average ratings

### API Endpoints
- `/api/apps` - App listing with search/filter query parameters
- `/api/apps/:id` - Individual app details
- `/api/apps/:id/reviews` - Review CRUD operations
- `/api/categories` and `/api/tags` - Filter options

### Key Features
- Real-time search and filtering without page reloads
- Star rating system with half-star precision
- Responsive grid layout adapting to screen size
- Modal-like review submission forms
- Automatic review aggregation and rating updates

## Data Management

### Adding New Apps
Add entries to `data/apps.json` with required fields:
- `id`, `name`, `description`, `detailedDescription`
- `category`, `tags[]`, `features[]`
- `avgRating`, `url`, `image`

### Review System
- Reviews stored in `data/reviews.json`
- Average ratings calculated automatically on review submission
- Review submission updates both reviews.json and apps.json

## Development Notes

### File Structure
- All client-side assets in `public/` directory
- Data files in `data/` directory (JSON format)
- Server handles both API and static file serving

### Styling
- Uses Inter font and Font Awesome icons
- Dark theme with YouTube-inspired design patterns
- CSS Grid for responsive app layout
- Custom star rating components

### WSL2 Development
- Server binds to 0.0.0.0 for WSL2 compatibility
- May require port forwarding for Windows access
- Uses JSON file storage for simplicity (no database setup required)