import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface LocationResult {
  latitude: number;
  longitude: number;
  locationName: string;
}

/**
 * Uses Gemini to interpret a natural language location description 
 * and return estimated coordinates, focusing on Dubai/UAE context.
 */
export const getCoordinatesFromText = async (text: string): Promise<LocationResult | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a tactical location assistant. Identify the estimated latitude and longitude for the following location description. 
      Context: The user is likely in Dubai, UAE.
      Description: "${text}"
      
      If the location is vague, provide the best estimate for the center of that landmark or area.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            latitude: { type: Type.NUMBER, description: "Latitude of the location" },
            longitude: { type: Type.NUMBER, description: "Longitude of the location" },
            locationName: { type: Type.STRING, description: "A short, formal name of the identified location" },
          },
          required: ["latitude", "longitude", "locationName"],
        },
      },
    });

    if (response.text) {
        return JSON.parse(response.text) as LocationResult;
    }
    return null;
  } catch (error) {
    console.error("Gemini Location Service Error:", error);
    return null;
  }
};
