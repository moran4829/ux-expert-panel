
import { GoogleGenAI, Type } from "@google/genai";
import { UXMethodologyResult, CustomPersona, PersonaQuestion } from "../types";
import { GENERATE_SYSTEM_PROMPT } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;
  private model = 'gemini-3.1-pro-preview';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generatePersonaQuestions(role: string): Promise<PersonaQuestion[]> {
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: `
        The user wants to define a UX persona for the role: "${role}".
        Generate 3 short, closed-ended multiple-choice questions (in Hebrew) to help refine this persona's characteristics, technical literacy, and motivation.
        Each question should have 3-4 distinct options.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["id", "question", "options"]
          }
        }
      }
    });

    if (!response.text) throw new Error("Failed to generate questions");
    return JSON.parse(response.text.trim());
  }

  async generatePersonaDescription(role: string, qa: { question: string, answer: string[] }[]): Promise<string> {
    const qaString = qa.map(item => `Q: ${item.question}\nA: ${item.answer.join(', ')}`).join('\n');
    
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: `
        Based on the role "${role}" and the following answers, write a concise but detailed persona description (in Hebrew).
        Focus on their behavior, pain points, and technical proficiency.
        
        ${qaString}
        
        Return only the description text string.
      `,
      config: {
        responseMimeType: "text/plain"
      }
    });

    if (!response.text) throw new Error("Failed to generate description");
    return response.text.trim();
  }

  async analyzeFlow(images: string[], persona: CustomPersona, tasks: string[]): Promise<UXMethodologyResult> {
    const parts = images.map(img => ({
      inlineData: {
        mimeType: 'image/png',
        data: img.split(',')[1] 
      }
    }));

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: {
        parts: [
          { text: GENERATE_SYSTEM_PROMPT(persona, tasks) },
          ...parts
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            // Step 1
            contextGoal: { type: Type.STRING, description: "Primary goal of the screen/flow" },
            userCommitmentLevel: { type: Type.STRING, description: "Emotional commitment level" },
            
            // Step 2
            firstElementSeen: { type: Type.STRING, description: "First visual element noticed" },
            secondElementSeen: { type: Type.STRING, description: "Second visual element noticed" },
            hierarchyMatch: { type: Type.BOOLEAN, description: "Does visual hierarchy match business goals?" },
            hierarchyAnalysis: { type: Type.STRING, description: "Detailed hierarchy analysis" },
            
            // Step 3
            cognitiveLoadAnalysis: { type: Type.STRING, description: "Analysis of information/decision load" },
            
            // Step 4
            emotionalAnalysis: { type: Type.STRING, description: "Emotional friction, stress, or calmness" },
            
            // Step 5
            frictionPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of behavioral friction points" },
            estimatedDropOffRate: { type: Type.STRING, description: "Estimated abandonment percentage or level" },
            
            // Step 6
            trustAnalysis: { type: Type.STRING, description: "Trust signals and risk analysis" },
            
            // Step 7
            kpiToMeasure: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Suggested KPIs or events to track" },
            dropOffHypothesis: { type: Type.STRING, description: "Hypothesis on where drop-off happens" },
            
            // Step 8
            solutions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  component: { type: Type.STRING },
                  problem: { type: Type.STRING },
                  whyItsAProblem: { type: Type.STRING },
                  abandonmentRisk: { type: Type.STRING },
                  solution: { type: Type.STRING }
                },
                required: ["component", "problem", "whyItsAProblem", "abandonmentRisk", "solution"]
              }
            },
            
            // Step 9
            prioritization: {
              type: Type.OBJECT,
              properties: {
                quickWins: { type: Type.ARRAY, items: { type: Type.STRING } },
                mediumImpact: { type: Type.ARRAY, items: { type: Type.STRING } },
                structuralRedesign: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["quickWins", "mediumImpact", "structuralRedesign"]
            }
          },
          required: [
            "contextGoal", "userCommitmentLevel", 
            "firstElementSeen", "secondElementSeen", "hierarchyMatch", "hierarchyAnalysis",
            "cognitiveLoadAnalysis", "emotionalAnalysis", 
            "frictionPoints", "estimatedDropOffRate",
            "trustAnalysis",
            "kpiToMeasure", "dropOffHypothesis",
            "solutions", "prioritization"
          ]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    try {
      return JSON.parse(response.text.trim()) as UXMethodologyResult;
    } catch (e) {
      console.error("Failed to parse JSON", response.text);
      throw new Error("Invalid response format from AI");
    }
  }
}

export const geminiService = new GeminiService();
