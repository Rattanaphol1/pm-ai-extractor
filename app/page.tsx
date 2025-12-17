'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { extractDataFromText } from './actions';
import { IPMData } from './types';
import { Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

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
          // ตัดข้อมูลเอาเฉพาะ 5 คอลัมน์แรก (Item, Name, No, Desc, Frequency)
          // เพื่อลดขนาด Token และป้องกัน Error 429/503
          const rawRows = results.data as any[];
          const trimmedRows = rawRows
            .filter(row => row.length > 2) // กรองแถวว่าง
            .map(row => row.slice(0, 5)); 

          const csvString = Papa.unparse(trimmedRows);
          
          const aiResult = await extractDataFromText(csvString);
          setData(aiResult);
          
        } catch (err: any) {
          setErrorMsg('AI ไม่สามารถประมวลผลได้ในขณะนี้ กรุณารอ 30 วินาทีแล้วลองใหม่อีกครั้ง');
        } finally {
          setLoading(false);
        }
      },
      header: false,
      skipEmptyLines: true
    });
  };

  return (
    <main className="min-h-screen p-6 bg-slate-50 text-slate-900">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <span className="bg-blue-600 text-white p-2 rounded-lg text-xl">🤖</span>
            AI PM Extractor
          </h1>
          <p className="text-slate-500 mt-2">อัปโหลดไฟล์ตารางซ่อมบำรุงประจำปีเพื่อให้ AI ช่วยดึงข้อมูลและจัดการความถี่ให้โดยอัตโนมัติ</p>
        </header>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl p-12 text-center mb-8 hover:bg-blue-50 transition-all group cursor-pointer relative">
          <input 
            type="file" accept=".csv" 
            onChange={handleFileUpload} 
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
              <Upload className="text-blue-600" size={32} />
            </div>
            <span className="text-lg font-semibold text-slate-700">คลิกหรือลากไฟล์ CSV มาวางที่นี่</span>
            <p className="text-sm text-slate-400">ระบบรองรับไฟล์ PM Machine 2016 และไฟล์ตารางซ่อมบำรุงทั่วไป</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100 animate-shake">
            <AlertCircle size={24} />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-16 gap-5">
            <Loader2 className="animate-spin text-blue-600" size={56} />
            <div className="text-center">
              <p className="text-xl font-bold text-slate-700">AI กำลังวิเคราะห์และเติมข้อมูล...</p>
              <p className="text-slate-400 italic mt-1">กำลังจัดระเบียบข้อมูลเครื่องจักรและความถี่ให้คุณ</p>
            </div>
          </div>
        )}

        {data.length > 0 && !loading && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={24} />
                ผลลัพธ์การดึงข้อมูล ({data.length} รายการ)
              </h2>
            </div>
            
            <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-4 text-left font-semibold">รหัสเครื่องจักร</th>
                    <th className="p-4 text-left font-semibold">ชื่อเครื่องจักร</th>
                    <th className="p-4 text-left font-semibold">ความถี่ (AI แปลงแล้ว)</th>
                    <th className="p-4 text-left font-semibold text-slate-400">ค่าเดิม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-3">
                        <input 
                          defaultValue={row.machineCode} 
                          className="w-full p-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                      </td>
                      <td className="p-3 font-medium text-slate-700">{row.machineName}</td>
                      <td className="p-3">
                        <select 
                          defaultValue={row.frequency}
                          className="p-2 border border-slate-200 rounded-md w-full bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Weekly">Weekly (รายสัปดาห์)</option>
                          <option value="Bi-Weekly">Bi-Weekly (ทุก 2 สัปดาห์)</option>
                          <option value="Monthly">Monthly (รายเดือน)</option>
                          <option value="Every 2 Months">Every 2 Months (ทุก 2 เดือน)</option>
                          <option value="Quarterly">Quarterly (รายไตรมาส)</option>
                          <option value="Semi-Annually">Semi-Annually (ทุก 6 เดือน)</option>
                          <option value="Annually">Annually (รายปี)</option>
                          <option value="Unknown">Unknown (ไม่ระบุ)</option>
                        </select>
                      </td>
                      <td className="p-3 text-slate-400 italic">{row.rawFrequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button 
              onClick={() => alert('บันทึกข้อมูลเข้าฐานข้อมูลสำเร็จ')}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg hover:shadow-blue-200 active:scale-[0.98] transition-all"
            >
              ยืนยันและบันทึกข้อมูลเข้าระบบ
            </button>
          </div>
        )}
      </div>
    </main>
  );
}