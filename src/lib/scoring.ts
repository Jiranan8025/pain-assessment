// ============================================================
// DASS-21 Scoring
// ============================================================

// Item indices (1-based from the questionnaire, converted to 0-based array index)
const DEPRESSION_ITEMS = [2, 4, 9, 12, 15, 16, 20]; // Questions 3,5,10,13,16,17,21
const ANXIETY_ITEMS = [1, 3, 6, 8, 14, 18, 19];     // Questions 2,4,7,9,15,19,20
const STRESS_ITEMS = [0, 5, 7, 10, 11, 13, 17];     // Questions 1,6,8,11,12,14,18

export function calculateDass21(answers: number[]): {
  depression: number;
  anxiety: number;
  stress: number;
} {
  const depression = DEPRESSION_ITEMS.reduce((sum, i) => sum + (answers[i] || 0), 0);
  const anxiety = ANXIETY_ITEMS.reduce((sum, i) => sum + (answers[i] || 0), 0);
  const stress = STRESS_ITEMS.reduce((sum, i) => sum + (answers[i] || 0), 0);
  return { depression, anxiety, stress };
}

export type SeverityLevel = 'Normal' | 'Mild' | 'Moderate' | 'Severe' | 'Extremely Severe';

export function getDepressionSeverity(score: number): SeverityLevel {
  if (score <= 4) return 'Normal';
  if (score <= 6) return 'Mild';
  if (score <= 10) return 'Moderate';
  if (score <= 13) return 'Severe';
  return 'Extremely Severe';
}

export function getAnxietySeverity(score: number): SeverityLevel {
  if (score <= 3) return 'Normal';
  if (score <= 5) return 'Mild';
  if (score <= 7) return 'Moderate';
  if (score <= 9) return 'Severe';
  return 'Extremely Severe';
}

export function getStressSeverity(score: number): SeverityLevel {
  if (score <= 7) return 'Normal';
  if (score <= 9) return 'Mild';
  if (score <= 12) return 'Moderate';
  if (score <= 16) return 'Severe';
  return 'Extremely Severe';
}

export function getSeverityColor(level: SeverityLevel): string {
  switch (level) {
    case 'Normal': return 'bg-severity-normal text-white';
    case 'Mild': return 'bg-severity-mild text-black';
    case 'Moderate': return 'bg-severity-moderate text-white';
    case 'Severe': return 'bg-severity-severe text-white';
    case 'Extremely Severe': return 'bg-severity-extreme text-white';
  }
}

// ============================================================
// EQ-5D-5L Thai Tariff Utility Calculation
// ============================================================

const EQ5D_TARIFFS = {
  mobility:            [0, 0, 0.056, 0.114, 0.231, 0.307],
  selfCare:            [0, 0, 0.033, 0.108, 0.225, 0.254],
  usualActivities:     [0, 0, 0.043, 0.075, 0.165, 0.207],
  painDiscomfort:       [0, 0, 0.040, 0.068, 0.233, 0.266],
  anxietyDepression:   [0, 0, 0.032, 0.097, 0.202, 0.249],
};

export function calculateEq5dUtility(
  mobility: number,
  selfCare: number,
  usualActivities: number,
  painDiscomfort: number,
  anxietyDepression: number,
): number {
  const decrement =
    EQ5D_TARIFFS.mobility[mobility] +
    EQ5D_TARIFFS.selfCare[selfCare] +
    EQ5D_TARIFFS.usualActivities[usualActivities] +
    EQ5D_TARIFFS.painDiscomfort[painDiscomfort] +
    EQ5D_TARIFFS.anxietyDepression[anxietyDepression];
  return Math.round((1 - decrement) * 1000) / 1000;
}

