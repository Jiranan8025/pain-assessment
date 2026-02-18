import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export async function exportToPdf(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));
  pdf.save(filename);
}
