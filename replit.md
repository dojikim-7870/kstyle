# K-Style Learning - Korean Language Learning Platform

## Overview

K-Style Learning is a client-side educational web platform focused on teaching Korean language through K-pop culture. The application provides interactive lessons, quizzes, vocabulary tools, and cultural content specifically designed for K-pop fans who want to learn Korean. It's built as a static website with vanilla JavaScript for interactivity and JSON files for data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Pure HTML5, CSS3, and vanilla JavaScript
- **Structure**: Multi-page application with static HTML files
- **Styling**: Single CSS file (`styles/main.css`) with CSS variables for theming
- **Responsiveness**: Mobile-first responsive design with CSS media queries
- **SEO Optimization**: Comprehensive meta tags, Open Graph, and structured data markup

### Data Storage
- **Format**: JSON files stored in `/data/` directory
- **Structure**: Separate JSON files for different content types (vocabulary, phrases, quiz questions)
- **Access Pattern**: Client-side fetch requests to load data asynchronously
- **No Database**: Pure file-based data storage suitable for static hosting

### JavaScript Modules
- **Modular Design**: Separate JavaScript files for different features
- **Class-Based Architecture**: ES6 classes for managing different learning modules
- **Event-Driven**: DOM event listeners for user interactions
- **Async Data Loading**: Fetch API for loading JSON data

## Key Components

### Learning Modules
1. **Korean Basics** (`pages/basics.html`) - Hangul alphabet and essential phrases
2. **Grammar Guide** (`pages/grammar.html`) - Korean grammar rules and structure
3. **Vocabulary** (`pages/vocabulary.html`) - Interactive word lists with study tools
4. **Pronunciation** (`pages/pronunciation.html`) - Sound guides and speaking practice
5. **Korean Culture** (`pages/culture.html`) - Cultural context and traditions
6. **K-pop Lyrics** (`pages/lyrics.html`) - Learn through music and song analysis

### Interactive Tools
1. **Quiz System** (`scripts/quiz.js`) - Multiple-choice questions with categories
2. **Phrase Generator** (`scripts/phrase-generator.js`) - Random phrase practice
3. **Vocabulary Manager** (`scripts/vocabulary.js`) - Searchable word database
4. **Lyrics Player** (`scripts/lyrics.js`) - Interactive lyric analysis

### Navigation and UI
- **Responsive Navigation**: Mobile hamburger menu with dropdown support
- **Accessibility Features**: ARIA labels, keyboard navigation, semantic HTML
- **SEO Optimization**: Meta tags, structured data, sitemap-ready structure

## Data Flow

### Content Loading Process
1. User navigates to a learning page
2. JavaScript module initializes and fetches relevant JSON data
3. Data is processed and rendered into interactive components
4. User interactions trigger updates to the UI state

### Quiz Flow
1. Categories loaded from `quiz-questions.json`
2. User selects category and starts quiz
3. Questions presented with timer and scoring
4. Results calculated and displayed with explanations

### Vocabulary System
1. Words loaded from categorized `vocabulary.json`
2. Filtering and searching applied client-side
3. Study mode enables flashcard-style learning
4. Progress tracked in browser memory (no persistence)

## External Dependencies

### Minimal External Dependencies
- **No JavaScript Frameworks**: Pure vanilla JavaScript implementation
- **No CSS Frameworks**: Custom CSS with CSS Grid and Flexbox
- **No Backend Services**: Fully client-side application
- **No APIs**: Self-contained with local JSON data

### Browser APIs Used
- **Fetch API**: For loading JSON data files
- **Local Storage**: For user preferences and progress (potential future feature)
- **Audio API**: For pronunciation features (planned enhancement)

## Deployment Strategy

### Static Site Hosting
- **Hosting**: Designed for static site hosts (Netlify, Vercel, GitHub Pages)
- **Build Process**: No build step required - deploy as-is
- **CDN Ready**: All assets are static files suitable for CDN distribution
- **Domain**: Configured for `kstyle.site` domain

### Performance Considerations
- **Lazy Loading**: JavaScript modules load data on-demand
- **Minimal Assets**: Single CSS file, optimized images as data URIs
- **Caching Strategy**: Static files can be cached aggressively
- **Mobile Optimization**: Responsive design with mobile-first approach

### Future Scalability
- **Database Migration Path**: JSON structure easily convertible to database schema
- **API Integration**: Modular JS design allows for easy API integration
- **Progressive Enhancement**: Current architecture supports gradual feature additions
- **User Accounts**: Local storage can be extended to user authentication system

The application prioritizes simplicity, accessibility, and educational effectiveness while maintaining a clear path for future enhancements and potential backend integration.