export const EQ5D_LABELS = {
  mobility: [
    '',
    'ไม่มีปัญหาในการเดิน',
    'มีปัญหาในการเดิน เล็กน้อย',
    'มีปัญหาในการเดิน ปานกลาง',
    'มีปัญหาในการเดิน อย่างมาก',
    'เดินไม่ได้',
  ],
  selfCare: [
    '',
    'ไม่มีปัญหาในการอาบน้ำ/ใส่เสื้อผ้า',
    'มีปัญหาในการอาบน้ำ/ใส่เสื้อผ้า เล็กน้อย',
    'มีปัญหาในการอาบน้ำ/ใส่เสื้อผ้า ปานกลาง',
    'มีปัญหาในการอาบน้ำ/ใส่เสื้อผ้า อย่างมาก',
    'อาบน้ำ/ใส่เสื้อผ้าไม่ได้',
  ],
  usualActivities: [
    '',
    'ไม่มีปัญหาในการทำกิจกรรมประจำ',
    'มีปัญหาในการทำกิจกรรมประจำ เล็กน้อย',
    'มีปัญหาในการทำกิจกรรมประจำ ปานกลาง',
    'มีปัญหาในการทำกิจกรรมประจำ อย่างมาก',
    'ทำกิจกรรมประจำไม่ได้',
  ],
  painDiscomfort: [
    '',
    'ไม่มีอาการเจ็บปวด/ไม่สบายตัว',
    'มีอาการเจ็บปวด/ไม่สบายตัว เล็กน้อย',
    'มีอาการเจ็บปวด/ไม่สบายตัว ปานกลาง',
    'มีอาการเจ็บปวด/ไม่สบายตัว อย่างมาก',
    'มีอาการเจ็บปวด/ไม่สบายตัว อย่างมากที่สุด',
  ],
  anxietyDepression: [
    '',
    'ไม่รู้สึกวิตกกังวล/ซึมเศร้า',
    'รู้สึกวิตกกังวล/ซึมเศร้า เล็กน้อย',
    'รู้สึกวิตกกังวล/ซึมเศร้า ปานกลาง',
    'รู้สึกวิตกกังวล/ซึมเศร้า อย่างมาก',
    'รู้สึกวิตกกังวล/ซึมเศร้า อย่างมากที่สุด',
  ],
};

// ============================================================
// DASS-21 Question Text (Thai)
// ============================================================

export const DASS21_QUESTIONS = [
  'ข้าพเจ้ารู้สึกว่า ยากที่จะผ่อนคลายอารมณ์',
  'ข้าพเจ้าทราบว่า ข้าพเจ้ามีอาการปากแห้ง',
  'ข้าพเจ้ารู้สึกไม่ดีขึ้นเลย',
  'ข้าพเจ้ามีอาการหายใจลำบาก (เช่น หายใจเร็วผิดปกติ หายใจไม่ออก แม้ไม่ได้ออกแรง)',
  'ข้าพเจ้ารู้สึกทำกิจกรรมด้วยตนเองได้ค่อนข้างลำบาก',
  'ข้าพเจ้าเริ่มมีปฏิกิริยาตอบสนองต่อสิ่งต่างๆ มากเกินไป (เช่น ตกใจง่าย)',
  'ข้าพเจ้ามีอาการสั่น (เช่น ที่มือทั้งสองข้าง)',
  'ข้าพเจ้ารู้สึกว่าข้าพเจ้าวิตกกังวลมาก',
  'ข้าพเจ้ารู้สึกกังวลกับเหตุการณ์ที่อาจทำให้รู้สึกตื่นกลัวและกระทำสิ่งใดโดยมิได้คิด',
  'ข้าพเจ้ารู้สึกว่าข้าพเจ้าไม่มีเป้าหมาย',
  'ข้าพเจ้าเริ่มรู้สึกว่าข้าพเจ้ามีอาการกระวนกระวายใจ',
  'ข้าพเจ้ารู้สึกไม่ผ่อนคลาย',
  'ข้าพเจ้ารู้สึกจิตใจเหงาหงอยและเศร้าซึม',
  'ข้าพเจ้าทนไม่ได้กับภาวะใดก็ตามที่ทำให้ไม่สามารถทำอะไรต่อจากที่กำลังทำอยู่',
  'ข้าพเจ้ารู้สึกว่ามีอาการคล้ายกับอาการหวั่นวิตก (เช่น ใจสั่น กลัว)',
  'ข้าพเจ้าไม่รู้สึกกระตือรือร้นต่อสิ่งใด',
  'ข้าพเจ้ารู้สึกเป็นคนไม่มีคุณค่า',
  'ข้าพเจ้ารู้สึกว่าข้าพเจ้ามีอารมณ์ฉุนเฉียวง่าย',
  'ข้าพเจ้ารับรู้ถึงการทำงานของหัวใจในตอนที่ไม่ได้ออกแรง (เช่น หัวใจเต้นเพิ่ม/หยุดเต้น)',
  'ข้าพเจ้ารู้สึกกลัวโดยไม่มีเหตุผลใดๆ',
  'ข้าพเจ้ารู้สึกว่าชีวิตไม่มีความหมาย',
];

export const DASS21_OPTIONS = [
  { value: 0, label: 'ไม่ตรงกับข้าพเจ้าเลย' },
  { value: 1, label: 'ตรงกับข้าพเจ้าบ้าง หรือเกิดขึ้นบางครั้ง' },
  { value: 2, label: 'ตรงกับข้าพเจ้า หรือเกิดขึ้นบ่อย' },
  { value: 3, label: 'ตรงกับข้าพเจ้ามาก หรือเกิดขึ้นบ่อยมากที่สุด' },
];
