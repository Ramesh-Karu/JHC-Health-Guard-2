import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, getDocs, addDoc, updateDoc, doc, increment } from '../firebase';
import { useAuth } from '../App';
import Toast from '../components/Toast';

export default function BreakfastMarketplace() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [quantities, setQuantities] = useState<any>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'breakfast_items'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'breakfast_items');
    }
  };

  const reserve = async (item: any) => {
    try {
      const quantity = quantities[item.id] || 1;
      
      if (quantity > item.quantity) {
        alert('Not enough quantity available');
        return;
      }

      const totalPrice = item.price * quantity;

      await addDoc(collection(db, 'breakfast_reservations'), {
        userId: user?.id,
        userName: (user as any)?.fullName || 'Unknown',
        itemId: item.id,
        itemName: item.name,
        quantity,
        totalPrice,
        status: 'Reserved',
        createdAt: new Date().toISOString()
      });

      // Decrement item quantity
      const itemRef = doc(db, 'breakfast_items', item.id);
      await updateDoc(itemRef, {
        quantity: increment(-quantity)
      });

      setToast({ message: 'Reserved successfully!', type: 'success' });
      fetchItems();
    } catch (error) {
      setToast({ message: 'Error reserving item', type: 'error' });
      handleFirestoreError(error, OperationType.CREATE, 'breakfast_reservations');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Healthy Canteen</h1>
          <p className="text-slate-500">Pre-order your healthy breakfast from the canteen.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((i: any) => (
          <div key={i.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
            <div className="relative h-48">
              <img src={i.imageUrl} alt={i.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-emerald-600 shadow-sm">
                Rs {i.price}
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-slate-900">{i.name}</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                    {i.category || 'Breakfast'}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{i.description}</p>
                {i.nutritionInfo && (
                  <div className="bg-emerald-50 p-3 rounded-xl mb-4">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Nutrition Info</p>
                    <p className="text-xs text-emerald-700">{i.nutritionInfo}</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center bg-slate-100 rounded-xl p-1">
                  <button 
                    onClick={() => setQuantities({...quantities, [i.id]: Math.max(1, (quantities[i.id] || 1) - 1)})}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-slate-900">{quantities[i.id] || 1}</span>
                  <button 
                    onClick={() => setQuantities({...quantities, [i.id]: (quantities[i.id] || 1) + 1})}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition-colors"
                  >
                    +
                  </button>
                </div>
                <button 
                  onClick={() => reserve(i)} 
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm shadow-emerald-200"
                >
                  Reserve
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {items.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-500">The canteen menu is currently empty. Check back later!</p>
        </div>
      )}
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
