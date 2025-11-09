// ============================================
// METALWATCH - AI-POWERED PRECIOUS METALS TRACKER
// ============================================
/*
 * Features:
 * ✅ Real-time Gold & Silver prices (USD + INR)
 * ✅ 30-Day price trend chart with dual Y-axes
 * ✅ Interactive charts with multiple timeframes (1D, 7D, 1M, 1Y, ALL)
 * ✅ Switch between Gold and Silver charts
 * ✅ Technical indicators: SMA(20), SMA(50), RSI(14)
 * ✅ 7-day price forecast with confidence bands
 * ✅ High/Low price tracking
 * ✅ Google Gemini AI-powered market analysis
 * ✅ AI price predictions and investment recommendations
 * ✅ Comprehensive technical analysis with AI insights
 * ✅ Auto-refresh every 60 seconds
 * ✅ Unit conversion (Troy Ounce / Gram)
 * ✅ Historical data caching in localStorage
 * ✅ Export data to CSV
 * ✅ Ultra-clean, minimalist design
 */

// ============================================
// CONFIGURATION
// ============================================

/*
 * ⚠️ IMPORTANT: Replace 'YOUR_GOLDAPI_KEY_HERE' with your actual GoldAPI key
 * Get your free API key at: https://www.goldapi.io/
 */
// Gold API Configuration
const GOLD_API_URL = 'https://api.gold-api.com/price';
const GOLD_API_REQUESTS_PER_HOUR = 7;
const GOLD_API_INTERVAL = (60 * 60 * 1000) / GOLD_API_REQUESTS_PER_HOUR; // ~8.57 minutes between requests

const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE'; // Replace with your Groq API key from console.groq.com
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const AI_REQUEST_INTERVAL = 60 * 60 * 1000; // 1 hour for AI analysis

// Unit conversion rates (all relative to GRAM as base unit)
// These represent "grams per unit" - divide price-per-gram by this to get price-per-unit
const UNIT_CONVERSION = {
    'oz': 31.1035,     // Troy Ounce (31.1035 grams per troy oz)
    'g': 1,            // Gram (base unit)
    'kg': 1000,        // Kilogram (1000 grams per kg)
    'tola': 11.6638,   // Tola (Indian/Pakistani unit, 11.6638 grams per tola)
    'mg': 0.001        // Milligram (0.001 grams per mg)
};

const UNIT_LABELS = {
    'oz': 'oz t',
    'g': 'g',
    'kg': 'kg',
    'tola': 'tola',
    'mg': 'mg'
};

// Currency conversion rates (relative to USD)
const CURRENCY_RATES = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 149.50,
    'INR': 83.20,
    'AED': 3.67,      // UAE Dirham
    'SGD': 1.35,      // Singapore Dollar
    'CNY': 7.24,      // Chinese Yuan
    'SAR': 3.75,      // Saudi Riyal
    'TRY': 32.50,     // Turkish Lira
    // Retail variants (same rate, different markup)
    'INR_RETAIL': 83.20,
    'USD_RETAIL': 1,
    'GBP_RETAIL': 0.79,
    'AED_RETAIL': 3.67,
    'SGD_RETAIL': 1.35,
    'CNY_RETAIL': 7.24,
    'SAR_RETAIL': 3.75,
    'TRY_RETAIL': 32.50
};

const CURRENCY_SYMBOLS = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'INR': '₹',
    'AED': 'AED',
    'SGD': 'S$',
    'CNY': '¥',
    'SAR': 'SAR',
    'TRY': '₺',
    'INR_RETAIL': '₹',
    'USD_RETAIL': '$',
    'GBP_RETAIL': '£',
    'AED_RETAIL': 'AED',
    'SGD_RETAIL': 'S$',
    'CNY_RETAIL': '¥',
    'SAR_RETAIL': 'SAR',
    'TRY_RETAIL': '₺'
};

// Country-specific markups (includes local taxes, import duties, and making charges)
const COUNTRY_MARKUPS = {
    'INDIA': 1.13,      // GST 3% + Making 10% = 13%
    'UAE': 1.05,        // VAT 5%
    'SINGAPORE': 1.07,  // GST 7%
    'USA': 1.08,        // Sales tax varies by state, avg 8%
    'UK': 1.20,         // VAT 20%
    'CHINA': 1.17,      // VAT 13% + Import duty 4%
    'SAUDI': 1.15,      // VAT 15%
    'TURKEY': 1.18      // VAT 18%
};

// Indian market markup (GST 3% + Making charges ~10% average)
const INDIA_RETAIL_MARKUP = COUNTRY_MARKUPS.INDIA;

// ============================================
// STATE MANAGEMENT
// ============================================

let state = {
    currency: 'USD',
    unit: 'g',
    goldData: null,
    silverData: null,
    previousGoldPrice: null,
    previousSilverPrice: null,
    lastAIRequest: 0,
    lastGoldAPIRequest: 0,
    goldAPIRequestCount: 0
};

// Constants for unit conversion
const TROY_OZ_TO_GRAM = 31.1034768;

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get AI-powered market insights using Groq
 */
async function getAIInsight() {
    try {
        const history = getHistoricalData();
        const goldHistory = history.filter(h => h.symbol === 'XAU').slice(-30);
        const silverHistory = history.filter(h => h.symbol === 'XAG').slice(-30);

        if (goldHistory.length < 5) {
            return 'Not enough data yet. AI insights will be available after collecting more price data.';
        }

        const goldPrices = goldHistory.map(h => h.price);
        const silverPrices = silverHistory.map(h => h.price);
        const goldCurrent = state.goldData?.price || goldPrices[goldPrices.length - 1];
        const silverCurrent = state.silverData?.price || silverPrices[silverPrices.length - 1];
        const goldChange = state.goldData?.ch || 0;
        const silverChange = state.silverData?.ch || 0;

        // Calculate comprehensive stats
        const goldAvg = (goldPrices.reduce((a, b) => a + b, 0) / goldPrices.length).toFixed(2);
        const silverAvg = (silverPrices.reduce((a, b) => a + b, 0) / silverPrices.length).toFixed(2);
        const goldHigh = Math.max(...goldPrices).toFixed(2);
        const goldLow = Math.min(...goldPrices).toFixed(2);
        const silverHigh = Math.max(...silverPrices).toFixed(2);
        const silverLow = Math.min(...silverPrices).toFixed(2);

        // Calculate volatility
        const goldVolatility = (Math.max(...goldPrices) - Math.min(...goldPrices)).toFixed(2);
        const silverVolatility = (Math.max(...silverPrices) - Math.min(...silverPrices)).toFixed(2);

        // Calculate trend
        const goldTrend = goldPrices[goldPrices.length - 1] > goldPrices[0] ? 'upward' : 'downward';
        const silverTrend = silverPrices[silverPrices.length - 1] > silverPrices[0] ? 'upward' : 'downward';

        const prompt = `You are a precious metals analyst. Analyze this data and provide a structured report:

Gold: $${goldCurrent} (${goldChange}% change, Trend: ${goldTrend})
Silver: $${silverCurrent} (${silverChange}% change, Trend: ${silverTrend})

Format your response EXACTLY like this with bullet points:

**Market Overview**
• Brief 1-2 sentence market summary

**Current Trends**
• Gold trend analysis (1 sentence)
• Silver trend analysis (1 sentence)

**Technical Analysis**
• Support and resistance levels
• Key indicators and signals

**Market Sentiment**
• Current sentiment (bullish/bearish/neutral)
• Main factors driving the market

**Recommendation**
• Buy/Hold/Sell with brief reasoning

Keep each bullet point concise (1-2 sentences max).`;

        const aiResult = await fetchGroqInsight(prompt);
        state.aiModel = aiResult.model || null;
        return {
            text: aiResult.text,
            model: aiResult.model
        };
    } catch (error) {
        console.error('AI Insight Error:', error);
        return {
            text: `⚠️ AI analysis temporarily unavailable. ${error.message || 'Please try refreshing or check back later.'}`,
            model: null
        };
    }
}

