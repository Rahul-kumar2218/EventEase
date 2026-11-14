import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Upload, RefreshCw, AlertCircle } from 'lucide-react';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isScanning: boolean;
}

export const QrScannerComponent: React.FC<QrScannerProps> = ({
  onScanSuccess,
  isScanning,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Initialize scanner instance
    const html5QrCode = new Html5Qrcode('qr-reader-container');
    scannerRef.current = html5QrCode;

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.log('Error stopping scanner during cleanup', err));
      }
    };
  }, []);

  const startCamera = async () => {
    setErrorMessage(null);
    if (!scannerRef.current) return;

    try {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setErrorMessage(
        'Camera access unavailable or permission denied. You can still scan by uploading an image or entering the 6-character code.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      setCameraActive(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !scannerRef.current) return;

    try {
      setErrorMessage(null);
      const decodedText = await scannerRef.current.scanFile(file, true);
      if (decodedText) {
        onScanSuccess(decodedText);
      }
    } catch (err: any) {
      setErrorMessage('Could not find a valid QR code in this image. Try another file or use manual code entry.');
    } finally {
      // reset file input value
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Scanner viewfinder box */}
      <div className="relative w-full max-w-sm aspect-square bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-700/80 shadow-2xl flex flex-col items-center justify-center">
        <div id="qr-reader-container" className="w-full h-full"></div>

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 backdrop-blur-sm z-10">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 animate-pulse">
              <Camera className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-white">Live Camera Scanner</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1 mb-5">
              Launch camera to rapidly scan participant passes at the gate
            </p>
            <button
              onClick={startCamera}
              disabled={isScanning}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-brand-600/30 transition-all hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              <span>Enable Camera</span>
            </button>
          </div>
        )}

        {/* Reticle Overlay when camera is active */}
        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
            <div className="w-56 h-56 border-2 border-brand-400/80 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-brand-400 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-brand-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-brand-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-brand-400 rounded-br-lg"></div>
              {/* Laser scanner bar */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent animate-bounce"></div>
            </div>
            <div className="text-[11px] font-mono font-medium text-white/90 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700 mt-4 backdrop-blur-sm">
              Point camera at pass QR
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls & File Upload fallback */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        {cameraActive && (
          <button
            onClick={stopCamera}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
          >
            <CameraOff className="w-3.5 h-3.5 text-rose-400" />
            <span>Turn Off Camera</span>
          </button>
        )}

        {/* Upload image fallback */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          id="qr-file-upload-input"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-850 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>Upload QR Image</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl flex items-center space-x-2 max-w-sm text-center">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
