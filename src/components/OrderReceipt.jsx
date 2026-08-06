import { useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import { Share2 } from 'lucide-react';

export default function OrderReceipt({ orderData, onClose }) {
  const receiptRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!receiptRef.current) return;
    setSharing(true);

    try {
      const blob = await toBlob(receiptRef.current, { cacheBust: true, quality: 0.95 });
      if (!blob) throw new Error('Blob generation failed');

      const file = new File([blob], `Order_${new Date().toISOString().slice(0, 10)}.png`, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Order Receipt',
          text: 'Here is your order summary.',
        });
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        alert('Image copied to clipboard! You can paste it in WhatsApp or email.');
      }
    } catch (err) {
      console.error('Share failed:', err);
      alert('Could not share image. If on desktop, open on mobile to use native share sheet.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Order Image Preview</h2>

        {/* Clean Receipt Container (Summary Math Removed) */}
        <div ref={receiptRef} className="bg-white border p-6 rounded-lg space-y-4 text-gray-900">
          <div className="border-b pb-3">
            <h1 className="text-xl font-bold uppercase tracking-wider">Purchase Order</h1>
            <p className="text-xs text-gray-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2">Item Name</th>
                <th className="py-2 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderData?.cart?.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 font-medium text-gray-800">{item.name}</td>
                  <td className="py-2.5 text-right font-bold text-gray-900">{item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Share2 size={18} /> {sharing ? 'Preparing...' : 'Share Image'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}