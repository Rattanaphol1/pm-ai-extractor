// app/types.ts

// ข้อมูลที่เราต้องการให้ AI ดึงออกมา
export interface IPMData {
  id: string;             // เผื่อไว้สำหรับ key ใน react map
  machineCode: string;    // รหัสเครื่องจักร
  machineName: string;    // ชื่อเครื่องจักร
  frequency: 'Monthly' | 'Quarterly' | 'Annually' | 'Unknown'; // ค่ามาตรฐาน
  rawFrequency: string;   // ค่าเดิมจากไฟล์ (เช่น 'AB', '1 เดือน')
}

// โครงสร้าง Response ที่ AI จะส่งกลับมา (เป็น Array)
export type AIResponse = IPMData[];