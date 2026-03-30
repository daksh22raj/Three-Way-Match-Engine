import { GoogleGenAI } from '@google/genai';

export async function parseDocumentWithGemini(fileBuffer, mimetype, documentType) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("GEMINI_API_KEY missing");

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  // Convert buffer to base64 for inline file upload
  const base64Data = fileBuffer.toString('base64');

  const prompt = `You are a data extraction assistant. Extract structured data from the attached document.
It is of type: ${documentType}.
Return ONLY valid JSON. No markdown, no code fences, no explanation.

Schema to use:
- If PO:      { "poNumber": "", "poDate": "YYYY-MM-DD", "vendorName": "", "items": [ { "itemCode": "", "sku": "", "description": "", "quantity": 0 } ] }
- If GRN:     { "grnNumber": "", "poNumber": "", "grnDate": "YYYY-MM-DD", "items": [ { "itemCode": "", "sku": "", "description": "", "receivedQuantity": 0 } ] }
- If Invoice: { "invoiceNumber": "", "poNumber": "", "invoiceDate": "YYYY-MM-DD", "items": [ { "itemCode": "", "sku": "", "description": "", "quantity": 0 } ] }`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimetype,
              data: base64Data
            }
          }
        ]
      }
    ]
  });

  const responseText = response.text;

  // Strip any accidental markdown code fences
  const cleaned = responseText.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini raw response:", responseText);
    throw new Error("Failed to parse Gemini output: " + responseText.substring(0, 300));
  }
}
