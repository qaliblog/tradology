import { GoogleGenAI } from "@google/genai";
import type { ChartDataPoint, Timeframe, TradingScenario } from '../types';

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
    scenarios?: TradingScenario[];
}

export async function getTradingAnalysis(prompt: string, timeframe: Timeframe = 'Daily'): Promise<AnalysisResponse> {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";
  
  const timeframeContext = timeframe === 'Daily' 
    ? 'short-term (1-5 days)' 
    : timeframe === 'Weekly' 
    ? 'medium-term (1-4 weeks)' 
    : 'long-term (1-3 months)';

  const systemInstruction = `You are an expert financial analyst. Your name is 'Gemini Analyst'.

  You MUST use the Google Search tool to find the most current information to answer the user's request.
  
  The user is analyzing data on a ${timeframe} timeframe, which corresponds to ${timeframeContext} trading scenarios.
  
  Your task is to provide three things in a single, raw JSON response:
  1.  A textual technical analysis.
  2.  A table of recent historical price data.
  3.  Multiple trading scenarios (at least 3-4) that reflect the ${timeframe} timeframe perspective.
  
  For the analysis, focus on technical concepts. Structure it with Markdown:
  - **Overall Trend Analysis:** Identify the primary trend for the ${timeframe} timeframe.
  - **Key Support & Resistance Levels:** Pinpoint significant price levels relevant to ${timeframeContext} trading.
  - **Technical Indicators Analysis:** Analyze indicators discussed in articles, considering ${timeframe} perspective.
  - **Potential Future Scenarios:** Describe bullish and bearish scenarios for ${timeframeContext} trading.
  - **Disclaimer:** End with: "This is not financial advice and is for educational purposes only. Analysis is based on information available on the public web."
  
  For the data table, find the daily open, high, low, close, and volume data for the last 60 trading days for the requested asset.
  
  For the trading scenarios, provide at least 3-4 distinct scenarios that reflect ${timeframeContext} trading perspectives. Each scenario should include:
  - A descriptive name (e.g., "Bullish Breakout", "Bearish Reversal", "Sideways Consolidation", "Volatility Expansion")
  - Probability assessment (e.g., "High", "Medium", "Low")
  - Detailed description of the scenario
  - Key price levels to watch (support/resistance)
  - The timeframe context (${timeframe})
  
  You MUST format your entire response as a single, raw JSON object. Do not wrap it in markdown fences. The JSON object must have three keys: "analysis" (a string), "chartData" (an array of objects), and "scenarios" (an array of scenario objects).
  
  The structure MUST be:
  {
    "analysis": "Your Markdown-formatted analysis text here...",
    "chartData": [
      {
        "date": "YYYY-MM-DD",
        "open": 123.45,
        "high": 125.67,
        "low": 122.34,
        "close": 124.56,
        "volume": "1.2M"
      }
    ],
    "scenarios": [
      {
        "name": "Scenario Name",
        "probability": "High/Medium/Low",
        "description": "Detailed description of what this scenario entails for ${timeframeContext} trading...",
        "keyLevels": ["Support: $X", "Resistance: $Y"],
        "timeframe": "${timeframe}"
      }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
          systemInstruction: systemInstruction,
        },
    });

    if (response && response.text) {
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
        const sources = groundingChunks?.map(chunk => ({
            uri: chunk.web.uri,
            title: chunk.web.title,
        })) || [];
        
        // The model may wrap the JSON in markdown fences. We need to extract it.
        let jsonText = response.text.trim();
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = jsonText.match(jsonRegex);
        if (match && match[1]) {
            jsonText = match[1];
        }

        const parsedJson = JSON.parse(jsonText);

        // Validate the structure of the parsed JSON to prevent rendering errors
        if (typeof parsedJson.analysis !== 'string' || !Array.isArray(parsedJson.chartData)) {
            console.error("Malformed AI response:", parsedJson);
            throw new Error("The AI returned data in an unexpected format. 'analysis' must be a string and 'chartData' must be an array.");
        }

        // Validate scenarios if present
        let scenarios: TradingScenario[] | undefined;
        if (parsedJson.scenarios && Array.isArray(parsedJson.scenarios)) {
            scenarios = parsedJson.scenarios.map((s: any) => ({
                name: s.name || 'Unnamed Scenario',
                probability: s.probability || 'Unknown',
                description: s.description || '',
                keyLevels: Array.isArray(s.keyLevels) ? s.keyLevels : [],
                timeframe: s.timeframe || timeframe
            }));
        }

        return {
            analysis: parsedJson.analysis,
            chartData: parsedJson.chartData,
            sources: sources,
            scenarios: scenarios
        };
    } else {
        throw new Error("Received an empty or invalid response from the Gemini API.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
       throw new Error("The Gemini API Key is not valid.");
    }
    // Check for JSON parsing errors which can happen if the model fails to adhere to the schema
    if (error instanceof SyntaxError) {
        throw new Error("The AI returned data in an unexpected format. Please try your query again.");
    }
    throw error; // Re-throw other errors to be handled by the App component
  }
}