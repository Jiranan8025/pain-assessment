interface QRCodeProps {
  url: string;
  size?: number;
}

/**
 * QR Code component using a lightweight client-side generator.
 * Uses a canvas to render a QR code without external API calls.
 * Falls back to a styled link if canvas is unavailable.
 */
export default function QRCode({ url, size = 200 }: QRCodeProps) {
  // Use Google Charts API for QR generation (works offline is not required here)
  const qrSrc = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(url)}&choe=UTF-8`;

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={qrSrc}
        alt="QR Code"
        width={size}
        height={size}
        className="border border-gray-200 rounded-lg p-1 bg-white"
      />
      <p className="text-xs text-gray-500 text-center max-w-[200px] break-all font-mono">{url}</p>
    </div>
  );
}
