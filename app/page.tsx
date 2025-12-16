'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { extractDataFromText } from './actions';
import { IPMData } from './types';
import { Loader2, Upload, AlertCircle } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<IPMData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    setData([]);

    Papa.parse(file, {
      complete: async (results) => {
        try {
          // --- 💡 ส่วนที่ปรับปรุง: Data Trimming ---
          // ไฟล์ PM ของคุณมีคอลัมน์วันที่เยอะมาก เราจะเอาแค่ 5 คอลัมน์แรก 
          // (แผนก, รหัส, ชื่อเครื่องจักร, ระยะเวลา, หน่วย)
          const rawRows = results.data as any[];
          
          const trimmedRows = rawRows
            .filter(row => row.length > 1) // กรองแถวว่างออก
            .map(row => row.slice(0, 5));  // ตัดเอาแค่ 5 คอลัมน์แรกเท่านั้น

          // แปลงกลับเป็น CSV String (ข้อมูลจะเล็กลงมหาศาล)
          const csvString = Papa.unparse(trimmedRows);
          
          console.log(`📊 ข้อมูลถูกตัดลดขนาดเหลือ: ${csvString.length} ตัวอักษร`);

          // 2. เรียก Server Action
          const aiResult = await extractDataFromText(csvString);
          setData(aiResult);
          
        } catch (err: any) {
          console.error(err);
          setErrorMsg('AI โควตาเต็มหรือประมวลผลไม่สำเร็จ กรุณารอ 10 วินาทีแล้วลองใหม่อีกครั้ง');
        } finally {
          setLoading(false);
        }
      },
      header: false,
      skipEmptyLines: true
    });
  };

  return (
    <main className="min-h-screen p-10 bg-gray-50 text-slate-900">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          🤖 AI Maintenance Extractor
        </h1>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center mb-8 hover:border-blue-400 transition-colors">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload} 
            className="hidden" 
            id="fileUpload"
          />
          <label 
            htmlFor="fileUpload" 
            className="cursor-pointer flex flex-col items-center gap-2 text-gray-600 hover:text-blue-600 transition"
          >
            <Upload size={40} />
            <span className="font-medium text-lg">อัปโหลดไฟล์ CSV เพื่อให้ AI วิเคราะห์</span>
            <p className="text-sm text-gray-400">ระบบจะตัดข้อมูลคอลัมน์ส่วนเกินให้อัตโนมัติเพื่อความรวดเร็ว</p>
          </label>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-100">
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-10 gap-4">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">AI กำลังอ่านไฟล์ของคุณ...</p>
              <p className="text-sm text-gray-500 italic">ขั้นตอนนี้ใช้เวลาประมาณ 5-15 วินาที</p>
            </div>
          </div>
        )}

        {data.length > 0 && !loading && (
          <div className="fade-in">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-semibold text-blue-900">
                ✅ พบข้อมูลเครื่องจักร {data.length} รายการ
              </h2>
            </div>
            
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full border-collapse bg-white">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="p-3 text-left font-semibold text-slate-700">รหัสเครื่องจักร</th>
                    <th className="p-3 text-left font-semibold text-slate-700">ชื่อเครื่องจักร</th>
                    <th className="p-3 text-left font-semibold text-slate-700">ความถี่ (AI ตีความ)</th>
                    <th className="p-3 text-left font-semibold text-slate-400">ค่าเดิมจากไฟล์</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50 transition-colors">
                      <td className="p-3">
                        <input 
                          defaultValue={row.machineCode} 
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{row.machineName}</td>
                      <td className="p-3">
                        <select 
                          defaultValue={row.frequency}
                          className="p-2 border rounded w-full bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Monthly">Monthly (รายเดือน)</option>
                          <option value="Quarterly">Quarterly (รายไตรมาส)</option>
                          <option value="Annually">Annually (รายปี)</option>
                          <option value="Unknown">Unknown (ไม่ระบุ)</option>
                        </select>
                      </td>
                      <td className="p-3 text-gray-400 text-sm italic">{row.rawFrequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button 
              onClick={() => alert('บันทึกข้อมูลสำเร็จ (จำลอง)')}
              className="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg active:transform active:scale-95 transition"
            >
              บันทึกข้อมูลเข้าระบบ PM
            </button>
          </div>
        )}
      </div>
    </main>
  );
}