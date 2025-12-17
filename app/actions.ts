'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { IPMData } from './types';

// แนะนำ: เปลี่ยน API KEY ใหม่เนื่องจากตัวนี้ถูกโพสต์ในที่สาธารณะแล้วครับ
const API_KEY = "AIzaSyC11FJSN9NR7QbvQ84iNwHzjJg2BEnh8J0";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function extractDataFromText(csvContent: string): Promise<IPMData[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite'
    });

    const prompt = `
      คุณคือผู้เชี่ยวชาญด้าน PM (Preventive Maintenance) 
      จงดึงข้อมูลจาก CSV นี้ออกมาเป็น JSON Array ตามเงื่อนไขดังนี้:

      1. **การดึงข้อมูล (Inheritance):** - หากแถวใดไม่มี "Machine name" หรือ "Machine no." ให้ใช้ค่าจากแถวบนสุดที่มีข้อมูลนั้น (เพราะเป็นงานย่อยของเครื่องจักรเดิม)
      
      2. **การแปลงความถี่ (Frequency Mapping):**
         - '1 M' -> 'Monthly'
         - '2 W' -> 'Bi-Weekly'
         - '2 M' -> 'Every 2 Months'
         - '3 M' -> 'Quarterly'
         - '6 M' -> 'Semi-Annually'
         - '1 Y' -> 'Annually'
         - '3 weeks' -> 'Weekly'
         - อื่นๆ -> 'Unknown'

      3. **คอลัมน์ที่เกี่ยวข้อง:**
         - machineCode: จาก "Machine no."
         - machineName: จาก "Machine name / System"
         - rawFrequency: ค่าดั้งเดิมจากคอลัมน์ "Frequency"

      **ข้อห้าม:** ไม่ต้องส่งฟิลด์ "id" กลับมา

      ข้อมูล CSV:
      ${csvContent}

      ตอบกลับเฉพาะ JSON Array ของ Object เหล่านี้เท่านั้น (ห้ามมี Markdown block):
      [
        { "machineCode": "...", "machineName": "...", "frequency": "...", "rawFrequency": "..." }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanedText);

    // ✅ แก้ไข: สร้าง Unique ID ที่นี่ เพื่อป้องกัน Key ซ้ำใน React
    return data.map((item: any, idx: number) => {
      // สร้าง ID ที่การันตีว่าไม่ซ้ำกันแน่นอน
      const uniqueId = `pm-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        id: uniqueId, 
        machineCode: String(item.machineCode || "").trim(),
        machineName: String(item.machineName || "").trim(),
        frequency: item.frequency || "Unknown",
        rawFrequency: String(item.rawFrequency || "").trim()
      };
    });

  } catch (error: any) {
    console.error("🔥 Error Details:", error);
    throw new Error(`AI Processing Failed: ${error.message}`);
  }
}