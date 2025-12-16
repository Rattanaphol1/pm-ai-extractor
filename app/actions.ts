'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { IPMData } from './types';

// ใช้ API Key โดยตรง (ตรวจสอบให้แน่ใจว่าไม่มีตัวอักษรไทยปนในรหัส Key)
const API_KEY = ""; 
const genAI = new GoogleGenerativeAI(API_KEY);

export async function extractDataFromText(csvContent: string): Promise<IPMData[]> {
  console.log("🚀 Starting Safe Extraction...");

  try {
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-lite',
    });

    // ปรับ Prompt เป็นภาษาอังกฤษเพื่อป้องกันบั๊ก ByteString ใน Header 
    // แต่ข้อมูลข้างใน (csvContent) ยังคงเป็นภาษาไทยได้ AI เข้าใจครับ
    const prompt = `
      Task: Extract machine maintenance data from CSV.
      Instructions: 
      1. Analyze the following CSV data (which is in Thai).
      2. Extract: machineCode, machineName, and frequency.
      3. Logic for frequency: 
         - If found '1 เดือน' or 'M' or 'AB' -> return 'Monthly'
         - If found '3 เดือน' or 'Q' or 'AC' -> return 'Quarterly'
         - If found '1 ปี' or 'Y' -> return 'Annually'
      4. Format: Return ONLY a JSON array.

      CSV Data:
      ${csvContent}
    `;

    console.log("📤 Sending data to Gemini...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // ลบส่วนเกินที่เป็น Markdown ออก (ถ้ามี)
    const cleanedText = text.replace(/```json|```/g, '').trim();
    
    const data = JSON.parse(cleanedText);

    return data.map((item: any, idx: number) => ({
        id: item.id || `row-${idx}`,
        machineCode: String(item.machineCode || ""),
        machineName: String(item.machineName || ""),
        frequency: item.frequency || "Unknown",
        rawFrequency: String(item.rawFrequency || "")
    }));

  } catch (error: any) {
    console.error("🔥 Error Details:", error);
    // ถ้ายังพังเรื่อง ByteString แสดงว่ามีภาษาไทยหลุดไปใน API Header
    throw new Error(`System Error: ${error.message}`);
  }
}