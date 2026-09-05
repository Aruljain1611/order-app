import { useState } from 'react';
import StockManager from './components/StockManager';
import OrderBuilder from './components/OrderBuilder';
import OrderReceipt from './components/OrderReceipt';
import ChallanManager from './components/ChallanManager';
import { Package, ShoppingCart, FileText } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('stock');
  const [exportData, setExportData] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-black px-2 py-1 rounded">BW</span>
            Battery World Portal
          </h1>
          <nav className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'stock' ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package size={18} /> Stock Items
            </button>
            <button
              onClick={() => setActiveTab('order')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'order' ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart size={18} /> Create Order
            </button>
            <button
              onClick={() => setActiveTab('challan')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'challan' ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText size={18} /> Delivery Challan
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {activeTab === 'stock' && <StockManager />}
        {activeTab === 'order' && <OrderBuilder onGenerateImage={(data) => setExportData(data)} />}
        {activeTab === 'challan' && <ChallanManager />}
      </main>

      {exportData && (
        <OrderReceipt orderData={exportData} onClose={() => setExportData(null)} />
      )}
    </div>
  );
}