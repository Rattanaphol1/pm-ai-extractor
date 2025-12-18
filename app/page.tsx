
'use client';

import { useState, useMemo } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { IPMData } from './types';
import {
  Loader2, Cpu, Activity, Database, LayoutGrid,
  FileText, Clock, ImageIcon, AlertCircle, CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react';
import { extractDataFromAI } from './actions';
import { Search, X } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<IPMData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const accuracyRate = useMemo(() => {
    if (data.length === 0) return 0;
    const totalFields = data.length * 4;
    let filledFields = 0;

    data.forEach(item => {
      if (item.machineCode?.trim()) filledFields++;
      if (item.machineName?.trim()) filledFields++;
      if (item.maintenanceDescription?.trim()) filledFields++;
      if (item.frequency?.trim()) filledFields++;
    });

    return Math.round((filledFields / totalFields) * 100);
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchStr = searchTerm.toLowerCase();
      return (
        item.machineCode.toLowerCase().includes(searchStr) ||
        item.machineName.toLowerCase().includes(searchStr) ||
        item.maintenanceDescription?.toLowerCase().includes(searchStr)
      );
    });
  }, [data, searchTerm]);

  const processData = async (payload: string, mode: 'text' | 'image') => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // เรียกใช้ AI โดยระบุโหมด (Llama สำหรับ Text / Llama Vision สำหรับ Image)
      const aiResult = await extractDataFromAI(payload, mode);
      setData(aiResult);
    } catch (err: any) {
      setErrorMsg(err.message || "AI ประมวลผลผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    // --- ส่วนที่เพิ่ม: จัดการไฟล์รูปภาพ ---
    if (fileName.match(/\.(png|jpg|jpeg)$/)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        processData(base64Data, 'image');
      };
      reader.readAsDataURL(file);
    }
    // --- ส่วนเดิม: จัดการไฟล์ CSV ---
    else if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (res) => {
          const csvString = Papa.unparse(res.data.slice(0, 300));
          processData(csvString, 'text');
        },
        header: false,
        skipEmptyLines: true
      });
    }
    // --- ส่วนเดิม: จัดการไฟล์ Excel ---
    else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const csvString = Papa.unparse((rawRows as any[]).slice(0, 100));
        processData(csvString, 'text');
      };
      reader.readAsBinaryString(file);
    }
  };


  const getFieldError = (value: string, fieldName: string) => {
    if (!value || value.trim() === "") return "กรุณาตรวจสอบข้อมูล";

    // ตัวอย่าง: ถ้ารหัสเครื่องจักร (machineCode) สั้นเกินไปหรือไม่มีตัวเลข
    if (fieldName === "machineCode" && value.length < 3) return "รหัสเครื่องสั้นผิดปกติ";

    // ตัวอย่าง: ถ้าความถี่ (frequency) ไม่มีหน่วยเดือน/ปี หรือเลข
    if (fieldName === "frequency" && !/[0-9]/.test(value)) return "ระบุความถี่ไม่ชัดเจน";

    return null;
  };

  const addRow = (index: number) => {
    const newData = [...data];
    const newRow: IPMData = {
      id: `manual-${Date.now()}`,
      machineCode: '',
      machineName: '',
      maintenanceDescription: '',
      frequency: ''
    };
    newData.splice(index + 1, 0, newRow);
    setData(newData);
  };

  // ฟังก์ชันสำหรับลบแถว
  const deleteRow = (id: string) => {
    const newData = data.filter(item => item.id !== id);
    setData(newData);
  };

  // ฟังก์ชันสำหรับอัปเดตข้อมูลเมื่อมีการพิมพ์ในช่อง (เพื่อให้ข้อมูลใน State เป็นปัจจุบัน)
  const updateField = (index: number, field: keyof IPMData, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-[1440px] mx-auto">

        {/* Header - PRISM Maintenance Identity */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
              <Cpu className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                AI PM <span className="text-blue-600 font-light">Maintenance</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Predictive Intelligence & Smart Monitoring</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-sm flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">System Online</span>
            </div>
            <Activity className="text-blue-500" size={16} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/20 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls, .png, .jpg, .jpeg"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-2">
                    <FileText className="text-blue-500" />
                    <Database className="text-green-500" />
                    <ImageIcon className="text-violet-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase">อัปโหลดไฟล์/รูปภาพ PM ( CSV, Excel, JPG, JPEG)</h3>
                  <p className="text-xs text-slate-400 font-medium">ระบบจะดึงเฉพาะคอลัมน์ที่จำเป็นให้อัตโนมัติ</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-widest">Items Found</span>
              <span className="text-2xl font-black text-blue-600">{data.length}</span>
            </div>

            {data.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm ">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Accuracy Rate</span>
                  <span className={`text-xs font-black ${accuracyRate > 90 ? 'text-green-500' : 'text-orange-500'}`}>
                    {accuracyRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${accuracyRate > 90 ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${accuracyRate}%` }}
                  ></div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-xs font-bold">{errorMsg}</p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8">

            {data.length > 0 && (
              <div className="bg-white rounded-3xl mb-4 border border-slate-200 p-6 shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="ค้นหารหัส, ชื่อ หรือรายการ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 py-32 flex flex-col items-center">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Analyzing Data...</h2>
                <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase border border-blue-100">
                  <Clock size={14} /> ใช้เวลาประมาณ 1-2 นาที
                </div>
              </div>
            ) : data.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  <div className="overflow-x-auto overflow-y-auto max-h-[750px]">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-blue-700 text-white font-bold uppercase text-[12px] tracking-widest sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="p-4 bg-blue-700 w-16 text-center">ลำดับ</th>
                          <th className="p-4 bg-blue-700">รหัสเครื่องจักร</th>
                          <th className="p-4 bg-blue-700">ชื่อเครื่องจักร</th>
                          <th className="p-4 bg-blue-700">รายการบำรุงรักษา</th>
                          <th className="p-4 bg-blue-700">ความถี่</th>
                          <th className="p-4 bg-blue-700 text-center w-24">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredData.map((row, index) => (
                          <tr key={row.id || `row-${index}`} className="hover:bg-blue-50/50 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-400 text-xs">
                              {index + 1}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1">
                                <input
                                  defaultValue={row.machineCode}
                                  onChange={(e) => updateField(index, 'machineCode', e.target.value)}
                                  className={`w-full p-2 border rounded font-mono font-bold outline-none transition-all ${getFieldError(row.machineCode, "machineCode")
                                    ? "border-yellow-400 bg-red-50 text-yellow-600"
                                    : "border-slate-100 bg-transparent text-blue-600 focus:ring-1 focus:ring-blue-500"
                                    }`}
                                />
                                {getFieldError(row.machineCode, "machineCode") && (
                                  <span className="text-[11px] text-yellow-500 font-bold ml-1 animate-pulse">
                                    {getFieldError(row.machineCode, "machineCode")}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <input
                                defaultValue={row.machineName}
                                onChange={(e) => updateField(index, 'machineName', e.target.value)}
                                className={`w-full p-2 border rounded font-medium outline-none transition-all ${getFieldError(row.machineName, "machineName")
                                  ? "border-yellow-400 bg-red-50 text-yellow-600"
                                  : "border-slate-100 bg-white text-slate-600 focus:ring-1 focus:ring-blue-500"
                                  }`}
                              />
                              {getFieldError(row.machineName, "machineName") && (
                                <span className="text-[11px] text-yellow-500 font-bold ml-1">
                                  {getFieldError(row.machineName, "machineName")}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <input
                                defaultValue={row.maintenanceDescription}
                                onChange={(e) => updateField(index, 'maintenanceDescription', e.target.value)}
                                className="w-full p-2 border border-slate-100 rounded bg-transparent outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                defaultValue={row.frequency}
                                onChange={(e) => updateField(index, 'frequency', e.target.value)}
                                className={`w-full p-2 border rounded font-medium outline-none transition-all ${getFieldError(row.frequency, "frequency")
                                  ? "border-yellow-400 bg-red-50 text-yellow-600"
                                  : "border-slate-100 bg-white text-slate-600 focus:ring-1 focus:ring-blue-500"
                                  }`}
                              />
                              {getFieldError(row.frequency, "frequency") && (
                                <span className="text-[11px] text-yellow-500 font-bold ml-1">
                                  {getFieldError(row.frequency, "frequency")}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                {/* ปุ่มเพิ่มแถว */}
                                <button
                                  onClick={() => addRow(index)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="เพิ่มแถวใต้แถวนี้"
                                >
                                  <Plus size={16} />
                                </button>

                                {/* ปุ่มลบแถว */}
                                <button
                                  onClick={() => deleteRow(row.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                  title="ลบแถวนี้"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ส่วนสรุปจำนวนแถวแบบย่อ */}
                <div className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-end">
                  Showing {data.length} entries in laboratory view
                </div>

                <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-3 active:scale-[0.98]">
                  Commit to PRISM Database <CheckCircle2 size={18} />
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