'use server';

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { IPMData } from './types';

// แนะนำให้ใช้ ENV Variable: process.env.GEMINI_API_KEY
const API_KEY = "AIzaSyC-7-eueFXqW0fxsNVXrxOP0FxoyB2BZzo";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function extractDataFromText(csvContent: string): Promise<IPMData[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      Extract PM (Preventive Maintenance) data from this CSV.
      Rules:
      1. Field mapping: machineCode, machineName, maintenanceDescription, frequency
      2. Keep Thai names for machineName (DO NOT TRANSLATE).
      3. Fill empty machineCode/Name from the row above.
      4. Standardize Frequency: '1 M'->'Monthly', '2 W'->'Bi-Weekly', '3 M'->'Quarterly', '6 M'->'Semi-Annually', '1 Y'->'Annually'.
      
      CSV Data:
      ${csvContent}

      Return JSON array of objects.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // ปรับโครงสร้างข้อมูลให้ตรงกับ Interface
    return parsed.map((item: any, idx: number) => ({
      id: `pm-${Date.now()}-${idx}`,
      machineCode: String(item.machineCode || "").trim(),
      machineName: String(item.machineName || "").trim(),
      frequency: item.frequency || "Unknown",
      maintenanceDescription: String(item.maintenanceDescription || "").trim()
    }));

  } catch (error: any) {
    console.error("🔥 AI Error:", error);
    throw new Error(`AI Processing Failed: ${error.message}`);
  }
}