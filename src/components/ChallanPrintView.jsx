import { forwardRef } from 'react';
import logoImg from '../assets/logo.png';

const COPY_TYPES = [
  { label: 'ORIGINAL FOR RECIPIENT' },
  { label: 'DUPLICATE FOR TRANSPORTER' },
  { label: 'SELLER COPY' },
];

const ChallanPrintView = forwardRef(({ challanData, copyCount = 3 }, ref) => {
  const {
    buyerName = '',
    challanNo = '',
    date = '',
    items = [],
  } = challanData || {};

  const activeCopies = COPY_TYPES.slice(0, copyCount);

  // Compute totals
  const totalQty = items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)),
    0
  );

  // Minimum 8 rows to match standard physical challan slip proportions
  const minRows = 8;
  const displayItems = [...items];
  while (displayItems.length < minRows) {
    displayItems.push({ id: `empty-${displayItems.length}`, isEmpty: true });
  }

  return (
    <div ref={ref} className="challan-print-root bg-white text-black p-2 space-y-6 font-sans">
      {activeCopies.map((copy, copyIdx) => (
        <div
          key={copyIdx}
          className="challan-page border-2 border-black p-4 rounded-none relative bg-white max-w-3xl mx-auto flex flex-col justify-between min-h-[780px] print:min-h-[260mm] page-break-after-always"
        >
          <div>
            {/* Top Bar: Smaller Copy Badge on Right */}
            <div className="flex justify-end items-center border-b border-black pb-1.5 mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 border border-black uppercase tracking-wider text-black bg-white">
                {copy.label}
              </span>
            </div>

            {/* Header Banner */}
            <div className="text-center border-b-2 border-black pb-2 pt-1 relative min-h-[85px] flex flex-col justify-center">
              {/* Battery World Official Logo (Left) */}
              <div className="absolute left-1 top-0 bottom-0 my-auto flex items-center">
                <img
                  src={logoImg}
                  alt="Battery World Logo"
                  className="h-20 w-auto object-contain"
                />
              </div>

              <h3 className="text-[11px] font-bold uppercase tracking-widest text-black">CHALLAN</h3>
              <h1 className="text-2xl font-black text-black tracking-wide uppercase font-serif">
                BATTERY WORLD
              </h1>
              <p className="text-[10px] font-bold text-black tracking-wider">
                AUTHORIZED DISTRIBUTOR OF EXIDE BATTERY
              </p>
              <p className="text-[9.5px] text-black font-medium mt-0.5">
                Add. : Shop No. 1, 1010/39, DDA Flats, Kalkaji, New Delhi-110019
              </p>
              <p className="text-[9.5px] text-black font-bold">
                Mob. : 9311783418
              </p>
            </div>

            {/* Customer & Document Metadata */}
            <div className="py-2 px-1 border-b-2 border-black text-xs flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
              <div className="flex-1 w-full flex items-baseline gap-1">
                <span className="font-bold whitespace-nowrap text-sm text-black">M/s.</span>
                <span className="flex-1 font-semibold text-black border-b border-dotted border-black pb-0.5 px-2 text-sm min-h-[22px]">
                  {buyerName}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 whitespace-nowrap text-xs text-black">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold">Challan No. :</span>
                  <span className="font-bold text-sm text-black border-b border-dotted border-black px-2 min-w-[60px] text-right">
                    {challanNo || '—'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold">Dated :</span>
                  <span className="font-semibold text-black border-b border-dotted border-black px-2 min-w-[80px] text-right">
                    {date || new Date().toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table (Flex container with spacer row extending vertical column lines to the total row) */}
            <div className="mt-1 border border-black flex-1 flex flex-col justify-between min-h-[440px] print:min-h-[175mm]">
              <table className="w-full text-left border-collapse text-xs flex-1 flex flex-col justify-between">
                <thead>
                  <tr className="border-b-2 border-black bg-white text-black font-bold uppercase text-[11px] flex w-full">
                    <th className="py-1.5 px-2 border-r border-black w-12 text-center shrink-0">S.No.</th>
                    <th className="py-1.5 px-3 border-r border-black flex-1">PARTICULARS</th>
                    <th className="py-1.5 px-2 border-r border-black w-16 text-right shrink-0">QTY.</th>
                    <th className="py-1.5 px-2 border-r border-black w-20 text-right shrink-0">RATE</th>
                    <th className="py-1.5 px-3 w-24 text-right shrink-0">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="flex-1 flex flex-col">
                  {items.map((item, idx) => {
                    const lineAmount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);

                    // Process multi-line serial numbers
                    const subtextLines = item.subtext
                      ? String(item.subtext)
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean)
                      : [];

                    return (
                      <tr key={item.id || idx} className="align-top flex w-full">
                        <td className="py-1.5 px-2 border-r border-black text-center font-medium text-black w-12 shrink-0">
                          {idx + 1}.
                        </td>
                        <td className="py-1.5 px-3 border-r border-black flex-1 min-w-0">
                          <div className="font-semibold text-black break-words">{item.name}</div>
                          {/* Indented Multi-line Serial Numbers (supports up to 70 chars with clean wrapping) */}
                          {subtextLines.length > 0 && (
                            <div className="pl-3 mt-0.5 space-y-0.5 max-w-full">
                              {subtextLines.map((snLine, snIdx) => (
                                <div
                                  key={snIdx}
                                  className="text-[10px] font-normal text-black font-mono italic leading-tight break-all whitespace-pre-wrap"
                                >
                                  {snLine}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-1.5 px-2 border-r border-black text-right font-medium text-black w-16 shrink-0">
                          {item.qty}
                        </td>
                        <td className="py-1.5 px-2 border-r border-black text-right font-medium text-black w-20 shrink-0">
                          {item.rate ? parseFloat(item.rate).toFixed(0) : ''}
                        </td>
                        <td className="py-1.5 px-3 text-right font-semibold text-black w-24 shrink-0">
                          {lineAmount ? lineAmount.toFixed(0) : ''}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Spacer Row: Expands to fill remaining height so column lines stretch to total row */}
                  <tr className="flex-1 flex w-full min-h-[50px]">
                    <td className="border-r border-black w-12 shrink-0">&nbsp;</td>
                    <td className="border-r border-black flex-1">&nbsp;</td>
                    <td className="border-r border-black w-16 shrink-0">&nbsp;</td>
                    <td className="border-r border-black w-20 shrink-0">&nbsp;</td>
                    <td className="w-24 shrink-0">&nbsp;</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black font-bold bg-white text-xs text-black flex w-full">
                    <td colSpan={2} className="py-2 px-3 border-r border-black text-right uppercase tracking-wider flex-1">
                      TOTAL
                    </td>
                    <td className="py-2 px-2 border-r border-black text-right font-black text-sm w-16 shrink-0">
                      {totalQty || 0}
                    </td>
                    <td className="py-2 px-2 border-r border-black text-right w-20 shrink-0">
                      &nbsp;
                    </td>
                    <td className="py-2 px-3 text-right font-black text-sm w-24 shrink-0">
                      {totalAmount ? totalAmount.toFixed(0) : '0'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer & Signatures Pinned to Bottom */}
          <div className="mt-6 pt-2 flex justify-between items-end text-xs text-black">
            <div className="space-y-6">
              <span className="font-bold">E. & O.E.</span>
              <div className="pt-8 border-t border-black font-bold min-w-[160px] text-center">
                Receiver's Signature
              </div>
            </div>

            <div className="text-right space-y-6">
              <span className="font-bold">For BATTERY WORLD</span>
              <div className="pt-8 border-t border-black font-bold min-w-[180px] text-center">
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default ChallanPrintView;
