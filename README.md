# 💰 GoldFlow

**Live Gold & Silver Price Tracker with AI-Powered Market Analysis**

A modern, responsive web application that provides real-time precious metals prices from global markets with intelligent market insights powered by AI.

![GoldFlow Banner](https://img.shields.io/badge/GoldFlow-Live%20Prices-gold?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.1-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

---

## 🌟 Features

### 💹 Real-Time Price Tracking
- **Live Gold (XAU) & Silver (XAG) Prices** - Updated automatically every ~8.57 minutes
- **Accurate Market Data** - Sourced from gold-api.com with per gram/troy ounce precision
- **Multi-Currency Support** - View prices in USD, EUR, GBP, JPY, INR, AED, SGD, CNY, SAR, TRY
- **Multiple Unit Conversions** - Gram, Troy Ounce, Kilogram, Tola, Milligram
- **24-Hour High/Low Tracking** - Monitor daily price ranges
- **Price Change Indicators** - Visual percentage changes with color-coded trends

### 🌍 International Market Coverage
- **International Spot Prices** - Pure market prices without markups
- **Retail Prices with Local Taxes** - Country-specific pricing including:
  - 🇮🇳 **India** - 13% markup (includes GST, import duties, making charges)
  - 🇺🇸 **USA** - 8% markup
  - 🇬🇧 **UK** - 20% markup (VAT included)
  - 🇦🇪 **UAE** - 5% markup
  - 🇸🇬 **Singapore** - 7% markup
  - 🇨🇳 **China** - 17% markup
  - 🇸🇦 **Saudi Arabia** - 15% markup
  - 🇹🇷 **Turkey** - 18% markup

### 🤖 AI-Powered Insights
- **Groq AI Integration** - LLaMA 3.3 70B Versatile model
- **Intelligent Market Analysis** - Real-time analysis of price trends
- **Investment Recommendations** - AI-generated buy/sell/hold signals
- **Technical Analysis** - Momentum indicators and market sentiment
- **Contextual Insights** - Updates hourly with fresh market perspectives

### 📊 Advanced Analytics
- **Interactive Price Charts** - Powered by Chart.js
- **Multiple Timeframes** - 1 Day, 7 Days, 1 Month, 1 Year, All Time
- **Historical Data Tracking** - 30-day price history with localStorage
- **Gold/Silver Ratio Calculator** - Track relative value trends
- **Market Trend Indicators** - Bullish/Bearish/Stable market conditions
- **Peak Price Alerts** - Visual indicators for 24-hour highs

### 📈 Price History & Data Management
- **Historical Price Table** - Detailed timestamp-based price records
- **CSV Export** - Download complete price history
- **Data Persistence** - Local storage for offline access
- **Smart Caching** - Reduces API calls with intelligent data retention

### 🎨 User Experience
- **Clean, Minimalist Design** - Distraction-free interface
- **Fully Responsive** - Optimized for desktop, tablet, and mobile
- **Smooth Animations** - Count-up effects and transition animations
- **Loading Indicators** - Real-time feedback during data fetches
- **Error Handling** - Graceful fallbacks and user-friendly messages

### ⚡ Performance & Optimization
- **Rate Limiting** - 7 API requests per hour to respect free tier limits
- **Smart Caching System** - Minimizes unnecessary API calls
- **Efficient Data Management** - Optimized localStorage usage
- **Fast Load Times** - Minimal dependencies, CDN-hosted libraries

---

## 🛠️ Technologies Used

### Frontend
- **HTML5** - Semantic markup structure
- **CSS3** - Modern styling with flexbox/grid layouts
- **JavaScript (ES6+)** - Vanilla JS for performance
- **Chart.js v4.4.0** - Interactive data visualizations

### APIs & Services
- **[gold-api.com](https://gold-api.com)** - Real-time precious metals prices
  - Endpoint: `https://api.gold-api.com/price/XAU` (Gold)
  - Endpoint: `https://api.gold-api.com/price/XAG` (Silver)
  - Free tier: 7 requests/hour
  - Data format: Price per troy ounce

- **[Groq AI API](https://groq.com)** - AI-powered market analysis
  - Model: LLaMA 3.3 70B Versatile
  - Context: 128k tokens
  - Purpose: Market insights, technical analysis, recommendations

### Design & Fonts
- **Google Fonts** - Poppins (300, 400, 500, 600, 700)
- **Custom CSS Variables** - Maintainable color schemes
- **Responsive Design** - Mobile-first approach with media queries

### Data Storage
- **localStorage** - Browser-based persistence
  - Price history caching
  - User preference storage
  - API request tracking
  - Cache versioning system

---

## 📦 Project Structure

```
goldflow/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling and responsive design
├── script.js           # Core application logic and API integration
└── README.md          # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for API access
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

1. **Clone or Download the Repository**
   ```bash
   git clone https://github.com/yourusername/goldflow.git
   cd goldflow
   ```

2. **Configure API Keys** (Optional - for AI insights)
   - Open `script.js`
   - Replace the `GROQ_API_KEY` value with your API key:
     ```javascript
     const GROQ_API_KEY = 'your_groq_api_key_here';
     ```

3. **Launch the Application**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Node.js
     npx serve
     ```

4. **Access the App**
   - Navigate to `http://localhost:8000` (if using a server)
   - Or directly open the `index.html` file

---

## 💡 Usage

### Viewing Prices
1. Select your preferred **Market** (Spot or Retail with country)
2. Choose your desired **Unit** (Gram, Troy Ounce, etc.)
3. View real-time Gold and Silver prices with:
   - Current price per unit
   - 24-hour percentage change
   - Daily high and low prices
   - Last update timestamp

### Exploring Charts
- Click on timeframe buttons (1D, 7D, 1M, 1Y, ALL) to view historical trends
- Toggle between Gold and Silver charts using the metal buttons
- Hover over chart points for detailed price information

### AI Market Insights
- View AI-generated analysis below the price cards
- Analysis updates automatically every hour
- Copy insights to clipboard using the copy button
- Get buy/sell/hold recommendations based on current trends

### Exporting Data
- Scroll to the History section
- Click the **Export CSV** button to download all price records
- Click **Clear History** to reset stored data (with confirmation)

---

## 🔑 Key Features Explained

### Smart Rate Limiting
GoldFlow implements intelligent rate limiting to work within the free API tier:
- **7 requests per hour** (~8.57 minute intervals)
- Automatic request tracking and countdown
- Smart caching between API calls
- Console logs for transparency

### Country-Specific Pricing
Retail prices include realistic markups based on:
- Local import duties and taxes (GST, VAT)
- Making charges and retailer margins
- Currency conversion rates
- Market-specific premiums

### Cache Version System
Automatic cache management ensures users always get accurate prices:
- Version tracking prevents outdated calculations
- Auto-clears cache on significant updates
- Seamless user experience during upgrades

---

## 🎯 Future Enhancements

- [ ] Price alert notifications
- [ ] Historical price comparison tools
- [ ] Multiple precious metals (Platinum, Palladium)
- [ ] Portfolio tracking
- [ ] Advanced technical indicators (SMA, RSI, Bollinger Bands)
- [ ] WebSocket integration for real-time updates
- [ ] PWA support for offline access
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **gold-api.com** - For providing reliable precious metals price data
- **Groq** - For powerful AI inference capabilities
- **Chart.js** - For beautiful, responsive charts
- **Google Fonts** - For the elegant Poppins typeface

---

## 📧 Contact

Project Link: [https://github.com/yourusername/goldflow](https://github.com/yourusername/goldflow)

---

## 📊 API Rate Limits

| API | Free Tier Limit | Interval | Used For |
|-----|----------------|----------|----------|
| gold-api.com | Unlimited (7/hour self-limited) | ~8.57 min | Price data |
| Groq AI | 30 requests/min | 1 hour | Market analysis |

---

## 🌐 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | ✅ Latest |
| Firefox | ✅ Latest |
| Safari | ✅ Latest |
| Edge | ✅ Latest |
| Opera | ✅ Latest |

---

## ⚙️ Configuration

### Customizing Update Intervals

Edit `script.js`:
```javascript
const GOLD_API_REQUESTS_PER_HOUR = 7; // Change to your preference
const AI_REQUEST_INTERVAL = 60 * 60 * 1000; // AI update interval (ms)
```

### Adding Custom Currencies

Add to `CURRENCY_RATES` object in `script.js`:
```javascript
const CURRENCY_RATES = {
    'YOUR_CURRENCY': exchange_rate,
    // ... existing currencies
};
```

### Adjusting Country Markups

Modify `COUNTRY_MARKUPS` in `script.js`:
```javascript
const COUNTRY_MARKUPS = {
    YOUR_COUNTRY: 1.XX, // 1.XX = XX% markup
    // ... existing countries
};
```

---

**Built with ❤️ for precious metals enthusiasts and investors worldwide**

*Last Updated: November 2025*
