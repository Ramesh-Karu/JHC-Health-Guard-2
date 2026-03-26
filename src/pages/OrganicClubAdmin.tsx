import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from '../firebase';
import { useAuth } from '../App';
import { QrCode } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import Toast from '../components/Toast';

export default function OrganicClubAdmin() {
  const { user } = useAuth();
  const [vegetables, setVegetables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [analytics, setAnalytics] = useState<any>({ totalReservations: 0, totalRevenue: 0, popularVegetables: [] });
  const [formData, setFormData] = useState({ name: '', imageUrl: '', description: '', price: 0, quantity: 0, harvestDate: '', sellingDay: '', nutritionBenefits: '', isOrganic: 1 });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('g');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const vegSnapshot = await getDocs(collection(db, 'vegetables'));
      const vegData = vegSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVegetables(vegData as any);

      const resSnapshot = await getDocs(collection(db, 'organic_reservations'));
      const resData = resSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(resData as any);

      // Calculate analytics
      let totalRevenue = 0;
      const vegCounts: Record<string, number> = {};

      resData.forEach((res: any) => {
        totalRevenue += res.totalPrice || 0;
        vegCounts[res.vegetableName] = (vegCounts[res.vegetableName] || 0) + res.quantity;
      });

      const popularVegetables = Object.entries(vegCounts)
        .map(([name, totalQuantity]) => ({ name, totalQuantity }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5);

      setAnalytics({
        totalReservations: resData.length,
        totalRevenue,
        popularVegetables
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'vegetables/organic_reservations');
    }
  };

  const addVegetable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'vegetables'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      fetchData();
      setToast({ message: 'Vegetable added successfully', type: 'success' });
      setFormData({ name: '', imageUrl: '', description: '', price: 0, quantity: 0, harvestDate: '', sellingDay: '', nutritionBenefits: '', isOrganic: 1 });
    } catch (error) {
      setToast({ message: 'Error adding vegetable', type: 'error' });
      handleFirestoreError(error, OperationType.CREATE, 'vegetables');
    }
  };

  const markCollected = async (id: string) => {
    try {
      await updateDoc(doc(db, 'organic_reservations', id), {
        status: 'Collected',
        weight: weight,
        unit: unit
      });
      setToast({ message: 'Reservation marked as collected', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Error marking reservation', type: 'error' });
      handleFirestoreError(error, OperationType.UPDATE, `organic_reservations/${id}`);
    }
  };

  const deleteVegetable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vegetable?')) return;
    try {
      await deleteDoc(doc(db, 'vegetables', id));
      fetchData();
      setToast({ message: 'Vegetable deleted successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vegetables/${id}`);
    }
  };

  const editVegetable = async (id: string, updatedData: any) => {
    try {
      await updateDoc(doc(db, 'vegetables', id), updatedData);
      fetchData();
      setToast({ message: 'Vegetable updated successfully', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vegetables/${id}`);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Organic Club Admin Panel</h1>
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
        >
          <QrCode size={18} />
          Scan Passbook
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Reservations</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{analytics.totalReservations}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Revenue</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Rs {analytics.totalRevenue}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Popular Vegetable</p>
          <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{analytics.popularVegetables[0]?.name || 'N/A'}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 md:p-6 mb-8">
        <h2 className="text-lg md:text-xl font-bold mb-4 text-slate-900 dark:text-white">Vegetables</h2>
        <div className="space-y-4">
          {vegetables.map((v: any) => (
            <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{v.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Rs {v.price} | {v.quantity} units</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editVegetable(v.id, { ...v, price: v.price + 10 })} className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">Edit</button>
                <button onClick={() => deleteVegetable(v.id)} className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {vegetables.length === 0 && (
            <p className="text-center text-slate-500 dark:text-slate-400 italic py-4">No vegetables found.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-4 text-slate-900 dark:text-white">Reservations</h2>
        <div className="space-y-4">
          {reservations.map((r: any) => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{r.vegetableName} - {r.userName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{r.quantity} units</p>
              </div>
              {r.status === 'Reserved' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input type="number" placeholder="Weight" onChange={e => setWeight(e.target.value)} className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl w-24 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  <select onChange={e => setUnit(e.target.value)} className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                  <button onClick={() => markCollected(r.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm">Mark Collected</button>
                </div>
              ) : (
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto">
                  {r.status}
                </span>
              )}
            </div>
          ))}
          {reservations.length === 0 && (
            <p className="text-center text-slate-500 dark:text-slate-400 italic py-4">No reservations found.</p>
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
