import { base44 } from '@/api/base44Client';

export async function generateCaseNumber() {
  const cases = await base44.entities.Case.list('-created_date', 1);
  if (cases.length === 0) return 'CASE-001';
  const lastNum = cases[0].case_number;
  if (!lastNum) return 'CASE-001';
  const num = parseInt(lastNum.replace('CASE-', ''), 10);
  return `CASE-${String(num + 1).padStart(3, '0')}`;
}