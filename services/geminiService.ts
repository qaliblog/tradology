import { GoogleGenAI } from "@google/genai";
import type { ChartDataPoint } from '../types';
import { getEffectiveApiKey } from './apiKeyService';
import { multiApiService } from './multiApiService';
import { processTradingViewHtml, extractTradingViewData } from './tradingViewScraper';

/**
 * Check if the prompt contains a TradingView URL
 */
function isTradingViewUrl(prompt: string): boolean {
  return prompt.includes('tradingview.com') || prompt.includes('tradingview');
}

/**
 * Extract TradingView data if the prompt contains TradingView content
 */
async function handleTradingViewData(prompt: string): Promise<ChartDataPoint[]> {
  try {
    console.log('Detected TradingView content, attempting to extract data');
    
    // Check if the prompt contains HTML content (like the user provided)
    if (prompt.includes('<!DOCTYPE html>') || prompt.includes('<html')) {
      console.log('Found HTML content in prompt, processing directly');
      const tradingViewData = processTradingViewHtml(prompt, '');
      return tradingViewData.dataPoints;
    }
    
    // Check if it's a TradingView URL
    const urlMatch = prompt.match(/https?:\/\/[^\s]+tradingview[^\s]*/i);
    if (urlMatch) {
      console.log('Found TradingView URL:', urlMatch[0]);
      const tradingViewData = await extractTradingViewData(urlMatch[0]);
      return tradingViewData.dataPoints;
    }
    
    // If it mentions TradingView but no specific URL, generate sample data
    console.log('TradingView mentioned but no URL found, generating sample data');
    return generateHistoricalData(199.50, '1M'); // SOL default price
    
  } catch (error) {
    console.error('Error handling TradingView data:', error);
    // Fallback to generating sample data
    return generateHistoricalData(199.50, '1M');
  }
}

/**
 * Clean common JSON formatting issues
 */
function cleanJsonString(jsonStr: string): string {
    let cleaned = jsonStr.trim();
    
    // Remove any leading/trailing text that's not JSON
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    // Fix common issues
    cleaned = cleaned
        .replace(/[\r\n\t]/g, ' ')  // Replace newlines and tabs with spaces
        .replace(/\s+/g, ' ')       // Replace multiple spaces with single space
        .replace(/,\s*}/g, '}')     // Remove trailing commas before }
        .replace(/,\s*]/g, ']')     // Remove trailing commas before ]
        .replace(/'/g, '"')         // Replace single quotes with double quotes
        .replace(/(\w+):/g, '"$1":') // Add quotes around unquoted keys
        .replace(/:\s*([^",{\[\s][^",}\]\s]*)/g, ': "$1"') // Add quotes around unquoted string values
        .replace(/:\s*"([^"]*)"\s*([,}])/g, ': "$1"$2') // Ensure proper string formatting
        .replace(/\s+/g, ' ')       // Clean up extra spaces again
        .trim();
    
    return cleaned;
}

/**
 * Attempt to extract price data from analysis text when structured data is not available
 */