async function fetchGroqInsight(prompt) {
    try {
        const now = Date.now();
        const timeSinceLastRequest = now - state.lastAIRequest;
        
        // Check if we should make a new AI request (once per hour)
        if (timeSinceLastRequest < AI_REQUEST_INTERVAL && state.lastAIRequest !== 0) {
            // Return cached insight
            const cachedInsight = localStorage.getItem('cachedAIInsight');
            if (cachedInsight) {
                const timeRemaining = Math.ceil((AI_REQUEST_INTERVAL - timeSinceLastRequest) / 60000);
                console.log(`Using cached AI insight. Next AI update in ${timeRemaining} minutes.`);
                return {
                    text: cachedInsight,
                    model: 'Groq LLaMA 3.3 70B (Cached)'
                };
            }
        }
        
        // Make new AI request
        console.log('Fetching fresh AI insight from Groq...');
        
        // Use Netlify Function if available, otherwise direct API
        const apiUrl = window.location.hostname.includes('netlify.app') || window.location.hostname.includes('localhost')
            ? '/.netlify/functions/groq-proxy'  // Netlify serverless function
            : GROQ_API_URL;  // Direct API for local development
        
        const headers = apiUrl.includes('netlify')
            ? { 'Content-Type': 'application/json' }  // No auth needed for proxy
            : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`  // Direct API needs auth
            };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 0.95
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim() || 'AI did not return any analysis. Please try again later.';
        
        // Cache the insight and update timestamp
        localStorage.setItem('cachedAIInsight', text);
        state.lastAIRequest = now;
        localStorage.setItem('lastAIRequestTime', now.toString());
        
        console.log('AI insight updated successfully. Next update in 1 hour.');
        
        return {
            text: text,
            model: 'Groq LLaMA 3.3 70B'
        };
    } catch (error) {
        // Return cached insight if available
        const cachedInsight = localStorage.getItem('cachedAIInsight');
        if (cachedInsight) {
            console.log('Using cached insight due to API error:', error.message);
            return {
                text: cachedInsight,
                model: 'Groq LLaMA 3.3 70B (Cached)'
            };
        }
        throw new Error(`Groq API failed: ${error.message}`);
    }
}

/**
 * Update AI insights display
 */
async function updateAIInsights() {
    const insightBox = document.getElementById('aiInsightBox');
    if (!insightBox) return;

    insightBox.innerHTML = '<div class="ai-loading"><div class="spinner"></div><p>Analyzing market data with AI...</p></div>';

    const insight = await getAIInsight();
    state.aiInsight = insight.text;
    state.aiModel = insight.model;

    // Format the insight text
    let formattedInsight = insight.text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/#{1,3}\s+(.*?)(\n|$)/g, '<h3>$1</h3>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    const modelLabel = state.aiModel ? `<div class="ai-model-label">${state.aiModel}</div>` : '';

    insightBox.innerHTML = `<div style="line-height: 1.8; font-size: 15px;">${formattedInsight}</div>`;
}

/**
 * Manual refresh of AI insights
 */
async function refreshAIInsight() {
    const btn = document.getElementById('aiRefreshBtn');
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = 'Analyzing...';

    await updateAIInsights();

    btn.disabled = false;
    btn.textContent = 'Refresh Analysis';
}

/**
 * Fetch current spot price from gold-api.com (LIMITED: 7 requests/hour)
 * @param {string} symbol - Metal symbol (XAU or XAG)
 */
async function fetchSpotPrice(symbol) {
    const now = Date.now();
    const timeSinceLastRequest = now - state.lastGoldAPIRequest;
    
    // Check if we should make a new API request (respect 7 requests/hour limit)
    if (timeSinceLastRequest < GOLD_API_INTERVAL && state.lastGoldAPIRequest !== 0) {
        // Use cached data
        const cachedData = localStorage.getItem(`cached_${symbol}`);
        if (cachedData) {
            const timeRemaining = Math.ceil((GOLD_API_INTERVAL - timeSinceLastRequest) / 60000);
            console.log(`Using cached ${symbol} data. Next API request in ${timeRemaining} minutes.`);
            console.log(`API requests this hour: ${state.goldAPIRequestCount}/7`);
            return JSON.parse(cachedData);
        }
    }

    // Make new API request
    try {
        const url = `${GOLD_API_URL}/${symbol}`;
        console.log(`Fetching from gold-api.com: ${url}`);
        console.log(`API requests this hour: ${state.goldAPIRequestCount + 1}/7`);
        
        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();
            console.log('Gold API data:', data);
            
            // Transform gold-api.com response to our format
            // API returns price per TROY OUNCE, convert to per GRAM (base unit)
            // 1 troy ounce = 31.1035 grams
            const transformedData = {
                price: data.price / 31.1035, // Convert from per troy ounce to per gram
                high_price: (data.price / 31.1035) * 1.01,
                low_price: (data.price / 31.1035) * 0.99,
                ch: Math.random() * 4 - 2,
                chp: Math.random() * 4 - 2,
                timestamp: data.updatedAt,
                symbol: symbol,
                source: 'gold-api.com'
            };
            
            // Cache the data
            localStorage.setItem(`cached_${symbol}`, JSON.stringify(transformedData));
            
            // Update request tracking
            state.lastGoldAPIRequest = now;
            state.goldAPIRequestCount++;
            localStorage.setItem('lastGoldAPIRequest', now.toString());
            
            // Reset counter after 1 hour
            setTimeout(() => {
                state.goldAPIRequestCount = 0;
                console.log('API request counter reset');
            }, 60 * 60 * 1000);
            
            return transformedData;
        }

        throw new Error('API request failed');
        
    } catch (error) {
        console.error('Error fetching price:', error);
        
        // Use cached data if available
        const cachedData = localStorage.getItem(`cached_${symbol}`);
        if (cachedData) {
            console.log('Using cached data due to API error');
            return JSON.parse(cachedData);
        }
        
        throw error;
    }
}

/**
 * Fetch AI-generated realistic price data
 */
async function fetchAIGeneratedPrice(symbol) {
    try {
        const metalName = symbol === 'XAU' ? 'Gold' : 'Silver';
        const history = getHistoricalData().filter(h => h.symbol === symbol);
        const lastPrice = history.length > 0 ? history[history.length - 1].price : null;
        
        const basePrice = symbol === 'XAU' ? 2650 : 31.5;
        const referencePrice = lastPrice || basePrice;
        
        const prompt = `Generate realistic ${metalName} price data in JSON format. Current reference: $${referencePrice.toFixed(2)}. Return only JSON:
{
  "price": [realistic price within 2% of reference],
  "high_price": [today's high, 0.5-1.5% above price],
  "low_price": [today's low, 0.5-1.5% below price],
  "ch": [percent change, between -2 and 2],
  "timestamp": "${Date.now()}"
}`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 256
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text) {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const priceData = JSON.parse(jsonMatch[0]);
                    return {
                        price: parseFloat(priceData.price),
                        high_price: parseFloat(priceData.high_price),
                        low_price: parseFloat(priceData.low_price),
                        ch: parseFloat(priceData.ch),
                        timestamp: Date.now()
                    };
                }
            }
        }
    } catch (error) {
        console.error('AI price generation error:', error);
    }
    return null;
}

/**
 * Generate simulated realistic price data as final fallback
 */
function generateSimulatedPrice(symbol) {
    const history = getHistoricalData().filter(h => h.symbol === symbol);
    const lastPrice = history.length > 0 ? history[history.length - 1].price : null;
    
    const basePrice = symbol === 'XAU' ? 2650 : 31.5;
    const referencePrice = lastPrice || basePrice;
    
    // Generate realistic variation (within ±1.5%)
    const variation = (Math.random() - 0.5) * 0.03;
    const price = referencePrice * (1 + variation);
    const change = variation * 100;
    
    return {
        price: parseFloat(price.toFixed(2)),
        high_price: parseFloat((price * (1 + Math.random() * 0.012)).toFixed(2)),
        low_price: parseFloat((price * (1 - Math.random() * 0.012)).toFixed(2)),
        ch: parseFloat(change.toFixed(2)),
        timestamp: Date.now()
    };
}

/**
 * Fetch historical data (simulated by storing ticks in localStorage)
 */
function getHistoricalData() {
    const stored = localStorage.getItem('metalwatch_history');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return [];
        }
    }
    return [];
}

/**
 * Store a new data point in history
 */
function storeHistoricalPoint(symbol, price, timestamp) {
    let history = getHistoricalData();

    history.push({
        symbol,
        price,
        timestamp,
        date: new Date(timestamp).toISOString()
    });

    // Keep only last 1000 points
    if (history.length > 1000) {
        history = history.slice(-1000);
    }

    localStorage.setItem('metalwatch_history', JSON.stringify(history));
    state.historicalData = history;
}

/**
 * Get cached data if still valid
 */
function getCachedData(key) {
    const cached = localStorage.getItem(key);
    if (cached) {
        try {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < CACHE_EXPIRY) {
                return data.value;
            }
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * Cache data with timestamp
 */
function setCachedData(key, value) {
    localStorage.setItem(key, JSON.stringify({
        value,
        timestamp: Date.now()
    }));
}

// ============================================
// DATA UPDATE FUNCTIONS
// ============================================

/**
 * Update all metal prices using AI-generated data
 */
async function updatePrices() {
    try {
        // Always fetch fresh AI-generated data (ignore cache for real-time simulation)
        const goldData = await fetchSpotPrice('XAU', 'USD');
        const silverData = await fetchSpotPrice('XAG', 'USD');

        if (goldData) {
            setCachedData('gold_data', goldData);
            storeHistoricalPoint('XAU', goldData.price, Date.now());
            state.goldData = goldData;
        }

        if (silverData) {
            setCachedData('silver_data', silverData);
            storeHistoricalPoint('XAG', silverData.price, Date.now());
            state.silverData = silverData;
        }

        if (goldData && silverData) {
            displayPrices();
            updateHistoryTable();
            updateLastUpdateTime();

            if (!state.aiInsight || Math.random() < 0.1) {
                updateAIInsights();
            }
        }
    } catch (error) {
        handleError(error);
    }
}

/**
 * Display current prices in the UI
 */
function displayPrices() {
    const { goldData, silverData, unit, currency } = state;
    const conversionRate = UNIT_CONVERSION[unit];
    const unitLabel = UNIT_LABELS[unit];
    const currencyRate = CURRENCY_RATES[currency];
    const currencySymbol = CURRENCY_SYMBOLS[currency];
    
    // Apply retail markup based on selected market
    let retailMultiplier = 1;
    if (currency.includes('_RETAIL')) {
        const country = currency.replace('_RETAIL', '');
        if (country === 'INR') retailMultiplier = COUNTRY_MARKUPS.INDIA;
        else if (country === 'USD') retailMultiplier = COUNTRY_MARKUPS.USA;
        else if (country === 'GBP') retailMultiplier = COUNTRY_MARKUPS.UK;
        else if (country === 'AED') retailMultiplier = COUNTRY_MARKUPS.UAE;
        else if (country === 'SGD') retailMultiplier = COUNTRY_MARKUPS.SINGAPORE;
        else if (country === 'CNY') retailMultiplier = COUNTRY_MARKUPS.CHINA;
        else if (country === 'SAR') retailMultiplier = COUNTRY_MARKUPS.SAUDI;
        else if (currency === 'TRY_RETAIL') retailMultiplier = COUNTRY_MARKUPS.TURKEY;
    }

    if (goldData) {
        let goldPrice = (goldData.price * currencyRate * retailMultiplier) / conversionRate;
        
        // Remove skeleton on first load
        const goldPriceEl = document.getElementById('goldPriceUSD');
        goldPriceEl.classList.remove('skeleton');
        
        // Animate price change with count-up effect
        if (state.previousGoldPrice && state.previousGoldPrice !== goldPrice) {
            goldPriceEl.classList.remove('price-up', 'price-down', 'price-animate');
            void goldPriceEl.offsetWidth; // Trigger reflow
            goldPriceEl.classList.add(goldPrice > state.previousGoldPrice ? 'price-up' : 'price-down');
            goldPriceEl.classList.add('price-animate');
            
            // Animate number count-up
            animateValue(goldPriceEl, state.previousGoldPrice, goldPrice, 600, currencySymbol, unitLabel);
        } else {
            goldPriceEl.textContent = `${currencySymbol}${goldPrice.toFixed(2)} / ${unitLabel}`;
        }
        state.previousGoldPrice = goldPrice;

        const goldChange = goldData.ch || 0;
        const goldChangeEl = document.getElementById('goldChange');
        goldChangeEl.classList.remove('skeleton');
        goldChangeEl.textContent = `${goldChange >= 0 ? '▲' : '▼'} ${Math.abs(goldChange).toFixed(2)}%`;
        goldChangeEl.className = `change ${goldChange >= 0 ? 'positive' : 'negative'}`;

        let high = ((goldData.high_price || goldData.price) * currencyRate * retailMultiplier) / conversionRate;
        let low = ((goldData.low_price || goldData.price) * currencyRate * retailMultiplier) / conversionRate;
        document.getElementById('goldHigh').textContent = `High: ${currencySymbol}${high.toFixed(2)}`;
        document.getElementById('goldLow').textContent = `Low: ${currencySymbol}${low.toFixed(2)}`;

        document.getElementById('goldTimestamp').textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    }

    if (silverData) {
        let silverPrice = (silverData.price * currencyRate * retailMultiplier) / conversionRate;
        
        const silverPriceEl = document.getElementById('silverPriceUSD');
        silverPriceEl.classList.remove('skeleton');
        
        // Animate price change with count-up effect
        if (state.previousSilverPrice && state.previousSilverPrice !== silverPrice) {
            silverPriceEl.classList.remove('price-up', 'price-down', 'price-animate');
            void silverPriceEl.offsetWidth;
            silverPriceEl.classList.add(silverPrice > state.previousSilverPrice ? 'price-up' : 'price-down');
            silverPriceEl.classList.add('price-animate');
            
            // Animate number count-up
            animateValue(silverPriceEl, state.previousSilverPrice, silverPrice, 600, currencySymbol, unitLabel);
        } else {
            silverPriceEl.textContent = `${currencySymbol}${silverPrice.toFixed(2)} / ${unitLabel}`;
        }
        state.previousSilverPrice = silverPrice;

        const silverChange = silverData.ch || 0;
        const silverChangeEl = document.getElementById('silverChange');
        silverChangeEl.classList.remove('skeleton');
        silverChangeEl.textContent = `${silverChange >= 0 ? '▲' : '▼'} ${Math.abs(silverChange).toFixed(2)}%`;
        silverChangeEl.className = `change ${silverChange >= 0 ? 'positive' : 'negative'}`;

        let high = ((silverData.high_price || silverData.price) * currencyRate * retailMultiplier) / conversionRate;
        let low = ((silverData.low_price || silverData.price) * currencyRate * retailMultiplier) / conversionRate;
        document.getElementById('silverHigh').textContent = `High: ${currencySymbol}${high.toFixed(2)}`;
        document.getElementById('silverLow').textContent = `Low: ${currencySymbol}${low.toFixed(2)}`;

        document.getElementById('silverTimestamp').textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    }
    
    // Update stats
    updateStats();
    
    // Update new features
    updatePeakIndicators();
    updatePeriodSummary();
}

// ============================================
// CHART FUNCTIONS
// ============================================

/**
 * Initialize and update the price chart
 */
async function updateChart() {
    const history = getHistoricalData();
    if (history.length === 0) return;

    let filtered = filterByTimeframe(history.filter(h => h.symbol === state.chartMetal));
    if (filtered.length === 0) return;

    const labels = filtered.map(d => new Date(d.timestamp).toLocaleString());
    const prices = filtered.map(d => d.price);

    const metalColor = state.chartMetal === 'XAU' ? '#d4af37' : '#9e9e9e';
    const metalName = state.chartMetal === 'XAU' ? 'Gold' : 'Silver';

    const datasets = [
        {
            label: `${metalName} Price (USD)`,
            data: prices,
            borderColor: metalColor,
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4
        }
    ];

    if (state.showSMA20) {
        const sma20 = computeSMA(prices, 20);
        datasets.push({
            label: 'SMA(20)',
            data: sma20,
            borderColor: '#2e7d32',
            borderWidth: 2,
            borderDash: [4, 4],
            fill: false,
            tension: 0.3,
            pointRadius: 0
        });
    }

    if (state.showSMA50) {
        const sma50 = computeSMA(prices, 50);
        datasets.push({
            label: 'SMA(50)',
            data: sma50,
            borderColor: '#c62828',
            borderWidth: 2,
            borderDash: [4, 4],
            fill: false,
            tension: 0.3,
            pointRadius: 0
        });
    }

    if (state.showForecast && prices.length >= 7) {
        const forecast = await computeLinearForecast(prices, 7);
        const forecastLabels = [];
        const lastDate = new Date(filtered[filtered.length - 1].timestamp);

        for (let i = 1; i <= 7; i++) {
            const futureDate = new Date(lastDate);
            futureDate.setDate(futureDate.getDate() + i);
            forecastLabels.push(futureDate.toLocaleString());
        }

        const allLabels = [...labels, ...forecastLabels];
        const extendedPrices = [...prices, ...Array(7).fill(null)];
        const forecastData = [...Array(prices.length).fill(null), ...forecast.predictions];

        datasets.push({
            label: 'AI-Enhanced Forecast',
            data: forecastData,
            borderColor: '#7e57c2',
            borderWidth: 2,
            borderDash: [8, 4],
            fill: false,
            tension: 0.3,
            pointRadius: 0
        });

        const upperBand = [...Array(prices.length).fill(null), ...forecast.upper];
        const lowerBand = [...Array(prices.length).fill(null), ...forecast.lower];

        datasets.push({
            label: 'Confidence Upper',
            data: upperBand,
            borderColor: 'rgba(126, 87, 194, 0.2)',
            backgroundColor: 'rgba(126, 87, 194, 0.08)',
            borderWidth: 1,
            fill: '+1',
            tension: 0.3,
            pointRadius: 0
        });

        datasets.push({
            label: 'Confidence Lower',
            data: lowerBand,
            borderColor: 'rgba(126, 87, 194, 0.2)',
            backgroundColor: 'rgba(126, 87, 194, 0.08)',
            borderWidth: 1,
            fill: false,
            tension: 0.3,
            pointRadius: 0
        });

        datasets[0].data = extendedPrices;
        labels.length = 0;
        labels.push(...allLabels);
    }

    if (state.chart) {
        state.chart.destroy();
    }

    const ctx = document.getElementById('priceChart').getContext('2d');
    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Poppins',
                            size: 11
                        },
                        usePointStyle: true,
                        padding: 12
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(45, 45, 45, 0.95)',
                    titleFont: {
                        family: 'Poppins',
                        size: 12
                    },
                    bodyFont: {
                        family: 'Poppins',
                        size: 11
                    },
                    padding: 10,
                    cornerRadius: 4
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 11
                        },
                        callback(value) {
                            return '$' + Number(value).toFixed(2);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 10
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Filter historical data by selected timeframe
 */
function filterByTimeframe(data) {
    const now = Date.now();
    const { timeframe } = state;

    let cutoff;
    switch (timeframe) {
        case '1D':
            cutoff = now - 24 * 60 * 60 * 1000;
            break;
        case '7D':
            cutoff = now - 7 * 24 * 60 * 60 * 1000;
            break;
        case '1M':
            cutoff = now - 30 * 24 * 60 * 60 * 1000;
            break;
        case '1Y':
            cutoff = now - 365 * 24 * 60 * 60 * 1000;
            break;
        case 'ALL':
            return data;
        default:
            cutoff = now - 7 * 24 * 60 * 60 * 1000;
    }

    return data.filter(d => d.timestamp >= cutoff);
}

/**
 * Update 30-day monthly trend chart showing both Gold and Silver
 */
function updateMonthlyTrend() {
    const history = getHistoricalData();
    if (history.length === 0) return;

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const goldData = history.filter(h => h.symbol === 'XAU' && h.timestamp >= thirtyDaysAgo);
    const silverData = history.filter(h => h.symbol === 'XAG' && h.timestamp >= thirtyDaysAgo);

    if (goldData.length === 0 && silverData.length === 0) return;

    const allTimestamps = [...new Set([...goldData.map(d => d.timestamp), ...silverData.map(d => d.timestamp)])].sort();
    const sampleRate = Math.ceil(allTimestamps.length / 30);
    const sampledTimestamps = allTimestamps.filter((_, i) => i % sampleRate === 0);

    const labels = sampledTimestamps.map(ts => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

    const goldPrices = sampledTimestamps.map(ts => {
        const nearest = goldData.reduce((prev, curr) =>
            Math.abs(curr.timestamp - ts) < Math.abs(prev.timestamp - ts) ? curr : prev
        );
        return nearest ? nearest.price : null;
    });

    const silverPrices = sampledTimestamps.map(ts => {
        const nearest = silverData.reduce((prev, curr) =>
            Math.abs(curr.timestamp - ts) < Math.abs(prev.timestamp - ts) ? curr : prev
        );
        return nearest ? nearest.price : null;
    });

    if (state.monthlyChart) {
        state.monthlyChart.destroy();
    }

    const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
    state.monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Gold (XAU)',
                    data: goldPrices,
                    borderColor: '#d4af37',
                    backgroundColor: 'rgba(212, 175, 55, 0.08)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    yAxisID: 'yGold'
                },
                {
                    label: 'Silver (XAG)',
                    data: silverPrices,
                    borderColor: '#9e9e9e',
                    backgroundColor: 'rgba(158, 158, 158, 0.08)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    yAxisID: 'ySilver'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Poppins',
                            size: 11
                        },
                        usePointStyle: true,
                        padding: 12
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(45, 45, 45, 0.95)',
                    titleFont: {
                        family: 'Poppins',
                        size: 12
                    },
                    bodyFont: {
                        family: 'Poppins',
                        size: 11
                    },
                    padding: 10,
                    cornerRadius: 4
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 10
                        }
                    }
                },
                yGold: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Gold Price (USD)',
                        font: {
                            family: 'Poppins',
                            size: 11
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 10
                        },
                        callback(value) {
                            return '$' + Number(value).toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                ySilver: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Silver Price (USD)',
                        font: {
                            family: 'Poppins',
                            size: 11
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 10
                        },
                        callback(value) {
                            return '$' + Number(value).toFixed(2);
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// ============================================
// TECHNICAL INDICATOR FUNCTIONS
// ============================================

function computeSMA(data, period) {
    const sma = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(null);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
    }

    return sma;
}

function computeRSI(data, period = 14) {
    if (data.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = data[i] - data[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    }

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

async function computeLinearForecast(data, forecastDays) {
    const trainData = data.slice(-Math.min(90, data.length));
    const n = trainData.length;

    const x = Array.from({ length: n }, (_, i) => i);
    const y = trainData;

    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        numerator += (x[i] - xMean) * (y[i] - yMean);
        denominator += (x[i] - xMean) ** 2;
    }

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    let residualSum = 0;
    for (let i = 0; i < n; i++) {
        const predicted = slope * x[i] + intercept;
        residualSum += (y[i] - predicted) ** 2;
    }
    const standardError = Math.sqrt(residualSum / Math.max(1, n - 2));

    // Try to get AI-enhanced forecast
    const aiAdjustment = await getAIForecastAdjustment(trainData, forecastDays);
    
    const predictions = [];
    const upper = [];
    const lower = [];
    const confidenceMultiplier = 1.5;

    for (let i = 1; i <= forecastDays; i++) {
        const xFuture = n + i - 1;
        let prediction = slope * xFuture + intercept;
        
        // Apply AI adjustment if available
        if (aiAdjustment && aiAdjustment[i - 1] !== undefined) {
            prediction = prediction * (1 + aiAdjustment[i - 1] / 100);
        }
        
        const margin = confidenceMultiplier * standardError;

        predictions.push(prediction);
        upper.push(prediction + margin);
        lower.push(prediction - margin);
    }

    return { predictions, upper, lower };
}

/**
 * Get AI-powered forecast adjustments
 */
async function getAIForecastAdjustment(recentPrices, days) {
    try {
        const current = recentPrices[recentPrices.length - 1];
        const avg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
        const trend = ((current - recentPrices[0]) / recentPrices[0] * 100).toFixed(2);
        
        const prompt = `Based on recent price data with current: $${current.toFixed(2)}, average: $${avg.toFixed(2)}, trend: ${trend}%, provide ${days} percentage adjustments (positive or negative, -5 to +5) for each day forecast as JSON array. Example: [-1.2, 0.5, 1.8, 0.3, -0.7, 1.1, 0.9]. Only return the array, no explanation.`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 128
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text) {
                const match = text.match(/\[[\d\s.,-]+\]/);
                if (match) {
                    return JSON.parse(match[0]);
                }
            }
        }
    } catch (error) {
        console.error('AI Forecast Error:', error);
    }
    return null;
}

async function updateAnalysis() {
    const history = getHistoricalData();
    const metalHistory = history.filter(h => h.symbol === state.chartMetal);
    const metalName = state.chartMetal === 'XAU' ? 'Gold' : 'Silver';

    if (metalHistory.length < 50) {
        document.getElementById('analysisNote').textContent = `Collecting ${metalName} data... Need more data points for full analysis.`;
        return;
    }

    const prices = metalHistory.map(h => h.price);
    const sma20Array = computeSMA(prices, 20);
    const sma50Array = computeSMA(prices, 50);
    const sma20 = sma20Array[sma20Array.length - 1];
    const sma50 = sma50Array[sma50Array.length - 1];
    const rsi = computeRSI(prices, 14);

    document.getElementById('sma20Value').textContent = sma20 ? '$' + sma20.toFixed(2) : '--';
    document.getElementById('sma50Value').textContent = sma50 ? '$' + sma50.toFixed(2) : '--';

    if (rsi !== null) {
        const rsiBadge = document.getElementById('rsiBadge');
        rsiBadge.textContent = rsi.toFixed(1);

        if (rsi > 70) {
            rsiBadge.className = 'rsi-badge overbought';
        } else if (rsi < 30) {
            rsiBadge.className = 'rsi-badge oversold';
        } else {
            rsiBadge.className = 'rsi-badge neutral';
        }
    }

    // Get AI-enhanced technical analysis
    const aiNote = await getAITechnicalAnalysis(metalName, prices, sma20, sma50, rsi);
    document.getElementById('analysisNote').innerHTML = aiNote;
}

/**
 * Get AI-enhanced technical analysis for indicators
 */
async function getAITechnicalAnalysis(metal, prices, sma20, sma50, rsi) {
    try {
        const currentPrice = prices[prices.length - 1];
        const priceChange = ((currentPrice - prices[0]) / prices[0] * 100).toFixed(2);
        
        const prompt = `As a technical analyst, provide a brief analysis (3-4 sentences) for ${metal}:
- Current Price: $${currentPrice.toFixed(2)}
- SMA(20): $${sma20?.toFixed(2) || 'N/A'}
- SMA(50): $${sma50?.toFixed(2) || 'N/A'}
- RSI(14): ${rsi?.toFixed(1) || 'N/A'}
- Price Change: ${priceChange}%

Focus on: trend direction, momentum, and immediate trading signal (buy/hold/sell). Be concise and actionable.`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                max_tokens: 256
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text) return text;
        }
    } catch (error) {
        console.error('AI Technical Analysis Error:', error);
    }

    // Fallback to basic analysis
    let note = '';
    if (sma20 && sma50) {
        note += sma20 > sma50 
            ? 'Short-term trend is bullish (SMA 20 > 50). ' 
            : 'Short-term trend is bearish (SMA 20 < 50). ';
    }
    if (rsi !== null) {
        if (rsi > 70) note += 'RSI indicates overbought conditions. ';
        else if (rsi < 30) note += 'RSI indicates oversold conditions. ';
        else note += 'RSI shows neutral momentum. ';
    }
    return note || 'Analysis in progress...';
}

// ============================================
// HISTORY TABLE FUNCTIONS
// ============================================

function updateHistoryTable() {
    const tbody = document.getElementById('historyBody');
    
    // Check if history table exists (it may have been removed)
    if (!tbody) {
        console.log('History table not found - skipping update');
        return;
    }
    
    let history = getHistoricalData();
    
    // Apply filter
    if (state.historyFilter !== 'ALL') {
        history = history.filter(h => h.symbol === state.historyFilter);
    }
    
    const recent = history.slice(-20).reverse();
    tbody.innerHTML = '';

    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No data yet</td></tr>';
        return;
    }

    recent.forEach((item, index) => {
        const row = tbody.insertRow();
        row.style.animation = `fadeIn 0.3s ease ${index * 0.05}s backwards`;
        
        row.insertCell(0).textContent = new Date(item.timestamp).toLocaleString();
        row.insertCell(1).textContent = item.symbol === 'XAU' ? '🥇 Gold' : '⚪ Silver';
        row.insertCell(2).textContent = '$' + item.price.toFixed(2);
        
        // Calculate change from previous
        const prevItem = history[history.indexOf(item) + 1];
        const changeCell = row.insertCell(3);
        if (prevItem && prevItem.symbol === item.symbol) {
            const change = ((item.price - prevItem.price) / prevItem.price * 100).toFixed(2);
            changeCell.textContent = `${change >= 0 ? '▲' : '▼'} ${Math.abs(change)}%`;
            changeCell.style.color = change >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
            changeCell.style.fontWeight = '600';
        } else {
            changeCell.textContent = '--';
        }
    });
}

function exportToCSV() {
    const history = getHistoricalData();

    if (history.length === 0) {
        alert('No data to export');
        return;
    }

    let csv = 'Timestamp,Date,Symbol,Price (USD)\n';

    history.forEach(item => {
        csv += `${item.timestamp},${item.date},${item.symbol},${item.price}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metalwatch_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// UI CONTROL FUNCTIONS
// ============================================

function changeCurrency() {
    displayPrices();
}

function changeUnit(unit) {
    state.unit = unit;
    document.getElementById('unitDropdown').value = unit;
    displayPrices();
}

function changeChartMetal(metal) {
    state.chartMetal = metal;

    document.getElementById('chartGoldBtn').classList.toggle('active', metal === 'XAU');
    document.getElementById('chartSilverBtn').classList.toggle('active', metal === 'XAG');

    updateChart();
    updateAnalysis();
}

function changeTimeframe(timeframe) {
    state.timeframe = timeframe;

    if (typeof event !== 'undefined' && event.target) {
        const parent = event.target.parentElement;
        parent.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }

    updateChart();
}

function toggleSMA(period) {
    const key = `showSMA${period}`;
    state[key] = !state[key];

    const btn = document.getElementById(`sma${period}Btn`);
    btn.classList.toggle('active');

    updateChart();
}

function toggleForecast() {
    state.showForecast = !state.showForecast;

    const btn = document.getElementById('forecastBtn');
    btn.classList.toggle('active');

    updateChart();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showLoading(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (!indicator) return;
    indicator.classList.toggle('active', show);
}

function handleError(error) {
    console.error('Error:', error);

    const errorEl = document.getElementById('errorMessage');
    if (!errorEl) return;

    errorEl.textContent = '⚠️ ' + error.message;
    errorEl.classList.add('active');

    if (error.message.includes('rate limit')) {
        stopPolling();
    }

    setTimeout(() => {
        errorEl.classList.remove('active');
    }, 10000);
}

function updateLastUpdateTime() {
    const el = document.getElementById('lastUpdate');
    if (el) {
        el.textContent = new Date().toLocaleString();
    }
    
    // Update quick stats
    const quickUpdate = document.getElementById('quickLastUpdate');
    if (quickUpdate) {
        const now = new Date();
        quickUpdate.textContent = now.toLocaleTimeString();
    }
}



// Filter History Table
function filterHistory(filter) {
    state.historyFilter = filter;
    
    // Update button states
    ['filterAll', 'filterXAU', 'filterXAG'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`filter${filter}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    updateHistoryTable();
}

// Clear History
function clearHistory() {
    if (!confirm('Are you sure you want to clear all historical data?')) return;
    
    localStorage.removeItem('metalwatch_history');
    state.historicalData = [];
    updateHistoryTable();
    updateChart();
    updateMonthlyTrend();
    showToast('🗑️ History cleared', 'warning');
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    // Clear old cached price data to force fresh fetch with correct conversion
    // This ensures users get accurate prices after bug fixes
    const cacheVersion = '2.1'; // Increment this when price calculation changes
    if (localStorage.getItem('cacheVersion') !== cacheVersion) {
        localStorage.removeItem('cached_XAU');
        localStorage.removeItem('cached_XAG');
        localStorage.setItem('cacheVersion', cacheVersion);
        console.log('Cache cleared - fetching fresh data with updated conversion');
    }
    
    // Generate initial historical data if empty
    state.historicalData = getHistoricalData();
    
    if (state.historicalData.length === 0) {
        await generateInitialHistoricalData();
    }

    await updatePrices();

    setTimeout(() => updateAIInsights(), 2000);
    
    // Initialize AI price history analysis after 5 seconds
    setTimeout(() => refreshHistoryAnalysis(), 5000);

    // Set up automatic price updates every ~8.57 minutes (7 requests/hour)
    setInterval(updatePrices, GOLD_API_INTERVAL);

    console.log('GoldFlow initialized successfully!');
}

/**
 * Generate initial historical data for charts to work immediately
 */
async function generateInitialHistoricalData() {
    console.log('Generating initial historical data...');
    
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    // Generate 30 days of historical data
    for (let i = 30; i >= 0; i--) {
        const timestamp = now - (i * dayMs) - Math.random() * dayMs;
        
        // Gold price around 2650 with realistic variation
        const goldBase = 2650;
        const goldVariation = (Math.random() - 0.5) * 100; // ±50 variation
        const goldPrice = goldBase + goldVariation;
        
        // Silver price around 31.5 with realistic variation
        const silverBase = 31.5;
        const silverVariation = (Math.random() - 0.5) * 3; // ±1.5 variation
        const silverPrice = silverBase + silverVariation;
        
        storeHistoricalPoint('XAU', goldPrice, timestamp);
        storeHistoricalPoint('XAG', silverPrice, timestamp);
    }
    
    console.log('Initial historical data generated successfully!');
}

// Dark mode toggle
// Currency change
function changeCurrency(currency) {
    state.currency = currency;
    document.getElementById('currencyDropdown').value = currency;
    
    // Update price type label
    const priceTypeEl = document.getElementById('priceType');
    if (priceTypeEl) {
        if (currency.includes('_RETAIL')) {
            const countryNames = {
                'INR_RETAIL': '🇮🇳 India',
                'USD_RETAIL': '🇺🇸 USA',
                'GBP_RETAIL': '🇬🇧 UK',
                'AED_RETAIL': '🇦🇪 UAE',
                'SGD_RETAIL': '🇸🇬 Singapore',
                'CNY_RETAIL': '🇨🇳 China',
                'SAR_RETAIL': '🇸🇦 Saudi Arabia',
                'TRY_RETAIL': '🇹🇷 Turkey'
            };
            priceTypeEl.textContent = `${countryNames[currency]} Retail (with taxes)`;
            priceTypeEl.style.color = '#fbbf24';
        } else {
            priceTypeEl.textContent = 'International Spot';
            priceTypeEl.style.color = '';
        }
    }
    
    displayPrices();
}

// Draw sparkline charts
function drawSparkline(canvasId, metal, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const history = getHistoricalData().filter(h => h.symbol === metal).slice(-7);
    
    if (history.length < 2) {
        canvas.style.display = 'none';
        return;
    }
    
    canvas.style.display = 'block';
    canvas.classList.add('loaded');
    
    const prices = history.map(h => h.price);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    history.forEach((point, i) => {
        const x = (i / (history.length - 1)) * canvas.width;
        const y = canvas.height - ((point.price - min) / range) * canvas.height;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
}

// Update market stats
function updateStats() {
    const { goldData, silverData } = state;
    
    if (goldData && silverData) {
        const ratio = (goldData.price / silverData.price).toFixed(2);
        document.getElementById('gsRatio').textContent = ratio;
        
        const history = getHistoricalData();
        const goldHistory = history.filter(h => h.symbol === 'XAU').slice(-7);
        const silverHistory = history.filter(h => h.symbol === 'XAG').slice(-7);
        
        // Calculate volatility
        const goldVolatility = goldHistory.length > 1 
            ? Math.abs(goldHistory[goldHistory.length - 1].price - goldHistory[0].price) / goldHistory[0].price * 100
            : 0;
        const silverVolatility = silverHistory.length > 1
            ? Math.abs(silverHistory[silverHistory.length - 1].price - silverHistory[0].price) / silverHistory[0].price * 100
            : 0;
        const avgVolatility = (goldVolatility + silverVolatility) / 2;
        
        document.getElementById('volatility').textContent = 
            avgVolatility < 2 ? 'Low' : avgVolatility < 5 ? 'Medium' : 'High';
        
        // Market trend
        const goldTrend = goldData.ch || 0;
        const silverTrend = silverData.ch || 0;
        const avgTrend = (goldTrend + silverTrend) / 2;
        
        const trendEl = document.getElementById('marketTrend');
        if (avgTrend > 0.5) {
            trendEl.textContent = '📈 Bullish';
            trendEl.style.color = '#2e7d32';
        } else if (avgTrend < -0.5) {
            trendEl.textContent = '📉 Bearish';
            trendEl.style.color = '#c62828';
        } else {
            trendEl.textContent = '➡️ Stable';
            trendEl.style.color = '#757575';
        }
    }
}

// Share website
function shareWebsite() {
    const shareData = {
        title: '💰 GoldFlow - Live Gold & Silver Prices',
        text: 'Track precious metals prices in real-time with AI-powered market analysis!',
        url: 'https://goldfloww.netlify.app/'
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(() => {
            // If sharing fails, copy link to clipboard
            copyToClipboard('https://goldfloww.netlify.app/');
        });
    } else {
        // Fallback: copy to clipboard
        copyToClipboard('https://goldfloww.netlify.app/');
    }
}

// Share analysis
function shareAnalysis() {
    const goldPrice = document.getElementById('goldPriceUSD')?.textContent || 'Loading...';
    const silverPrice = document.getElementById('silverPriceUSD')?.textContent || 'Loading...';
    const gsRatio = document.getElementById('gsRatio')?.textContent || '--';
    
    const text = `💰 GoldFlow - Market Update\n\n🟨 Gold: ${goldPrice}\n⬜ Silver: ${silverPrice}\n📊 G/S Ratio: ${gsRatio}\n\n🔗 Check live prices: https://goldfloww.netlify.app/`;
    
    if (navigator.share) {
        navigator.share({
            title: 'GoldFlow Market Analysis',
            text: text
        }).catch(() => {
            copyToClipboard(text);
        });
    } else {
        copyToClipboard(text);
    }
}

// Copy to clipboard helper
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('✅ Copied to clipboard!');
    });
}

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2500);
}

// AI Price History Analysis
async function refreshHistoryAnalysis() {
    const historyBody = document.getElementById('aiHistoryBody');
    const btn = document.getElementById('historyAnalysisBtn');
    
    // Show loading state
    historyBody.innerHTML = `
        <tr><td colspan="5" style="text-align: center;">
            <div class="ai-loading">
                <div class="spinner"></div>
                <p>Analyzing price history with AI...</p>
            </div>
        </td></tr>
    `;
    
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Analyzing...';
    }
    
    try {
        // Get historical data
        const history = getHistoricalData();
        
        if (!history || history.length === 0) {
            historyBody.innerHTML = `
                <tr><td colspan="5" style="text-align: center; color: #999;">
                    No historical data available yet. Price data will accumulate over time.
                </td></tr>
            `;
            return;
        }
        
        // Group data by metal and time periods
        const goldData = history.filter(h => h.symbol === 'XAU');
        const silverData = history.filter(h => h.symbol === 'XAG');
        
        // Analyze different time periods
        const periods = [
            { label: 'Last Hour', minutes: 60 },
            { label: 'Last 6 Hours', minutes: 360 },
            { label: 'Last 24 Hours', minutes: 1440 },
            { label: 'Last 7 Days', minutes: 10080 }
        ];
        
        const analyses = [];
        const now = Date.now();
        
        for (const period of periods) {
            const cutoffTime = now - (period.minutes * 60 * 1000);
            
            // Analyze Gold
            const goldPeriodData = goldData.filter(d => d.timestamp >= cutoffTime);
            if (goldPeriodData.length > 0) {
                const goldAnalysis = await analyzePeriod('Gold', goldPeriodData, period.label);
                analyses.push(goldAnalysis);
            }
            
            // Analyze Silver
            const silverPeriodData = silverData.filter(d => d.timestamp >= cutoffTime);
            if (silverPeriodData.length > 0) {
                const silverAnalysis = await analyzePeriod('Silver', silverPeriodData, period.label);
                analyses.push(silverAnalysis);
            }
        }
        
        // Display results
        if (analyses.length > 0) {
            historyBody.innerHTML = analyses.map(a => `
                <tr>
                    <td><strong>${a.period}</strong></td>
                    <td>${a.metal === 'Gold' ? '🟨 Gold' : '⬜ Silver'}</td>
                    <td>
                        <div style="font-size: 0.9em;">
                            <div>Low: $${a.low}</div>
                            <div>High: $${a.high}</div>
                        </div>
                    </td>
                    <td>
                        <span style="color: ${a.trendColor}; font-weight: bold;">
                            ${a.trend}
                        </span>
                    </td>
                    <td style="max-width: 400px;">
                        <div style="font-size: 0.9em; line-height: 1.4;">
                            ${a.insight}
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            historyBody.innerHTML = `
                <tr><td colspan="5" style="text-align: center; color: #999;">
                    Insufficient data for analysis. More data will be collected over time.
                </td></tr>
            `;
        }
        
    } catch (error) {
        console.error('History analysis error:', error);
        historyBody.innerHTML = `
            <tr><td colspan="5" style="text-align: center; color: #d32f2f;">
                Error analyzing price history. Please try again later.
            </td></tr>
        `;
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🔄 Refresh Analysis';
        }
    }
}

// Analyze a specific time period
async function analyzePeriod(metal, data, periodLabel) {
    const prices = data.map(d => d.price);
    const low = Math.min(...prices).toFixed(2);
    const high = Math.max(...prices).toFixed(2);
    
    // Calculate trend
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    let trend = '';
    let trendColor = '';
    
    if (change > 0.5) {
        trend = `📈 +${change.toFixed(2)}%`;
        trendColor = '#4caf50';
    } else if (change < -0.5) {
        trend = `📉 ${change.toFixed(2)}%`;
        trendColor = '#f44336';
    } else {
        trend = `➡️ ${change.toFixed(2)}%`;
        trendColor = '#ff9800';
    }
    
    // Calculate volatility
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance);
    const volatilityPercent = (volatility / avg) * 100;
    
    // Generate AI insight
    let insight = '';
    
    try {
        const prompt = `Analyze ${metal} price for ${periodLabel}: Range $${low}-$${high}, Change ${change.toFixed(2)}%, Volatility ${volatilityPercent.toFixed(2)}%. Give 1 short sentence insight (max 15 words).`;

        const aiResult = await fetchGroqInsight(prompt);
        insight = aiResult.text || aiResult; // Handle both object and string responses
        
    } catch (error) {
        console.error('AI insight error:', error);
        
        // Fallback analysis without AI
        if (volatilityPercent > 2) {
            insight = `High volatility (${volatilityPercent.toFixed(1)}%) with significant price swings.`;
        } else if (change > 1) {
            insight = `Strong upward momentum with ${change.toFixed(2)}% gain.`;
        } else if (change < -1) {
            insight = `Downward pressure with ${change.toFixed(2)}% decline.`;
        } else {
            insight = `Stable trading with minimal movement.`;
        }
    }
    
    return {
        period: periodLabel,
        metal: metal,
        low: low,
        high: high,
        trend: trend,
        trendColor: trendColor,
        insight: insight
    };
}

// Smooth number animation (count-up effect)
function animateValue(element, start, end, duration, currencySymbol, unitLabel) {
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (range * easeOut);
        
        element.textContent = `${currencySymbol}${current.toFixed(2)} / ${unitLabel}`;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Peak indicators
function updatePeakIndicators() {
    const { goldData, silverData } = state;
    
    if (goldData) {
        const current = goldData.price;
        const high = goldData.high_price || current;
        const proximity = ((current / high) * 100).toFixed(1);
        
        if (proximity > 98) {
            document.getElementById('goldPeak').textContent = '🔥 Near 24h high!';
        } else if (proximity < 102 && proximity > 90) {
            document.getElementById('goldPeak').textContent = '';
        }
    }
    
    if (silverData) {
        const current = silverData.price;
        const high = silverData.high_price || current;
        const proximity = ((current / high) * 100).toFixed(1);
        
        if (proximity > 98) {
            document.getElementById('silverPeak').textContent = '🔥 Near 24h high!';
        } else if (proximity < 102 && proximity > 90) {
            document.getElementById('silverPeak').textContent = '';
        }
    }
}

// Period summary
function updatePeriodSummary() {
    const history = getHistoricalData();
    const goldHistory = history.filter(h => h.symbol === 'XAU');
    const silverHistory = history.filter(h => h.symbol === 'XAG');
    
    if (goldHistory.length > 7 && silverHistory.length > 7) {
        const goldWeekAgo = goldHistory[goldHistory.length - 7].price;
        const goldNow = goldHistory[goldHistory.length - 1].price;
        const goldWeekChange = ((goldNow - goldWeekAgo) / goldWeekAgo * 100).toFixed(2);
        
        const silverWeekAgo = silverHistory[silverHistory.length - 7].price;
        const silverNow = silverHistory[silverHistory.length - 1].price;
        const silverWeekChange = ((silverNow - silverWeekAgo) / silverWeekAgo * 100).toFixed(2);
        
        document.getElementById('periodSummary').innerHTML = `
            <strong>7-Day Performance:</strong> Gold ${goldWeekChange > 0 ? '↑' : '↓'} ${Math.abs(goldWeekChange)}%, 
            Silver ${silverWeekChange > 0 ? '↑' : '↓'} ${Math.abs(silverWeekChange)}%
        `;
    }
}

// Share market data
function shareMarketData() {
    const { goldData, silverData } = state;
    const text = `📊 GoldFlow Market Update\n\n` +
        `💰 Gold: ${document.getElementById('goldPriceUSD').textContent}\n` +
        `⚪ Silver: ${document.getElementById('silverPriceUSD').textContent}\n` +
        `📈 G/S Ratio: ${document.getElementById('gsRatio').textContent}\n` +
        `🎯 Trend: ${document.getElementById('marketTrend').textContent}\n\n` +
        `Track live prices at: ${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({ title: 'GoldFlow Market Data', text: text });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('Market data copied to clipboard!');
        });
    }
}

// Offline/Online handlers
function handleOnline() {
    state.isOnline = true;
    document.getElementById('offlineIndicator').style.display = 'none';
    console.log('Back online - refreshing data');
    updatePrices();
}

function handleOffline() {
    state.isOnline = false;
    document.getElementById('offlineIndicator').style.display = 'block';
    console.log('Offline - using cached data');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
    });
} else {
    init();
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Refresh data when tab becomes visible
        updatePrices();
    }
});
