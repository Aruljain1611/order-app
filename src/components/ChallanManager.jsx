import { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import ChallanPrintView from './ChallanPrintView';
import { Search, Plus, Trash2, Printer, Download, Save, History, Layers, X, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export default function ChallanManager() {
  const [catalog, setCatalog] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [challanNo, setChallanNo] = useState('406');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = String(today.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  });
  const [copyCount, setCopyCount] = useState(3);
  const [items, setItems] = useState([]);

  // History state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedChallans, setSavedChallans] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const printViewRef = useRef(null);

  useEffect(() => {
    loadCatalog();
    loadHistory();
  }, []);

  const loadCatalog = async () => {
    const allItems = await db.items.toArray();
    setCatalog(allItems);
  };

  const loadHistory = async () => {
    const allChallans = await db.challans.orderBy('createdAt').reverse().toArray();
    setSavedChallans(allChallans);
  };

  const handleAddItemFromStock = (stockItem) => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: stockItem.name,
        subtext: '',
        qty: 1,
        rate: stockItem.price || 0,
      },
    ]);
    setSearchTerm('');
  };

  const handleAddCustomItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: '',
        subtext: '',
        qty: 1,
        rate: '',
      },
    ]);
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Auto calculate totals
  const totalQty = items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)),
    0
  );

  // Auto save helper
  const autoSaveChallanInternal = async () => {
    if (!buyerName.trim() && items.length === 0) return;

    const challanRecord = {
      challanNo,
      buyerName,
      date,
      items,
      totalQty,
      totalAmount,
      copyCount,
      createdAt: new Date().toISOString(),
    };

    await db.challans.add(challanRecord);
    await loadHistory();
  };

  const handleSaveChallan = async () => {
    if (!buyerName.trim()) {
      alert('Please enter Buyer Name (M/s.)');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    await autoSaveChallanInternal();
    alert(`Challan No. ${challanNo} saved successfully!`);
  };

  const handleLoadChallan = (saved) => {
    setBuyerName(saved.buyerName || '');
    setChallanNo(saved.challanNo || '');
    setDate(saved.date || '');
    setCopyCount(saved.copyCount || 3);
    setItems(saved.items || []);
    setHistoryOpen(false);
  };

  const handleDeleteChallan = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this challan from history?')) {
      await db.challans.delete(id);
      loadHistory();
    }
  };

  const handlePrint = async () => {
    await autoSaveChallanInternal();
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printViewRef.current) return;
    setIsExporting(true);
    await autoSaveChallanInternal();

    try {
      const pageElements = printViewRef.current.querySelectorAll('.challan-page');
      if (!pageElements.length) throw new Error('No pages found');

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      for (let i = 0; i < pageElements.length; i++) {
        const el = pageElements[i];
        const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;

        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      }

      pdf.save(`Challan_${challanNo || 'BW'}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Could not download PDF directly. Opening print dialog to Save as PDF instead.');
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const searchResults = searchTerm
    ? catalog.filter((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const challanData = { buyerName, challanNo, date, items };

  return (
    <div className="space-y-6">
      {/* Top Header Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" size={24} /> Delivery Challan Manager
          </h2>
          <p className="text-xs text-gray-500">Create, customize, print & save Battery World delivery challans</p>
        </div>

        {/* Copy Selector Toggle & History Button */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Copy Count Selector */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            <span className="text-xs font-semibold text-gray-600 px-2 flex items-center gap-1">
              <Layers size={14} /> Copies:
            </span>
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => setCopyCount(num)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  copyCount === num
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {num} {num === 1 ? 'Copy' : 'Copies'}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (items.length > 0 && window.confirm('Clear form and start a new challan?')) {
                setBuyerName('');
                setItems([]);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 transition"
          >
            <Plus size={16} /> New Challan
          </button>

          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 transition"
          >
            <History size={16} /> Saved ({savedChallans.length})
          </button>
        </div>
      </div>

      {/* Main Input Form */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Form Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4 no-print">
          {/* Buyer & Metadata Card */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2">
              Challan Details
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">M/s. (Buyer Name)</label>
              <input
                type="text"
                placeholder="e.g. INTERPEY TRADING CORPORATION"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Challan Number</label>
                <input
                  type="text"
                  placeholder="e.g. 406"
                  value={challanNo}
                  onChange={(e) => setChallanNo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Dated</label>
                <input
                  type="text"
                  placeholder="D/M/YY"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Add Item Card */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 relative">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2">
              Add Items from Stock
            </h3>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search stock item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.map((stockItem) => (
                    <button
                      key={stockItem.id}
                      onClick={() => handleAddItemFromStock(stockItem)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 flex justify-between items-center text-xs"
                    >
                      <span className="font-semibold text-gray-800">{stockItem.name}</span>
                      <span className="text-gray-500 font-medium">₹{stockItem.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleAddCustomItem}
              className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 font-semibold text-xs py-2 rounded-lg transition flex items-center justify-center gap-1"
            >
              <Plus size={16} /> Add Custom Item Line
            </button>
          </div>

          {/* Active Items Input List */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                Challan Items ({items.length})
              </h3>
              <span className="text-xs text-gray-500 font-medium">QTY & RATE</span>
            </div>

            {items.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">
                No items added yet. Search stock above or add a custom row.
              </p>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-600 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder="Item Particulars / Name"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="flex-1 px-2 py-1 border rounded bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Multi-line Serial Numbers Textarea */}
                    <div className="pl-6 space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500">
                        Serial Numbers (1 per line):
                      </label>
                      <textarea
                        rows={Math.max(2, String(item.subtext || '').split('\n').length)}
                        placeholder={'EX123456\nEX123457\nEX123458'}
                        value={item.subtext}
                        onChange={(e) => updateItem(item.id, 'subtext', e.target.value)}
                        className="w-full px-2 py-1 border rounded bg-white text-[11px] font-mono text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Qty & Rate Row */}
                    <div className="pl-6 flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-gray-500 font-bold">QTY:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                          className="w-16 px-2 py-1 border rounded bg-white font-bold text-center"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-gray-500 font-bold">RATE (₹):</span>
                        <input
                          type="number"
                          step="1"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                          className="w-20 px-2 py-1 border rounded bg-white font-bold text-right"
                        />
                      </div>
                      <div className="ml-auto text-right font-bold text-blue-600">
                        ₹{((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toFixed(0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals Summary */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Total Quantity:</span>
                  <span className="font-bold text-gray-900">{totalQty} units</span>
                </div>
                <div className="flex justify-between text-sm font-black text-blue-600 border-t pt-1">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount.toFixed(0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions Buttons */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-xs shadow-sm"
              >
                <Printer size={16} /> Print / Save PDF
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="bg-blue-800 text-white py-2.5 rounded-xl font-bold hover:bg-blue-900 transition flex items-center justify-center gap-2 text-xs shadow-sm disabled:opacity-50"
              >
                <Download size={16} /> {isExporting ? 'Generating...' : 'Download PDF'}
              </button>
            </div>

            <button
              onClick={handleSaveChallan}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 text-xs shadow-sm"
            >
              <Save size={16} /> Save Challan to History
            </button>
          </div>
        </div>

        {/* Live Challan Preview Column (7 cols) - Sticky so it stays visible while scrolling form */}
        <div className="lg:col-span-7 space-y-3 lg:sticky lg:top-20 self-start">
          <div className="bg-gray-100 p-2 rounded-xl border border-gray-200 flex justify-between items-center no-print">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider px-2">
              Live Printable Preview ({copyCount} {copyCount === 1 ? 'Copy' : 'Copies'})
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              Black & White Printable Template
            </span>
          </div>

          {/* Render printable template */}
          <div className="bg-gray-200 p-3 rounded-xl max-h-[85vh] overflow-y-auto border border-gray-300 shadow-inner">
            <ChallanPrintView
              ref={printViewRef}
              challanData={challanData}
              copyCount={copyCount}
            />
          </div>
        </div>
      </div>

      {/* History Drawer Modal */}
      {historyOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <History size={18} className="text-blue-600" /> Saved Delivery Challans
              </h3>
              <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {savedChallans.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-8">No saved challans in database yet.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {savedChallans.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => handleLoadChallan(ch)}
                    className="p-3 border rounded-lg hover:border-blue-600 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600 text-sm">Challan #{ch.challanNo}</span>
                        <span className="text-[11px] text-gray-500">({ch.date})</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 mt-0.5">{ch.buyerName}</p>
                      <p className="text-[11px] text-gray-500">
                        {ch.items?.length || 0} items | Total: ₹{ch.totalAmount?.toFixed(0)}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDeleteChallan(ch.id, e)}
                      className="text-red-400 hover:text-red-600 p-1.5"
                      title="Delete saved challan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