function extractPriceDataFromAnalysis(analysis: string): ChartDataPoint[] {
    const extractedData: ChartDataPoint[] = [];
    
    try {
        // Look for price patterns in the analysis text - expanded patterns
        const pricePatterns = [
            // Pattern: "current price is $123.45"
            /current price (?:is|at|of) \$?([0-9,]+\.?[0-9]*)/i,
            // Pattern: "trading at $123.45"
            /trading at \$?([0-9,]+\.?[0-9]*)/i,
            // Pattern: "price: $123.45"
            /price:?\s*\$?([0-9,]+\.?[0-9]*)/i,
            // Pattern: "around $123.45"
            /around \$?([0-9,]+\.?[0-9]*)/i,
            // Pattern: "near $123.45"
            /near \$?([0-9,]+\.?[0-9]*)/i,
            // Pattern: "SOL is at $123.45"
            /(?:SOL|sol|Solana) (?:is )?at \$?([0-9,]+\.?[0-9]*)/i,
            // Pattern: "valued at $123.45"
            /valued at \$?([0-9,]+\.?[0-9]*)/i,
            // Pattern: "priced at $123.45"
            /priced at \$?([0-9,]+\.?[0-9]*)/i,
            // Pattern: "$123.45" (standalone price)
            /\$([0-9,]+\.?[0-9]*)/g,
            // Pattern: "123.45 USD"
            /([0-9,]+\.?[0-9]*)\s*USD/i,
            // Pattern: "123.45 dollars"
            /([0-9,]+\.?[0-9]*)\s*dollars/i,
            // Pattern: "worth $123.45"
            /worth \$?([0-9,]+\.?[0-9]*)/i,
            // Pattern: "costs $123.45"
            /costs \$?([0-9,]+\.?[0-9]*)/i,
            // Pattern: "sells for $123.45"
            /sells for \$?([0-9,]+\.?[0-9]*)/i,
        ];

        let currentPrice: number | null = null;
        const foundPrices: number[] = [];
        
        for (const pattern of pricePatterns) {
            const matches = analysis.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    const priceStr = match[1].replace(/,/g, '');
                    const price = parseFloat(priceStr);
                    if (!isNaN(price) && price > 0 && price < 10000) { // Reasonable price range
                        foundPrices.push(price);
                    }
                }
            }
        }

        // Use the most common price or the first reasonable price found
        if (foundPrices.length > 0) {
            // Sort prices and use the median or most frequent
            foundPrices.sort((a, b) => a - b);
            currentPrice = foundPrices[Math.floor(foundPrices.length / 2)]; // Use median
            console.log("Found prices:", foundPrices, "Using:", currentPrice);
        }

        // If we found a current price, create realistic historical data
        if (currentPrice !== null) {
            console.log("Found current price:", currentPrice, "Generating historical data");
            extractedData.push(...generateHistoricalData(currentPrice, '1M'));
        } else {
            // If no price found, try to generate data based on common crypto prices
            console.log("No price found, generating sample data for demonstration");
            extractedData.push(...generateHistoricalData(199, '1M')); // Default SOL price
        }
    } catch (error) {
        console.error("Error extracting price data from analysis:", error);
        // Fallback: generate sample data
        extractedData.push(...generateHistoricalData(199, '1M'));
    }
    
    return extractedData;
}

/**
 * Generate realistic historical data based on current price
 */
function generateHistoricalData(currentPrice: number, timeframe: string = '1M'): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    const today = new Date();
    
    // Determine number of data points based on timeframe
    let dataPoints = 90; // Default to 3 months for better chart display
    let daysBack = 90;
    
    switch (timeframe) {
        case '1D':
            dataPoints = 24; // Hourly data for 1 day
            daysBack = 1;
            break;
        case '1W':
            dataPoints = 7;
            daysBack = 7;
            break;
        case '1M':
            dataPoints = 30;
            daysBack = 30;
            break;
        case '3M':
            dataPoints = 90;
            daysBack = 90;
            break;
        case '6M':
            dataPoints = 180;
            daysBack = 180;
            break;
        case '1Y':
            dataPoints = 365;
            daysBack = 365;
            break;
        case 'ALL':
            dataPoints = 1000; // 3+ years of data
            daysBack = 1000;
            break;
    }
    
    // Generate historical data
    for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Create realistic price movement with different volatility for different timeframes
        const baseVolatility = timeframe === '1D' ? 0.02 : timeframe === '1W' ? 0.03 : 0.05;
        const volatility = baseVolatility * (1 + Math.random() * 0.5);
        
        // Add trend based on timeframe
        let trend = 0;
        if (timeframe === '1Y' || timeframe === 'ALL') {
            trend = 0.0005; // Slight upward trend for longer timeframes
        } else if (timeframe === '1M' || timeframe === '3M') {
            trend = i > dataPoints * 0.7 ? 0.001 : -0.0005; // Recent uptrend
        }
        
        // Calculate price for this day
        const daysFromCurrent = dataPoints - 1 - i;
        const priceChange = (Math.random() - 0.5) * volatility + trend;
        
        // For the most recent day (i = dataPoints - 1), use the exact current price
        if (i === dataPoints - 1) {
            var dayPrice = currentPrice;
        } else {
            var dayPrice = currentPrice * Math.pow(1 + priceChange, daysFromCurrent);
        }
        
        // Generate OHLC data with more realistic spreads
        const spread = dayPrice * 0.01; // 1% spread
        const open = dayPrice + (Math.random() - 0.5) * spread;
        const close = dayPrice + (Math.random() - 0.5) * spread;
        const high = Math.max(open, close) + Math.random() * spread * 0.5;
        const low = Math.min(open, close) - Math.random() * spread * 0.5;
        
        // Generate volume based on volatility and timeframe
        const baseVolume = timeframe === '1D' ? 100000 : timeframe === '1W' ? 500000 : 1000000;
        const volumeMultiplier = 0.3 + Math.random() * 2; // More variation
        const volume = Math.round(baseVolume * volumeMultiplier);
        const volumeStr = volume > 1000000 ? 
            `${(volume / 1000000).toFixed(1)}M` : 
            volume > 1000 ? 
            `${(volume / 1000).toFixed(0)}K` : 
            volume.toString();
        
        data.push({
            date: dateStr,
            open: Number(open.toFixed(2)),
            high: Number(high.toFixed(2)),
            low: Number(low.toFixed(2)),
            close: Number(close.toFixed(2)),
            volume: volumeStr
        });
    }
    
    return data;
}

