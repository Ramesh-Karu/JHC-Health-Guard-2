import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, collection, query, where, getDocs, orderBy } from '../firebase';
import { useAuth } from '../App';
import { getBreakfastInsights } from '../services/aiService';
import { Award, Calendar, ShoppingBag, TrendingUp } from 'lucide-react';

export default function MyBreakfastReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Reservations
      const qRes = query(
        collection(db, 'breakfast_reservations'), 
        where('userId', '==', user?.id),
        orderBy('sellingDate', 'desc')
      );
      const resSnapshot = await getDocs(qRes);
      const resData = resSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(resData as any);

      // Fetch Purchases (Points)
      const qPur = query(
        collection(db, 'breakfast_purchases'),
        where('userId', '==', user?.id),
        orderBy('date', 'desc')
      );
      const purSnapshot = await getDocs(qPur);
      const purData = purSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPurchases(purData as any);
      
      if (resData.length > 0) {
        const aiInsight = await getBreakfastInsights(resData);
        setInsight(aiInsight);
      }
    } catch (error) {
      console.error("Error fetching breakfast data:", error);
      // Fallback if index is missing or other error
      try {
        const qResBasic = query(collection(db, 'breakfast_reservations'), where('userId', '==', user?.id));
        const resSnapshot = await getDocs(qResBasic);
        setReservations(resSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'breakfast_reservations');
      }
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = purchases.reduce((sum: number, p: any) => sum + (p.pointsAwarded || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Healthy Breakfast</h1>
          <p className="text-slate-500">Track your points, purchases, and reservations.</p>
        </div>
        
        <div className="bg-emerald-500 text-white px-8 py-4 rounded-3xl shadow-lg shadow-emerald-200 flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Total Points</p>
            <p className="text-3xl font-black">{totalPoints}</p>
          </div>
        </div>
      </header>
      
      {insight && (
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-200" />
              <h3 className="font-bold text-xl">Nutritional Progress</h3>
            </div>
            <p className="text-blue-50 leading-relaxed text-lg">{insight}</p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Purchase History & Points */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Purchase History</h2>
          </div>
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {purchases.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {purchases.map((p: any) => (
                  <div key={p.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-100 p-2.5 rounded-xl">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{p.date}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Canteen Purchase</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-600 font-black text-lg">+{p.pointsAwarded}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Points Earned</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-400">No purchase records found yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Reservations */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">My Reservations</h2>
          </div>
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {reservations.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {reservations.map((r: any) => (
                  <div key={r.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <h3 className="font-bold text-slate-900">{r.itemName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-slate-500">{r.quantity} units</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-xs font-medium text-slate-500">{r.sellingDate}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">Rs {r.totalPrice}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        r.status === 'collected' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-400">You haven't made any reservations yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

