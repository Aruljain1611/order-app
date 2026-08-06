import { useState, useEffect } from 'react';
import { db } from '../db';
import { Search, Plus, Minus, Trash2, Printer } from 'lucide-react';

export default function OrderBuilder({ onGenerateImage }) {
  const [catalog, setCatalog] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percentage'

  useEffect(() => {
    db.items.toArray().then(setCatalog);
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setSearchTerm('');
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  // Discount Calculation
  const parsedDiscount = parseFloat(discountValue || 0);
  const calculatedDiscountAmount = discountType === 'percentage'
    ? (subtotal * parsedDiscount) / 100
    : parsedDiscount;

  const finalTotal = Math.max(0, subtotal - calculatedDiscountAmount);

  const searchResults = searchTerm
    ? catalog.filter((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Search Stock to Add</label>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Type item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 flex justify-between items-center border-b border-gray-100 last:border-none"
              >
                <span className="font-medium text-gray-800">{item.name}</span>
                <span className="text-sm text-gray-500">₹{item.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart List */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Current Order Cart</h2>

        {cart.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No items in order. Search above to add.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {cart.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{item.name}</h3>
                  <p className="text-xs text-gray-500">₹{item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded-l-lg">
                      <Minus size={16} />
                    </button>
                    <span className="px-3 text-sm font-semibold">{item.qty}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 rounded-r-lg">
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="w-24 text-right font-medium text-gray-700">
                    ₹{(item.price * item.qty).toFixed(2)}
                  </span>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calculation Section */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            {/* Discount Toggle & Field */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Discount:</span>
              <div className="flex items-center gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="px-2 py-1 border rounded text-xs bg-gray-50 focus:outline-none"
                >
                  <option value="amount">₹ (Fixed)</option>
                  <option value="percentage">% (Percentage)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
              <span>Final Total Value:</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={() => onGenerateImage({ cart })}
              className="w-full mt-4 bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <Printer size={18} /> Print / Generate Order Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}