import { useState, useEffect } from 'react';
import { db } from '../db';
import * as XLSX from 'xlsx';
import { Trash2, Edit2, Upload, Plus, Search, Check, X, Download } from 'lucide-react';

export default function StockManager() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const allItems = await db.items.toArray();
    setItems(allItems);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!name || !price) return;
    await db.items.add({ name, price: parseFloat(price) });
    setName('');
    setPrice('');
    loadItems();
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.price);
  };

  const handleSaveEdit = async (id) => {
    await db.items.update(id, {
      name: editName,
      price: parseFloat(editPrice)
    });
    setEditingId(null);
    loadItems();
  };

  const handleDeleteItem = async (id) => {
    await db.items.delete(id);
    loadItems();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet);

      const parsedItems = rawData
        .map((row) => {
          const keys = Object.keys(row);
          const nameKey = keys.find(k => k.toLowerCase().includes('item') || k.toLowerCase().includes('name'));
          const priceKey = keys.find(k => k.toLowerCase().includes('price') || k.toLowerCase().includes('cost'));

          return {
            name: row[nameKey] ? String(row[nameKey]).trim() : null,
            price: row[priceKey] ? parseFloat(row[priceKey]) : null
          };
        })
        .filter(item => item.name && !isNaN(item.price));

      if (parsedItems.length > 0) {
        await db.items.bulkAdd(parsedItems);
        loadItems();
        alert(`Successfully imported ${parsedItems.length} items!`);
      } else {
        alert('Could not find valid "Item Name" and "Price" columns in the Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    if (items.length === 0) {
      alert('No items to export.');
      return;
    }
    // Format the keys exactly as expected by the import parser: "Item Name" and "Price"
    const exportData = items.map((item) => ({
      'Item Name': item.name,
      'Price': item.price,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock List');
    XLSX.writeFile(workbook, `Stock_List_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleClearCatalog = async () => {
    if (items.length === 0) {
      alert('Stock list is already empty.');
      return;
    }
    if (window.confirm('Are you sure you want to clear the entire stock catalog? This action cannot be undone.')) {
      await db.items.clear();
      loadItems();
    }
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <form onSubmit={handleAddItem} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Add Single Item</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Item Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus size={18} /> Add
            </button>
          </div>
        </form>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Bulk Import via Excel</h2>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
            <Upload size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Upload .xlsx / .csv (Name, Price)</span>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Stock Catalog ({items.length})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
            >
              <Download size={16} /> Export Excel
            </button>
            <button
              onClick={handleClearCatalog}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition cursor-pointer"
            >
              <Trash2 size={16} /> Clear Catalog
            </button>
            <div className="relative w-64">
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase sticky top-0">
              <tr>
                <th className="p-3">Item Name</th>
                <th className="p-3">Price (₹)</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 border rounded"
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="p-3 text-gray-600">
                    {editingId === item.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-24 px-2 py-1 border rounded"
                      />
                    ) : (
                      `₹${item.price.toFixed(2)}`
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {editingId === item.id ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleSaveEdit(item.id)} className="text-green-600 hover:text-green-800">
                          <Check size={18} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleStartEdit(item)} className="text-blue-600 hover:text-blue-800">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-400">No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}