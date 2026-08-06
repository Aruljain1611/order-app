import { useState } from 'react';
import StockManager from './components/StockManager';
import OrderBuilder from './components/OrderBuilder';
import OrderReceipt from './components/OrderReceipt';
import { Package, ShoppingCart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('stock');
  const [exportData, setExportData] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Order Maker</h1>
          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'stock' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package size={18} /> Stock Items
            </button>
            <button
              onClick={() => setActiveTab('order')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'order' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart size={18} /> Create Order
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'stock' ? (
          <StockManager />
        ) : (
          <OrderBuilder onGenerateImage={(data) => setExportData(data)} />
        )}
      </main>

      {exportData && (
        <OrderReceipt orderData={exportData} onClose={() => setExportData(null)} />
      )}
    </div>
  );
}