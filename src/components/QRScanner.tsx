import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QRScannerProps {
  onScan?: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        if (scannerRef.current) {
          scannerRef.current.clear().then(() => {
            if (onScan) {
              onScan(decodedText);
            } else {
              // Default behavior: navigate to health passport
              let studentId = decodedText;
              if (decodedText.includes('/health-passport/')) {
                const parts = decodedText.split('/health-passport/');
                studentId = parts[parts.length - 1];
              }
              navigate(`/health-passport/${studentId}`);
              onClose();
            }
          }).catch(err => {
            console.error("Failed to clear scanner", err);
            if (onScan) {
              onScan(decodedText);
            } else {
              let studentId = decodedText;
              if (decodedText.includes('/health-passport/')) {
                const parts = decodedText.split('/health-passport/');
                studentId = parts[parts.length - 1];
              }
              navigate(`/health-passport/${studentId}`);
              onClose();
            }
          });
        }
      },
      (errorMessage) => {
        // console.warn(errorMessage);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner on unmount", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
      >
        <X size={24} />
      </button>
      
      <div className="w-full max-w-md aspect-square bg-slate-900 rounded-[40px] overflow-hidden border-4 border-blue-500/30 relative shadow-2xl">
        <div id="qr-reader" className="w-full h-full" />
        
        {/* Scanning Overlay UI */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <div className="w-64 h-64 border-2 border-blue-500 rounded-3xl relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
            
            {/* Scanning Line Animation */}
            <div className="absolute left-0 right-0 h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan" />
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-2">
        <h3 className="text-xl font-bold text-white">Scan Health Passport</h3>
        <p className="text-slate-400">Position the QR code within the frame to scan</p>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
        #qr-reader__dashboard_section_csr button {
          background-color: #3b82f6 !important;
          color: white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          font-weight: bold !important;
          cursor: pointer !important;
          margin-top: 10px !important;
        }
        #qr-reader__status_span {
          color: white !important;
          font-size: 12px !important;
        }
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}
