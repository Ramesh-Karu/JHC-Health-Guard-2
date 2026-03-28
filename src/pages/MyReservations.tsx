import React from 'react';
import { useAuth } from '../App';
import { LoginPrompt } from '../components/LoginPrompt';
import { useMyReservations } from '../lib/queries';

export default function MyReservations() {
  const { user } = useAuth();
  const { data: reservations = [], isLoading: loading } = useMyReservations(user?.id || '');

  // Calculate stats
  let totalSpent = 0;
  reservations.forEach((r: any) => {
    totalSpent += r.totalPrice || 0;
  });

  let badge = 'Seedling';
  if (totalSpent > 1000) badge = 'Harvester';
  if (totalSpent > 5000) badge = 'Master Farmer';

  const stats = {
    totalSpent,
    reservationCount: reservations.length,
    badge
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold mb-6">My Reservations</h1>
      
      {!user && (
        <LoginPrompt 
          title="My Reservations"
          description="Login to view your organic vegetable reservations and track your consumption badges."
        />
      )}

      {user && (
        <>
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mb-6">
            <h2 className="font-bold text-emerald-800">Organic Consumption Badge</h2>
            <p className="text-3xl font-bold text-emerald-600">{stats.badge}</p>
            <p className="text-sm text-emerald-700">Total Spent: Rs {stats.totalSpent} | Reservations: {stats.reservationCount}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6">
            {loading ? (
              <p>Loading reservations...</p>
            ) : (
              reservations.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b">
                  <div>
                    <h3 className="font-bold">{r.vegetableName}</h3>
                    <p className="text-sm text-slate-500">Reserved: {r.quantity} units</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Rs {r.totalPrice}</p>
                    <p className="text-sm text-slate-500">{r.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
