import React, { useState, useMemo } from 'react';
import { User, HealthRecord } from '../types';
import { X, FileDown, CheckSquare, Square, FileText, Eye } from 'lucide-react';
import Papa from 'papaparse';
import { motion } from 'motion/react';
import { getBmiCategory, getAgeFromDob } from '../lib/bmi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { ExportPreviewModal } from './ExportPreviewModal';

interface ExportHealthDataModalProps {
  students: User[];
  healthRecords: HealthRecord[];
  onClose: () => void;
  onExportSuccess: (message: string) => void;
}

const FIELDS = [
  { id: 'class', label: 'Class' },
  { id: 'division', label: 'Division' },
  { id: 'indexNumber', label: 'Index Number' },
  { id: 'fullName', label: 'Name' },
  { id: 'age', label: 'Age' },
  { id: 'weight', label: 'Weight' },
  { id: 'height', label: 'Height' },
  { id: 'hip', label: 'Hip Circumference' },
  { id: 'waist', label: 'Waist Circumference' },
  { id: 'bmi', label: 'BMI' },
];

const BMI_CATEGORIES = ['Severely Underweight', 'Underweight', 'Acceptable Weight', 'Overweight', 'Severely Overweight'];

const getRoundedImage = async (url: string, radius: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.beginPath();
      // Ensure it's a rounded rect
      const r = Math.min(radius, img.width / 2, img.height / 2);
      ctx.moveTo(r, 0);
      ctx.lineTo(img.width - r, 0);
      ctx.quadraticCurveTo(img.width, 0, img.width, r);
      ctx.lineTo(img.width, img.height - r);
      ctx.quadraticCurveTo(img.width, img.height, img.width - r, img.height);
      ctx.lineTo(r, img.height);
      ctx.quadraticCurveTo(0, img.height, 0, img.height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
  });
};

