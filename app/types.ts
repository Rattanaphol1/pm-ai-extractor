// app/types.ts

export interface IPMData {
  id: string;
  machineCode: string;
  machineName: string;
  // เพิ่มค่าที่พบจริงจากไฟล์เข้าไปใน Type
  frequency: 
    | 'Weekly' 
    | 'Bi-Weekly' 
    | 'Monthly' 
    | 'Every 2 Months' 
    | 'Quarterly' 
    | 'Semi-Annually' 
    | 'Annually' 
    | 'Unknown';
  rawFrequency: string; // เก็บค่าเดิมไว้เสมอ เช่น '2 W', '1 M'
  maintenanceDescription?: string; // (เผื่อไว้) ถ้าอยากเก็บรายละเอียดงานซ่อมบำรุงด้วย
}

export type AIResponse = IPMData[];