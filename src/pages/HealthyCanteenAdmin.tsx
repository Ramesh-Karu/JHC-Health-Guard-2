import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, getDocs, addDoc, updateDoc, setDoc, doc, deleteDoc, query, where, writeBatch, serverTimestamp } from '../firebase';
import { useAuth } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QrCode, Upload, Download, Settings, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import Toast from '../components/Toast';
import Papa from 'papaparse';
import { BreakfastItem, BreakfastSettings, BreakfastPurchase, User } from '../types';

export default function BreakfastClubAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState<BreakfastItem[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<BreakfastPurchase[]>([]);
  const [analytics, setAnalytics] = useState<any>({ totalReservations: 0, totalRevenue: 0, popularItems: [] });
  const [formData, setFormData] = useState({ name: '', imageUrl: '', description: '', price: 0, sellingDate: '', category: '', nutritionInfo: '' });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [settings, setSettings] = useState<BreakfastSettings>({ pointsPerEntry: 10 });
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchSettings();
      fetchPurchases();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDocs(query(collection(db, 'settings'), where('__name__', '==', 'breakfast')));
      if (!settingsDoc.empty) {
        setSettings(settingsDoc.docs[0].data() as BreakfastSettings);
      } else {
        // Initialize settings if not exists
        await setDoc(doc(db, 'settings', 'breakfast'), { pointsPerEntry: 10 });
        setSettings({ pointsPerEntry: 10 });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchPurchases = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'breakfast_purchases'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BreakfastPurchase[];
      setPurchases(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'breakfast_purchases');
    }
  };

  const fetchData = async () => {
    try {
      const itemsSnapshot = await getDocs(collection(db, 'breakfast_items'));
      const itemsData = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BreakfastItem[];
      setItems(itemsData);

      const reservationsSnapshot = await getDocs(collection(db, 'breakfast_reservations'));
      const reservationsData = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(reservationsData);

      // Calculate analytics
      let totalRevenue = 0;
      const itemCounts: Record<string, number> = {};

      reservationsData.forEach((res: any) => {
        totalRevenue += res.totalPrice || 0;
        itemCounts[res.itemName] = (itemCounts[res.itemName] || 0) + res.quantity;
      });

      const popularItems = Object.entries(itemCounts)
        .map(([name, totalQuantity]) => ({ name, totalQuantity }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5);

      setAnalytics({
        totalReservations: reservationsData.length,
        totalRevenue,
        popularItems
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'breakfast_items/reservations');
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'breakfast_items'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      fetchData();
      setToast({ message: 'Item added successfully', type: 'success' });
      setFormData({ name: '', imageUrl: '', description: '', price: 0, sellingDate: '', category: '', nutritionInfo: '' });
      setIsAddingItem(false);
    } catch (error) {
      setToast({ message: 'Error adding item', type: 'error' });
      handleFirestoreError(error, OperationType.CREATE, 'breakfast_items');
    }
  };

  const markCollected = async (id: string) => {
    try {
      await updateDoc(doc(db, 'breakfast_reservations', id), {
        status: 'Collected'
      });
      setToast({ message: 'Reservation marked as collected', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Error marking reservation', type: 'error' });
      handleFirestoreError(error, OperationType.UPDATE, `breakfast_reservations/${id}`);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, 'breakfast_items', id));
      fetchData();
      setToast({ message: 'Item deleted successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `breakfast_items/${id}`);
    }
  };

  const updateSettings = async () => {
    try {
      await updateDoc(doc(db, 'settings', 'breakfast'), { pointsPerEntry: settings.pointsPerEntry });
      setIsEditingSettings(false);
      setToast({ message: 'Settings updated successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error updating settings', type: 'error' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const data = results.data as any[];
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        const batch = writeBatch(db);

        for (const row of data) {
          const indexNumber = row['Index Number'] || row['indexNumber'];
          const date = row['Date'] || row['date'];

          if (!indexNumber || !date) continue;

          try {
            // Check for duplicate entry for same index + date
            const duplicateQuery = query(
              collection(db, 'breakfast_purchases'),
              where('indexNumber', '==', indexNumber),
              where('date', '==', date)
            );
            const duplicateSnapshot = await getDocs(duplicateQuery);

            if (!duplicateSnapshot.empty) {
              skipCount++;
              continue;
            }

            // Find student by index number
            const studentQuery = query(collection(db, 'users'), where('indexNumber', '==', indexNumber));
            const studentSnapshot = await getDocs(studentQuery);

            let userId = null;
            if (!studentSnapshot.empty) {
              const studentDoc = studentSnapshot.docs[0];
              userId = studentDoc.id;
              // Award points to student
              const studentRef = doc(db, 'users', userId);
              batch.update(studentRef, {
                points: (studentDoc.data().points || 0) + settings.pointsPerEntry
              });
            }

            // Record purchase
            const purchaseRef = doc(collection(db, 'breakfast_purchases'));
            batch.set(purchaseRef, {
              indexNumber,
              userId,
              date,
              pointsAwarded: settings.pointsPerEntry,
              createdAt: new Date().toISOString()
            });

            successCount++;
          } catch (err) {
            console.error("Error processing row:", row, err);
            errorCount++;
          }
        }

        try {
          await batch.commit();
          setToast({ 
            message: `Import complete: ${successCount} added, ${skipCount} skipped (duplicates), ${errorCount} errors.`, 
            type: successCount > 0 ? 'success' : 'error' 
          });
          fetchPurchases();
        } catch (err) {
          setToast({ message: 'Error committing batch', type: 'error' });
        }
      }
    });
  };

  const exportPurchases = () => {
    const csvData = purchases.map(p => ({
      'Index Number': p.indexNumber,
      'Date': p.date,
      'Points Awarded': p.pointsAwarded,
      'Created At': p.createdAt
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `breakfast_purchases_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Healthy Canteen Admin</h1>
          <p className="text-sm md:text-base text-slate-500">Manage menu, settings, and student purchases.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
          >
            <QrCode size={18} />
            Scan Passbook
          </button>
        </div>
      </div>
      
      {/* Settings Section */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Settings className="text-slate-400" size={20} />
            <h2 className="text-lg md:text-xl font-bold">Canteen Settings</h2>
          </div>
          {!isEditingSettings ? (
            <button onClick={() => setIsEditingSettings(true)} className="text-blue-600 font-medium flex items-center gap-1 text-sm">
              <Edit2 size={16} /> Edit
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setIsEditingSettings(false)} className="text-slate-500 font-medium text-sm">Cancel</button>
              <button onClick={updateSettings} className="text-emerald-600 font-medium flex items-center gap-1 text-sm">
                <Save size={16} /> Save
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Points Gained Per Entry</label>
            <input 
              type="number" 
              disabled={!isEditingSettings}
              value={settings.pointsPerEntry}
              onChange={(e) => setSettings({...settings, pointsPerEntry: parseInt(e.target.value)})}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
            />
            <p className="text-xs text-slate-500 mt-2">Number of points awarded to a student for each breakfast purchase recorded.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border">
          <p className="text-sm text-slate-500 mb-1">Total Reservations</p>
          <p className="text-2xl md:text-3xl font-bold">{analytics.totalReservations}</p>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border">
          <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
          <p className="text-2xl md:text-3xl font-bold">Rs {analytics.totalRevenue}</p>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-slate-500 mb-1">Total Purchase Records</p>
          <p className="text-2xl md:text-3xl font-bold">{purchases.length}</p>
        </div>
      </div>

      {/* Import/Export Section */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-lg md:text-xl font-bold">Student Purchase Records</h2>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={exportPurchases}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Download size={18} /> Export
            </button>
            <label className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm">
              <Upload size={18} /> Import
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
        
        <div className="overflow-x-auto -mx-5 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-5 pb-3 font-semibold">Index</th>
                  <th className="px-5 pb-3 font-semibold">Date</th>
                  <th className="px-5 pb-3 font-semibold">Points</th>
                  <th className="px-5 pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.slice(0, 5).map((p) => (
                  <tr key={p.id} className="text-sm hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">{p.indexNumber}</td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{p.date}</td>
                    <td className="px-5 py-4 text-emerald-600 font-bold">+{p.pointsAwarded}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.userId ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.userId ? 'Linked' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-slate-400 italic">No purchase records found. Import a CSV to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {purchases.length > 5 && (
          <p className="text-xs text-slate-400 mt-4 text-center">Showing latest 5 records. Export CSV to view all.</p>
        )}
      </div>

      {/* Menu Management */}
      <div className="bg-white rounded-2xl shadow-sm border p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-lg md:text-xl font-bold">Healthy Canteen Menu</h2>
          <button 
            onClick={() => setIsAddingItem(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>

        {isAddingItem && (
          <form onSubmit={addItem} className="mb-8 p-5 md:p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Item Name</label>
                <input 
                  placeholder="e.g. Fresh Fruit Bowl" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Image URL</label>
                <input 
                  placeholder="https://..." 
                  value={formData.imageUrl} 
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Price (Rs)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Category</label>
                <input 
                  placeholder="e.g. Breakfast, Snack" 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Description</label>
              <textarea 
                placeholder="Brief description of the item..." 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsAddingItem(false)} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
              <button type="submit" className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-100">Save Item</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors group">
              <img src={i.imageUrl} alt={i.name} className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-xl shadow-sm" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{i.name}</h3>
                <p className="text-sm text-slate-500">Rs {i.price} • {i.category}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => deleteItem(i.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="sm:col-span-2 py-12 text-center text-slate-400 italic">No menu items added yet.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-5 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-6">Recent Reservations</h2>
        <div className="space-y-4">
          {reservations.slice(0, 10).map((r: any) => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-50 last:border-0 gap-4">
              <div>
                <h3 className="font-bold text-slate-900">{r.itemName}</h3>
                <p className="text-sm text-slate-600 font-medium">{r.userName}</p>
                <p className="text-xs text-slate-400 mt-1">{r.quantity} units • Rs {r.totalPrice}</p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.status === 'Collected' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {r.status}
                </span>
                {r.status === 'Reserved' && (
                  <button onClick={() => markCollected(r.id)} className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-emerald-50 hover:bg-emerald-600 transition-colors">Collect</button>
                )}
              </div>
            </div>
          ))}
          {reservations.length === 0 && (
            <div className="py-12 text-center text-slate-400 italic">No recent reservations.</div>
          )}
        </div>
      </div>

      {isScannerOpen && <QRScanner onClose={() => setIsScannerOpen(false)} />}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
