import { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';

export default function OrderReceipt({ orderData, onClose }) {
  const receiptRef = useRef(null);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    const dataUrl = await toPng(receiptRef.current, { cacheBust: true });
    const link = document.createElement('a');
    link.download = `Order_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Order Image Preview</h2>

        {/* Receipt Container Captured for PNG */}
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
              {orderData.cart.map((item) => (
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
            onClick={handleDownload}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Download size={18} /> Download Image
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