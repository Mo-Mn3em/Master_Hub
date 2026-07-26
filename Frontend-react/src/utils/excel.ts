import * as XLSX from 'xlsx';
import type { Patient, ResearchTemplate } from '../types';
import { getLocalDateString, getDynamicAge } from './clinicalRules';

// Excel helper to convert raw date strings (YYYY-MM-DD) to serial numbers for formatting
function toExcelDate(dateStr: string): any {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const utcDate = Date.UTC(year, month, day);
  return Math.floor((utcDate / 86400000) + 25569);
}

export function exportPatientRoster(patients: Patient[], sheetName: string = 'Global Directory') {
  // Map patients to rows
  const rows = patients.map((p, idx) => {
    const row: any = {
      'No.': idx + 1,
      'MRN': p.bas_mrn || '',
      'Patient Name': p.bas_name || '',
      'Gender': p.bas_gender || '',
      'Date of Birth': p.bas_dob || '',
      'Age': getDynamicAge(p.bas_dob),
      'Contact Phone': p.bas_phone || '',
      'Governorate': p.bas_gov || '',
      'Blood Group': p.bas_blood || '',
      'Motor Problems': p.bas_motorProblem === 'yes' ? 'Yes' : 'No',
      'Motor Details': p.bas_motorProblemDetail || '',
      'Clinical History': p.bas_history || '',
      'Social Notes': p.bas_social || '',
      'Acceptance Cause': p.bas_acceptanceCause || '',
      'Created At': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
      'Updated At': p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '',
      'Updated By': p.updatedBy || ''
    };

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  
  // Format columns
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  
  const filename = `${sheetName.replace(/\s+/g, '_')}_Roster_${getLocalDateString()}`;
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportResearchStudy(template: ResearchTemplate, studyPatients: Patient[]) {
  const rows = studyPatients.map((p, idx) => {
    const row: any = {
      'No.': idx + 1,
      'MRN': p.bas_mrn || '',
      'Patient Name': p.bas_name || '',
      'Gender': p.bas_gender || '',
      'Age': getDynamicAge(p.bas_dob),
      'Date of Birth': p.bas_dob || '',
      'Governorate': p.bas_gov || '',
      'Blood Group': p.bas_blood || '',
    };

    // Append dynamic study fields
    template.fields.forEach(field => {
      row[field.name] = p.research?.[template.id]?.[field.name] ?? '';
    });

    row['Updated At'] = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '';
    row['Updated By'] = p.updatedBy || '';

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  
  const sheetTitle = template.title.substring(0, 30);
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
  
  const filename = `${template.title.replace(/\s+/g, '_')}_Database_${getLocalDateString()}`;
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportAnalyticsToExcel(
  metrics: any,
  avgWaitVisit: number,
  avgWaitDecision: number,
  avgLOS: number,
  deptName: string,
  fromFmt: string,
  toFmt: string
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive Summary
  const summaryRows = [
    { Metric: "Report Period", Value: `${fromFmt} to ${toFmt}` },
    { Metric: "Department", Value: deptName },
    { Metric: "Total First Visits", Value: metrics.totalFirstVisits },
    { Metric: "Cases Decided for Surgery", Value: metrics.totalDecidedCases },
    { Metric: "Currently Waiting", Value: metrics.currentlyWaiting },
    { Metric: "Operations Completed", Value: metrics.completedOperations },
    { Metric: "Avg Wait from First Visit (Days)", Value: avgWaitVisit },
    { Metric: "Avg Wait from Decision (Days)", Value: avgWaitDecision },
    { Metric: "Avg Post-Op Dept. Stay (Days)", Value: avgLOS },
    { Metric: "Acuity Escalations (Deterioration)", Value: metrics.acuityEscalations }
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Executive Summary');

  // Sheet 2: Active Blockers
  const blockerRows = Object.entries(metrics.blockers || {})
    .sort((a: any, b: any) => b[1] - a[1])
    .map(([reason, count]) => ({ "Blocker Reason": reason, "Affected Patients": count }));
  if (blockerRows.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(blockerRows), 'Active Blockers');
  }

  // Sheet 3: Cancellations & Rejects
  const cancelRows = Object.entries(metrics.cancelReasons || {}).map(([reason, count]) => ({ "Type": "Surgeon Cancel", "Reason": reason, "Count": count }))
    .concat(Object.entries(metrics.anesRejects || {}).map(([reason, count]) => ({ "Type": "Anesthesia Reject", "Reason": reason, "Count": count })));
  if (cancelRows.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cancelRows), 'Cancellations & Rejects');
  }

  XLSX.writeFile(wb, `Hospital_Analytics_${deptName.replace(/\s+/g, '_')}_${getLocalDateString()}.xlsx`);
}