export const ExportHealthDataModal: React.FC<ExportHealthDataModalProps> = ({ students, healthRecords, onClose, onExportSuccess }) => {
  const [filterClass, setFilterClass] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>(FIELDS.map(f => f.id));
  const [selectedBmiCategories, setSelectedBmiCategories] = useState<string[]>(BMI_CATEGORIES);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const classes = useMemo(() => Array.from(new Set(students.map(s => s.class).filter(Boolean))), [students]);
  const divisions = useMemo(() => Array.from(new Set(students.map(s => s.division).filter(Boolean))), [students]);

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]);
  };

  const toggleBmiCategory = (category: string) => {
    setSelectedBmiCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const getFilteredData = () => {
    return students.filter(s => {
      const record = [...healthRecords].filter(r => r.userId === s.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const age = s.dob ? getAgeFromDob(s.dob) : 18;
      const category = record?.bmi ? getBmiCategory(record.bmi, age, s.gender).label : 'Unknown';

      const matchesClass = !filterClass || s.class === filterClass;
      const matchesDivision = !filterDivision || s.division === filterDivision;
      const matchesBmi = selectedBmiCategories.includes(category);

      return matchesClass && matchesDivision && matchesBmi;
    }).map(s => {
      const record = [...healthRecords].filter(r => r.userId === s.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const dob = new Date(s.dob || '');
      const age = s.dob ? Math.floor((new Date().getTime() - dob.getTime()) / (3.15576e+10)) : 0;
      const category = record?.bmi ? getBmiCategory(record.bmi, age, s.gender).label : 'N/A';

      const row: any = {};
      if (selectedFields.includes('class')) row['Class'] = s.class;
      if (selectedFields.includes('division')) row['Division'] = s.division;
      if (selectedFields.includes('indexNumber')) row['Index Number'] = s.indexNumber;
      if (selectedFields.includes('fullName')) row['Name'] = s.fullName;
      if (selectedFields.includes('age')) row['Age'] = age;
      if (selectedFields.includes('weight')) row['Weight'] = record?.weight || '';
      if (selectedFields.includes('height')) row['Height'] = record?.height || '';
      if (selectedFields.includes('hip')) row['Hip Circumference'] = record?.hip || '';
      if (selectedFields.includes('waist')) row['Waist Circumference'] = record?.waist || '';
      if (selectedFields.includes('bmi')) row['BMI'] = record?.bmi?.toFixed(1) || '';
      return row;
    });
  };
    
  const handleExportCsv = () => {
    const dataToExport = getFilteredData();
    dataToExport.push({ 'Class': 'Sharing Link', 'Division': `https://jhchealthguard.online/report/${filterClass || 'all'}/${filterDivision || 'all'}`});
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `student_health_data_${filterClass || 'all'}_${filterDivision || 'all'}.csv`;
    link.click();
    onClose();
  };

  const handleExportPdf = async () => {
    setIsPdfGenerating(true);
    try {
      const dataToExport = getFilteredData();
      const doc = new jsPDF();
      
      // Professional Header
      doc.setFillColor(30, 64, 175); // Blue-900 equivalent
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      
      // Branding: Logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('JHC Health Guard', 14, 20);
      
      const logoUrl = 'https://image2url.com/r2/default/images/1774698066689-6e63ff07-2034-4699-8e48-1fe210ec509e.jpg';
      const roundedLogo = await getRoundedImage(logoUrl, 50); // Reduced radius slightly to look more balanced
      doc.addImage(roundedLogo, 'PNG', 180, 5, 20, 20);
      
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 38);
      
      // Dataset details
      doc.setTextColor(50, 50, 50);
      doc.text(`Scope: Class ${filterClass || 'All'} | Division: ${filterDivision || 'All'}`, 14, 43);
      doc.text(`BMI Categories: ${selectedBmiCategories.join(', ')}`, 14, 48);
      
      const columns = Object.keys(dataToExport[0]);
      const rows = dataToExport.map(row => Object.values(row));
      
      autoTable(doc, { 
        head: [columns], 
        body: rows,
        startY: 55,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        styles: { fontSize: 8 }
      });

      // Add QR Code at bottom right
      const qrCodeUrl = await QRCode.toDataURL('https://play.google.com/store/apps/details?id=com.healthguard.jhc');
      doc.addImage(qrCodeUrl, 'PNG', 170, 250, 30, 30);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Sharing Link: https://jhchealthguard.online/report/${filterClass || 'all'}/${filterDivision || 'all'}`, 14, (doc as any).lastAutoTable.finalY + 15);
      
      const pdfBlob = doc.output('blob');
      const filename = `student_health_data_${filterClass || 'all'}_${filterDivision || 'all'}.pdf`;
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      let shared = false;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'JHC Health Guard Report',
            text: 'Check out this health report from JHC Health Guard.',
            url: `https://jhchealthguard.online/report/${filterClass || 'all'}/${filterDivision || 'all'}`,
            files: [file]
          });
          shared = true;
        } catch (err: any) {
          // If sharing is blocked or canceled, just log it slightly and proceed to download
          if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
              console.warn('Sharing failed:', err);
          }
        }
      }

      if (!shared) {
        doc.save(filename);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      onExportSuccess(shared ? 'PDF shared successfully!' : 'PDF downloaded successfully!');
      
      onClose();
    } catch (err) {
      console.error(err);
      setIsPdfGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Export Health Data</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900">Filter Students:</h3>
            <div className="grid grid-cols-2 gap-3">
              <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
              </select>
              <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">All Divisions</option>
                {divisions.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900">Select Export Fields:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {FIELDS.map(f => (
                <button
                  key={f.id}
                  onClick={() => toggleField(f.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${selectedFields.includes(f.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  {selectedFields.includes(f.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900">BMI Categories:</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {BMI_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => toggleBmiCategory(category)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${selectedBmiCategories.includes(category) ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  {selectedBmiCategories.includes(category) ? <CheckSquare size={18} /> : <Square size={18} />}
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-none p-6 border-t border-slate-100 bg-slate-50/50 space-y-3">
           <button onClick={() => setIsPreviewOpen(true)} className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm transition-all">
             <Eye size={18} /> Preview PDF
          </button>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={handleExportCsv} className="col-span-1 bg-slate-200 text-slate-800 py-3 rounded-xl font-bold hover:bg-slate-300 flex items-center justify-center gap-2 transition-all">
              <FileDown size={18} /> CSV
            </button>
            <button onClick={handleExportPdf} disabled={isPdfGenerating} className="col-span-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-70">
              {isPdfGenerating ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <FileText size={18} />
              )}
              {isPdfGenerating ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </motion.div>
      {isPreviewOpen && (
        <ExportPreviewModal 
          data={getFilteredData()}
          filterClass={filterClass}
          filterDivision={filterDivision}
          onClose={() => setIsPreviewOpen(false)}
          onDownload={handleExportPdf}
        />
      )}
    </div>
  );
};
