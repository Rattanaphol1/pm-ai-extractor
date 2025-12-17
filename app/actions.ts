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
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Extract PM data from CSV and return ONLY a JSON Array with fields: machineCode, machineName, maintenanceDescription, frequency. Use raw frequency values."
          },
          { role: "user", content: payload }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
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
        model: "meta-llama/llama-4-maverick-17b-128e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a data extraction expert. 
          1. Extract EVERY SINGLE ROW found in the image table. Do not skip any items.
          2. Capture both THAI and ENGLISH text exactly as shown (e.g., "Filling 1 (1 Kg.) เครื่องบรรจุนมกระป๋อง 1").
          3. Return the result as a JSON Array named 'data'.
          Fields: machineCode, machineName, maintenanceDescription, frequency.`
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${payload}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0, // ปรับเป็น 0 เพื่อให้ AI มีความแม่นยำสูงสุด ไม่เดาข้อมูล
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
