'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { extractDataFromText } from './actions';
import { IPMData } from './types';
import {
  Loader2, Cpu, Activity, Database, LayoutGrid,
  FileText, Clock, ImageIcon, AlertCircle, CheckCircle2
} from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<IPMData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processData = async (rawRows: any[]) => {
    if (rawRows.length < 2) {
      setErrorMsg("ไม่พบข้อมูลในไฟล์");
      setLoading(false);
      return;
    }

    try {
      // --- Smart Column Filtering ---
      const headers = rawRows[0].map((h: any) => String(h).toLowerCase());
      const targetIndexes = headers.map((h: string, i: number) =>
        (h.includes('code') || h.includes('รหัส') ||
          h.includes('name') || h.includes('ชื่อ') ||
          h.includes('freq') || h.includes('ความถี่') ||
          h.includes('desc') || h.includes('รายการ')) ? i : -1
      ).filter((i: number) => i !== -1);

      // ถ้าหาคอลัมน์ไม่เจอเลย ให้เอา 8 คอลัมน์แรกแทน
      const finalIndexes = targetIndexes.length > 0 ? targetIndexes : [0, 1, 2, 3, 4, 5];

      const optimizedRows = rawRows.map(row => finalIndexes.map(i => row[i]));
      const csvString = Papa.unparse(optimizedRows);

      const aiResult = await extractDataFromText(csvString);
      setData(aiResult);
    } catch (err) {
      setErrorMsg("AI ประมวลผลผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg(null);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (res) => processData(res.data),
        header: false,
        skipEmptyLines: true
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        processData(rawRows as any[]);
      };
      reader.readAsBinaryString(file);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-[1440px] mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
              <Cpu className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                AI-PM <span className="text-blue-600 font-light">Laboratory</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Autonomous Data Processor</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-sm flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-600 uppercase">System Ready</span>
            </div>
            <Activity className="text-blue-500" size={16} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/20 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-2">
                    <FileText className="text-blue-500" />
                    <Database className="text-green-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase">อัปโหลดไฟล์ PM (CSV/Excel)</h3>
                  <p className="text-xs text-slate-400">ระบบจะดึงเฉพาะคอลัมน์ที่จำเป็นให้อัตโนมัติ</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-400">Items Found</span>
              <span className="text-2xl font-black text-blue-600">{data.length}</span>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-xs font-bold">{errorMsg}</p>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 py-32 flex flex-col items-center">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-800 uppercase">Analyzing Data...</h2>
                <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase border border-blue-100">
                  <Clock size={14} /> ใช้เวลาประมาณ 5-10 วินาที
                </div>
              </div>
            ) : data.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-blue-500 text-white font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="p-4">รหัสเครื่องจักร</th>
                        <th className="p-4">ชื่อเครื่องจักร</th>
                        <th className="p-4">ความถี่</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((row) => (
                        <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-3">
                            <input defaultValue={row.machineCode} className="w-full p-2 border border-slate-100 rounded bg-transparent font-mono font-bold text-blue-600" />
                          </td>
                          <td className="p-3">
                            <input defaultValue={row.machineName} className="w-full p-2 border border-slate-100 rounded bg-transparent" />
                          </td>
                          <td className="p-3">
                            <select
                              defaultValue={row.frequency}
                              className="w-full p-2 border border-slate-100 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="Weekly">รายสัปดาห์ (Weekly)</option>
                              <option value="Bi-Weekly">ทุก 2 สัปดาห์ (Bi-Weekly)</option>
                              <option value="Monthly">รายเดือน (Monthly)</option>
                              <option value="Every 2 Months">ทุก 2 เดือน (Every 2 Months)</option>
                              <option value="Quarterly">รายไตรมาส / ทุก 3 เดือน (Quarterly)</option>
                              <option value="Semi-Annually">ทุก 6 เดือน (Semi-Annually)</option>
                              <option value="Annually">รายปี (Annually)</option>
                              <option value="Unknown">ไม่ระบุ (Unknown)</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                  Commit to Database <CheckCircle2 size={18} />
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 py-40 flex flex-col items-center text-slate-300">
                <Database size={48} className="mb-4 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">รอการอัปโหลดข้อมูล...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}