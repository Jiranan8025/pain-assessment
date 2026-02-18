import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  url: string;
  size?: number;
}

export default function QRCode({ url, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    }
  }, [url, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg p-1 bg-white"
      />
      <p className="text-xs text-gray-500 text-center max-w-[200px] break-all font-mono">{url}</p>
    </div>
  );
}
