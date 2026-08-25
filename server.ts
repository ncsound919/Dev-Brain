import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, stream, taskType } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const responseStream = await ai.models.generateContentStream({
          model: "gemini-3.7-flash",
          contents: prompt,
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
             res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();
      } else {
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
        });
        res.json({ text: response.text });
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during generation." });
    }
  });

  app.post("/api/gemini/weigh", async (req, res) => {
    try {
      const { topic, context, candidateOptions } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are an elite tactical decision engine. Analyze the following decision topic and context:
TOPIC: ${topic}
CONTEXT: ${context}
${candidateOptions && candidateOptions.length > 0 ? `PRE-SPECIFIED CANDIDATE OPTIONS TO EVALUATE:\n${candidateOptions.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}` : ''}

TASK:
1. Provide 2 to 4 distinct decision options.
2. Assign an exact percentage weight (0-100%) to each option reflecting its probabilistic superiority and strategic leverage. The sum of all percentage weights across all options MUST EQUAL EXACTLY 100%.
3. For EACH option, provide 3 to 4 detailed, bulleted PROS (advantages, upside, moat) and 3 to 4 detailed CONS (risks, costs, downsides, failure modes).
4. Provide a mitigation strategy for the cons, risk level (LOW, MEDIUM, HIGH, CRITICAL), expected ROI, and numeric scores (0-100) for feasibility, upsidePotential, safetyFloor, executionSpeed, capitalEfficiency.
5. Return the JSON response matching the provided schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a deterministic JSON-only decision matrix generator. You only output raw JSON conforming exactly to the requested schema.",
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decisionTopic: { type: Type.STRING },
              synthesisRationale: { type: Type.STRING },
              tradeOffSummary: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    weightPercentage: { type: Type.NUMBER },
                    confidenceScore: { type: Type.NUMBER },
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                    riskLevel: { type: Type.STRING },
                    expectedROI: { type: Type.STRING },
                    timeToValue: { type: Type.STRING },
                    recommended: { type: Type.BOOLEAN },
                    verdictTag: { type: Type.STRING },
                    mitigationStrategy: { type: Type.STRING },
                    supportingLeaders: { type: Type.ARRAY, items: { type: Type.STRING } },
                    scores: {
                      type: Type.OBJECT,
                      properties: {
                        feasibility: { type: Type.NUMBER },
                        upsidePotential: { type: Type.NUMBER },
                        safetyFloor: { type: Type.NUMBER },
                        executionSpeed: { type: Type.NUMBER },
                        capitalEfficiency: { type: Type.NUMBER }
                      },
                      required: ["feasibility", "upsidePotential", "safetyFloor", "executionSpeed", "capitalEfficiency"]
                    }
                  },
                  required: ["id", "title", "description", "weightPercentage", "confidenceScore", "pros", "cons", "riskLevel", "expectedROI", "timeToValue", "recommended", "verdictTag", "mitigationStrategy", "supportingLeaders", "scores"]
                }
              }
            },
            required: ["decisionTopic", "synthesisRationale", "tradeOffSummary", "options"]
          }
        }
      });

      const text = response.text;
      if (!text) {
         throw new Error("No text response from Gemini");
      }

      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred while generating the decision matrix." });
    }
  });

  app.post("/api/gemini/opponent", async (req, res) => {
    try {
      const { sector } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY missing" });

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const prompt = `You are a strategic sports and business simulation engine. 
Generate an Opponent Digital Twin for the following sector/context: ${sector}

Output exactly JSON matching this schema:
{
  "id": "string",
  "name": "string",
  "type": "DEFENSIVE_SCHEME" or "MARKET_COMPETITOR",
  "aggressiveness": number (0 to 1),
  "adaptability": number (0 to 1),
  "historicalTendencies": [
    { "trigger": "string", "response": "string", "probability": number (0 to 1) }
  ]
}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              aggressiveness: { type: Type.NUMBER },
              adaptability: { type: Type.NUMBER },
              historicalTendencies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    trigger: { type: Type.STRING },
                    response: { type: Type.STRING },
                    probability: { type: Type.NUMBER }
                  },
                  required: ["trigger", "response", "probability"]
                }
              }
            },
            required: ["id", "name", "type", "aggressiveness", "adaptability", "historicalTendencies"]
          }
        }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/opponent/simulate", async (req, res) => {
    try {
      const { move, twin } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY missing" });

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const prompt = `Simulate a scrimmage.
Our Move: ${move}
Opponent Twin: ${JSON.stringify(twin)}

Generate 2-3 likely counter-moves the opponent will make.
Return JSON array of objects: [{ "moveName": "string", "probability": number (0 to 1), "impactOnOurSuccess": number (-1 to 1), "description": "string" }]`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                moveName: { type: Type.STRING },
                probability: { type: Type.NUMBER },
                impactOnOurSuccess: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["moveName", "probability", "impactOnOurSuccess", "description"]
            }
          }
        }
      });
      res.json(JSON.parse(response.text || "[]"));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/genome/mutate", async (req, res) => {
    try {
      const { baseStrategyName, generations } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY missing" });

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const prompt = `Run a multi-agent evolutionary simulation for strategy: "${baseStrategyName}" over ${generations} generations.
Start with base speed/risk/capital/innovation at 50. Mutate incrementally. 
Return JSON array of generation objects, each containing:
id (string), generation (number), fitnessScore (0-100), traits (speed, risk, capitalEfficiency, innovation - all 0-100), and mutationLog (string describing the change).
Ensure exactly ${generations + 1} objects (Generation 0 up to Generation ${generations}).`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.8,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                generation: { type: Type.NUMBER },
                fitnessScore: { type: Type.NUMBER },
                traits: {
                  type: Type.OBJECT,
                  properties: {
                    speed: { type: Type.NUMBER },
                    risk: { type: Type.NUMBER },
                    capitalEfficiency: { type: Type.NUMBER },
                    innovation: { type: Type.NUMBER }
                  },
                  required: ["speed", "risk", "capitalEfficiency", "innovation"]
                },
                mutationLog: { type: Type.STRING }
              },
              required: ["id", "generation", "fitnessScore", "traits", "mutationLog"]
            }
          }
        }
      });
      res.json(JSON.parse(response.text || "[]"));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/gemini/fatigue", async (req, res) => {
    try {
      const { complexityScore, resourceAllocation, timeHorizonMonths } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY missing" });

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const prompt = `Simulate fatigue drift over ${timeHorizonMonths} months for a system with complexity score ${complexityScore}/100 and resource allocation ${resourceAllocation}/100.
Return a JSON array of objects representing each month. Each object must have:
month (number), cognitiveLoad (0-100), capitalBurn (0-100), structuralIntegrity (0-100).
Ensure exactly ${timeHorizonMonths} objects. Start with structuralIntegrity near 100, and gracefully degrade it as cognitiveLoad and capitalBurn rise.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.NUMBER },
                cognitiveLoad: { type: Type.NUMBER },
                capitalBurn: { type: Type.NUMBER },
                structuralIntegrity: { type: Type.NUMBER }
              },
              required: ["month", "cognitiveLoad", "capitalBurn", "structuralIntegrity"]
            }
          }
        }
      });
      res.json(JSON.parse(response.text || "[]"));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
