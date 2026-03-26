import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { X, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QRScannerProps {
  onScan?: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const handleScanResult = (decodedText: string) => {
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
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanResult(decodedText);
    } catch (err) {
      console.error("Failed to scan file", err);
      setError("Failed to scan QR code from image. Please try another image.");
    }
  };

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
            handleScanResult(decodedText);
          }).catch(err => {
            console.error("Failed to clear scanner", err);
            handleScanResult(decodedText);
          });
        }
      },
      (errorMessage) => {
        // Check if it's a permission error
        if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
          setError("Camera permission denied. Please allow camera access in your browser settings.");
        }
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
      
      <div className="mt-8 text-center space-y-4">
        {error ? (
          <p className="text-red-500 font-bold">{error}</p>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white">Scan Health Passport</h3>
            <p className="text-slate-400">Position the QR code within the frame to scan</p>
          </>
        )}
        
        <label className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition-all">
          <Upload size={20} />
          Upload QR Image
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
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
          display: none !important;
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
