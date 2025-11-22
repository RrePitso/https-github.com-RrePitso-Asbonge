import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFoodRecommendation = async (mood: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `I am a hungry customer using the Asbonge Eats app in Johannesburg. 
    My current mood or craving is: "${mood}".
    Suggest 3 generic types of dishes I should look for. Keep it short, appetizing, and under 50 words.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "We recommend checking out our popular burgers or pizzas!";
  } catch (error) {
    console.error("Error getting food recommendation:", error);
    return "Why not try our daily specials? They are delicious!";
  }
};

export const optimizeParcelDescription = async (rawDescription: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `A user wants to send a parcel via Asbonge Eats delivery.
    They described the item as: "${rawDescription}".
    Rewrite this into a professional, concise manifest description (max 20 words) suitable for a courier waybill. 
    Example input: "some shoes in a box" -> Output: "Boxed Footwear (Standard Size)"`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || rawDescription;
  } catch (error) {
    console.error("Error optimizing description:", error);
    return rawDescription;
  }
};
