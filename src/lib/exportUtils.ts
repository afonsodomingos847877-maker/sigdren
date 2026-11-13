import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToExcel(filename: string, sheetName: string, rows: Record<string, unknown>[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToGeoJSON(filename: string, featureCollection: GeoJSON.FeatureCollection) {
  const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
    type: 'application/geo+json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.geojson`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface PdfReportOptions {
  title: string;
  subtitle: string;
  referencePeriod: string;
  kpis: { label: string; value: string }[];
  analysis: string;
  observations?: string;
  tableHeaders: string[];
  tableRows: (string | number)[][];
  filename: string;
}

export function exportReportToPDF(opts: PdfReportOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Institutional Header
  doc.setFillColor(20, 43, 74); // #142B4A
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('SIG-DREN MATOLA', 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Empresa Municipal de Saneamento e Abastecimento de Água da Matola', 14, 19);
  doc.text(`Período de Referência: ${opts.referencePeriod}   |   Gerado em: ${new Date().toLocaleDateString('pt-PT')}`, 14, 26);

  // Title
  doc.setTextColor(23, 23, 23);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.title, 14, 42);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(opts.subtitle, 14, 48);

  // KPI summary boxes
  let y = 55;
  const boxWidth = 43;
  opts.kpis.slice(0, 4).forEach((kpi, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(244, 244, 244);
    doc.roundedRect(x, y, boxWidth, 16, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(119, 119, 119);
    doc.text(kpi.label.slice(0, 24), x + 3, y + 5.5);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(23, 23, 23);
    doc.text(kpi.value, x + 3, y + 12.5);
    doc.setFont('helvetica', 'normal');
  });

  y += 24;
  // Analysis
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 43, 74);
  doc.text('Análise dos Resultados', 14, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  const splitAnalysis = doc.splitTextToSize(opts.analysis, 182);
  doc.text(splitAnalysis, 14, y);
  y += splitAnalysis.length * 4.5 + 4;

  // Table
  autoTable(doc, {
    startY: y,
    head: [opts.tableHeaders],
    body: opts.tableRows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [20, 43, 74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  if (opts.observations) {
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30;
    if (finalY < 265) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 43, 74);
      doc.text('Observações:', 14, finalY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const splitObs = doc.splitTextToSize(opts.observations, 182);
      doc.text(splitObs, 14, finalY + 13);
    }
  }

  doc.save(`${opts.filename}.pdf`);
}