interface GroundingChunk {
    web: {
        uri: string;
        title: string;
    };
}

interface AnalysisResponse {
    analysis: string;
    sources: { uri: string; title: string; }[];
    chartData: ChartDataPoint[];
}

export async function getTradingAnalysis(
  prompt: string, 
  strategy: string = 'technical',
  customInstructions?: string
): Promise<AnalysisResponse> {
  let apiKey: string | null = null;
  let usedMultiApi = false;

  // Try multi-API first if enabled
  if (multiApiService.isMultiApiEnabled()) {
    apiKey = multiApiService.getNextApiKey();
    usedMultiApi = true;
  }

  // Fallback to single API key
  if (!apiKey) {
    apiKey = getEffectiveApiKey();
    usedMultiApi = false;
  }
  
  if (!apiKey) {
    throw new Error("No Gemini API key found. Please set your API key in the settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.5-flash";
  
  // Get strategy-specific instructions
  const getStrategyInstructions = (strategy: string, customInstructions?: string): string => {
    if (strategy === 'custom' && customInstructions) {
      return customInstructions;
    }

    const strategyInstructions = {
      technical: `You are a technical analysis expert. Focus on:
- Price action patterns and chart formations
- Support and resistance levels
- Technical indicators (RSI, MACD, Moving Averages)
- Volume analysis
- Trend identification and momentum
- Entry and exit signals based on technical patterns`,
      
      fundamental: `You are a fundamental analysis expert. Focus on:
- Market capitalization and valuation metrics
- Recent news and developments
- Market sentiment and adoption
- Competitive landscape
- Regulatory environment
- Long-term growth prospects and risks`,
      
      sentiment: `You are a market sentiment expert. Focus on:
- Social media sentiment and community discussions
- News sentiment and media coverage
- Fear and greed indicators
- Market psychology and behavioral patterns
- Community engagement and adoption trends
- Sentiment-driven price movements`,
      
      momentum: `You are a momentum trading expert. Focus on:
- Short-term price movements and volatility
- Momentum indicators and oscillators
- Breakout patterns and volume surges
- Quick entry and exit opportunities
- Risk management for short-term trades
- Market timing and momentum shifts`,
      
      swing: `You are a swing trading expert. Focus on:
- Medium-term price swings and trends
- Swing highs and lows identification
- Risk-reward ratios for swing trades
- Market cycles and seasonal patterns
- Position sizing for swing trades
- Entry and exit timing for 3-7 day holds`
    };

    return strategyInstructions[strategy as keyof typeof strategyInstructions] || strategyInstructions.technical;
  };

  const systemInstruction = `You are an expert financial analyst. Your name is 'Gemini Analyst'.

  You MUST use the Google Search tool to find the most current information to answer the user's request.
  
  CRITICAL FORMATTING REQUIREMENTS:
  - You MUST respond with ONLY a valid JSON object
  - Do NOT include any text before or after the JSON
  - Do NOT wrap the JSON in markdown code blocks (three backticks with json or three backticks)
  - Do NOT include any explanatory text
  - Start your response with { and end with }
  
  Your task is to provide two things in a single JSON response:
  1. A comprehensive analysis (string) using the specified strategy
  2. Recent historical price data (array of objects) - if available
  
  ANALYSIS STRATEGY INSTRUCTIONS:
  ${getStrategyInstructions(strategy, customInstructions)}
  
  Structure your analysis with Markdown:
  - **Current Market Overview:** Provide current price and recent performance
  - **Strategy-Specific Analysis:** Apply your expertise based on the strategy above
  - **Key Levels & Patterns:** Identify important price levels and patterns
  - **Market Conditions:** Discuss current market environment
  - **Risk Assessment:** Evaluate potential risks and opportunities
  - **Future Outlook:** Describe potential scenarios based on your analysis
  - **Disclaimer:** End with: "This is not financial advice and is for educational purposes only. Analysis is based on information available on the public web."
  
  For the data table, try to find recent price data. Look for:
  - Current price information (this is CRITICAL - always include current price)
  - Recent daily/weekly price movements
  - Volume data if available
  - Any structured price data from financial websites
  - Price charts or tables from financial sites
  - Recent trading data from exchanges
  - TradingView data, CoinMarketCap data, or exchange data
  
  CRITICAL: Always try to find and include the current price in your analysis text. Use phrases like:
  - "SOL is currently trading at $XXX"
  - "The current price is $XXX"
  - "SOL/USD is at $XXX"
  - "Trading at $XXX"
  
  This will help generate chart data even when structured data isn't available.
  
  IMPORTANT: If you find ANY price information (even just a current price), try to provide at least a few data points. Even if you can only find the current price, include it in the chartData array.
  
  If you cannot find structured historical data, that's okay - just provide an empty array and focus on a comprehensive analysis with current price information.
  
  EXAMPLE RESPONSE (return exactly this format):
  {"analysis":"## Current Market Overview\\n\\nSOL/USD is currently trading at approximately $150.25, showing strong bullish momentum over the past week.\\n\\n## Strategy-Specific Analysis\\n\\nBased on your selected strategy...","chartData":[]}
  
  RESPONSE FORMAT REQUIREMENTS:
  - Start with { and end with }
  - "analysis" field must be a string with your analysis
  - "chartData" field must be an array (empty [] if no data found)
  - Use double quotes for all strings
  - Escape any quotes in the analysis text with \\"
  - No other text outside the JSON object
  
  REMEMBER: Your entire response must be valid JSON that can be parsed by JSON.parse()`;

  let lastError: Error | null = null;
  let attempts = 0;
  const maxAttempts = usedMultiApi ? 3 : 1;

  while (attempts < maxAttempts) {
    try {
      const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            tools: [{googleSearch: {}}],
            systemInstruction: systemInstruction,
          },
      });

      // Record successful API usage
      if (usedMultiApi && apiKey) {
        multiApiService.recordApiUsage(apiKey, true);
      }

    if (response && response.text) {
        console.log("Raw Gemini response:", response.text);
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
        const sources = groundingChunks?.map(chunk => ({
            uri: chunk.web.uri,
            title: chunk.web.title,
        })) || [];
        
        // The model may wrap the JSON in markdown fences. We need to extract it.
        let jsonText = response.text.trim();
        
        // Try multiple patterns to extract JSON
        const patterns = [
            /```json\s*([\s\S]*?)\s*```/,  // ```json ... ```
            /```\s*([\s\S]*?)\s*```/,      // ``` ... ```
            /`([^`]+)`/,                    // `...`
            /^([\s\S]*)$/                   // entire text
        ];
        
        let foundValidJson = false;
        for (const pattern of patterns) {
            const match = jsonText.match(pattern);
            if (match && match[1]) {
                const candidate = match[1].trim();
                // Try to parse as JSON
                try {
                    const parsed = JSON.parse(candidate);
                    if (parsed && typeof parsed === 'object') {
                        jsonText = candidate;
                        foundValidJson = true;
                        console.log("Successfully extracted JSON using pattern:", pattern);
                        break;
                    }
                } catch (e) {
                    // Continue to next pattern
                    continue;
                }
            }
        }
        
        // If no pattern worked, try to find JSON-like content in the text
        if (!foundValidJson) {
            console.log("No pattern matched, trying to find JSON-like content");
            // Look for content that starts with { and ends with }
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonText = jsonMatch[0];
                console.log("Found JSON-like content:", jsonText);
            }
        }

        let parsedJson;
        try {
            parsedJson = JSON.parse(jsonText);
        } catch (parseError) {
            console.error("Failed to parse JSON response:");
            console.error("Raw response text:", response.text);
            console.error("Extracted JSON text:", jsonText);
            console.error("Parse error:", parseError);
            
            // Try to clean up common JSON issues and parse again
            try {
                const cleanedJson = cleanJsonString(jsonText);
                console.log("Trying to parse cleaned JSON:", cleanedJson);
                parsedJson = JSON.parse(cleanedJson);
                console.log("Successfully parsed cleaned JSON");
            } catch (secondError) {
                console.error("Failed to parse even after cleaning:", secondError);
                
                // Try to provide a fallback response with the raw text as analysis
                console.log("Attempting to create fallback response from raw text");
                return {
                    analysis: `## Analysis\n\n${response.text}\n\n*Note: This response was not in the expected JSON format, but here is the raw analysis from the AI.*`,
                    chartData: [],
                    sources: sources
                };
            }
        }

        // Validate the structure of the parsed JSON to prevent rendering errors
        if (!parsedJson || typeof parsedJson !== 'object') {
            console.error("Invalid JSON structure:", parsedJson);
            throw new Error("The AI returned invalid data structure. Please try your query again.");
        }

        // Check for required fields with more flexible validation
        if (typeof parsedJson.analysis !== 'string') {
            console.error("Missing or invalid 'analysis' field:", parsedJson);
            // Try to provide a fallback analysis
            parsedJson.analysis = "Analysis could not be generated. Please try your query again.";
        }

        if (!Array.isArray(parsedJson.chartData)) {
            console.error("Missing or invalid 'chartData' field:", parsedJson);
            // Provide empty chart data as fallback
            parsedJson.chartData = [];
        }
        
        // Check if this is a TradingView request and extract data accordingly
        if (isTradingViewUrl(prompt)) {
            console.log("TradingView URL detected, extracting TradingView data");
            try {
                const tradingViewData = await handleTradingViewData(prompt);
                if (tradingViewData.length > 0) {
                    parsedJson.chartData = tradingViewData;
                    console.log("Successfully extracted TradingView data:", tradingViewData.length, "items");
                }
            } catch (error) {
                console.error("Failed to extract TradingView data:", error);
            }
        }

        // Ensure we always have chart data - if empty, generate fallback
        if (parsedJson.chartData.length === 0) {
            console.log("Chart data is empty, generating fallback data");
            const fallbackData = generateHistoricalData(150, '1M');
            console.log("Generated fallback data:", fallbackData.length, "items");
            parsedJson.chartData = fallbackData;
        }

        // Always try to extract price data from analysis, even if chartData is provided
        if (parsedJson.analysis) {
            const extractedData = extractPriceDataFromAnalysis(parsedJson.analysis);
            if (extractedData.length > 0) {
                            // If no chart data was provided, use extracted data
            if (parsedJson.chartData.length === 0) {
                parsedJson.chartData = extractedData;
                console.log("Extracted price data from analysis:", extractedData);
            } else {
                // If chart data was provided, log that we also found price info
                console.log("Found price info in analysis, but using provided chart data");
            }
        } else {
            // If no price data could be extracted, generate fallback data
            console.log("No price data extracted, generating fallback data");
            parsedJson.chartData = generateHistoricalData(199, '1M'); // Default SOL price
        }
        } else {
            // If no analysis text, generate fallback data
            console.log("No analysis text, generating fallback data");
            parsedJson.chartData = generateHistoricalData(199, '1M');
        }

        console.log("Final return data:", {
            analysisLength: parsedJson.analysis?.length,
            chartDataLength: parsedJson.chartData?.length,
            sourcesLength: sources?.length
        });

        return {
            analysis: parsedJson.analysis,
            chartData: parsedJson.chartData,
            sources: sources
        };
    } else {
        throw new Error("Received an empty or invalid response from the Gemini API.");
    }

    } catch (error) {
      attempts++;
      lastError = error as Error;
      
      console.error(`API attempt ${attempts} failed:`, error);
      
      // Record failed API usage
      if (usedMultiApi && apiKey) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        multiApiService.recordApiUsage(apiKey, false, errorMessage);
      }

      // Check if this is a rate limit error and we have more attempts
      if (usedMultiApi && attempts < maxAttempts) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('rate limit') || 
            errorMessage.includes('quota') || 
            errorMessage.includes('429') ||
            errorMessage.includes('RESOURCE_EXHAUSTED')) {
          
          console.log(`Rate limit hit, trying next API key...`);
          
          // Get next API key
          const nextApiKey = multiApiService.getNextApiKey();
          if (nextApiKey && nextApiKey !== apiKey) {
            apiKey = nextApiKey;
            const newAi = new GoogleGenAI({ apiKey });
            // Update the ai instance for next attempt
            Object.assign(ai, newAi);
            continue;
          } else {
            // All keys are rate limited, wait a bit
            console.log('All API keys rate limited, waiting 30 seconds...');
            await new Promise(resolve => setTimeout(resolve, 30000));
            continue;
          }
        }
      }
      
      // If not a rate limit error or no more attempts, break
      break;
    }
  }

  // If we get here, all attempts failed
  if (lastError) {
    console.error("All API attempts failed:", lastError);
    
    if (lastError instanceof Error) {
      if (lastError.message.includes('API key not valid')) {
        throw new Error("The Gemini API Key is not valid.");
      }
      
      // Check for JSON parsing errors which can happen if the model fails to adhere to the schema
      if (lastError instanceof SyntaxError) {
        throw new Error("The AI returned data in an unexpected format. Please try your query again.");
      }
      
      // If it's our custom error, re-throw it
      if (lastError.message.includes("couldn't be parsed as JSON") || 
          lastError.message.includes("invalid data structure")) {
        throw lastError;
      }
    }
    
    // For any other errors, provide a more helpful message
    throw new Error("An error occurred while processing your request. Please try again.");
  }

  throw new Error("Unexpected error: No attempts were made.");
}