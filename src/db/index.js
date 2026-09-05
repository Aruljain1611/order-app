import Dexie from 'dexie';

export const db = new Dexie('StockOrderDB');

// Defines local storage table for items (auto-incrementing id, name, price)
db.version(1).stores({
  items: '++id, name, price'
});

db.version(2).stores({
  items: '++id, name, price',
  challans: '++id, challanNo, buyerName, date, createdAt'
});