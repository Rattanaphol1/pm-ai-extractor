'use server';

import OpenAI from 'openai';
import { IPMData } from './types';

// ใช้ API Key จาก Groq Cloud
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function extractDataFromAI(payload: string, mode: 'text' | 'image'): Promise<IPMData[]> {
  try {
    if (mode === 'text') {
      // --- สำหรับไฟล์ CSV / Excel ใช้ Llama 3.3 70B (ตัวท็อปด้านข้อความ) ---
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", //
        messages: [
          {
            role: "system",
            content: `You are a strict data extraction expert for Preventive Maintenance. 
      Analyze the CSV and return a JSON Array.

      STRICT RULES:
      1. ONLY extract data that explicitly exists in the current row.
      2. If 'maintenanceDescription' is empty or blank in the CSV, return it as exactly "" (empty string). 
      3. DO NOT grab text from other columns or rows to fill empty fields.
      4. Required fields: machineCode, machineName, maintenanceDescription, frequency.`
          },
          { role: "user", content: payload }
        ],
        response_format: { type: "json_object" },
        temperature: 0, // ปรับเป็น 0 เพื่อลดความคิดสร้างสรรค์ของ AI และเน้นความแม่นยำ
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      const items = Array.isArray(result) ? result : (Object.values(result)[0] as any[]);

      return items.map((item: any, idx: number) => ({
        id: `groq-text-${Date.now()}-${idx}`,
        machineCode: String(item.machineCode || "").trim(),
        machineName: String(item.machineName || "").trim(),
        frequency: String(item.frequency || "").trim(),
        maintenanceDescription: String(item.maintenanceDescription || "").trim()
      }));

    } else {
      // --- สำหรับรูปภาพ ใช้ Llama 3.2 90B Vision (ตัวปัจจุบันที่อ่านรูปเก่งที่สุดของ Groq) ---
      // ใน actions.ts ส่วนของ mode === 'image'
      const completion = await groq.chat.completions.create({
        model: "meta-llama/llama-4-maverick-17b-128e-instruct", //
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a professional data extractor. 
          1. Extract EVERY row from this table image precisely IN THE ORIGINAL ORDER (from Top to Bottom).
          2. Follow the sequence of the 'Item' column strictly.
          3. ROW SPLITTING: If MUAH-0001 has multiple maintenance tasks (e.g., Cleaning and Grease up), keep them adjacent and in the order they appear in the cell.
          4. Return a JSON Array named 'data' containing: machineCode, machineName, maintenanceDescription, frequency.`
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${payload}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0, //
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      // ตรวจสอบว่า AI ส่งกลับมาเป็น Object ที่หุ้ม Array หรือเป็น Array โดยตรง
      const items = Array.isArray(result) ? result : (result.data || result.items || Object.values(result)[0] || []);

      return items.map((item: any, idx: number) => ({
        id: `groq-vision-${Date.now()}-${idx}`,
        machineCode: String(item.machineCode || "").trim(),
        machineName: String(item.machineName || "").trim(),
        frequency: String(item.frequency || "").trim(),
        maintenanceDescription: String(item.maintenanceDescription || "").trim()
      }));
    }
  } catch (error: any) {
    console.error("Groq Engine Error:", error);
    throw new Error(`ระบบ Groq ขัดข้อง: ${error.message}`);
  }
}
