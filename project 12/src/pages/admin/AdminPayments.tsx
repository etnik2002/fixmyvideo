import React, { useState, useEffect } from 'react';
// Removed Firebase imports
// import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
// import { db } from '../../firebase';
import { CreditCard, DollarSign, Calendar, AlertTriangle, CheckCircle, XCircle, Search, Filter, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '../../lib/apiClient'; // Import apiClient

interface Payment {
  id: string; // Use id or _id based on API response
  orderId: string;
  userId: string;
  total: number;
  amount: number;
  status: string;
  date: string;
  timestamp: string; // Expect string date from API
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  paymentStatus: string;
}

const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  // User details will be mapped from the API response directly

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch orders (as payments) from API endpoint
        const response = await apiClient.get('/dashboard/admin/orders'); // Use API call
        console.log({response})
        const paymentsData = response.data.map((order: any) => ({ // Map API response
          id: order._id || order.id, // Adjust based on API response field name
          orderId: order.orderId || order._id || order.id,
          userId: order.userId || 'Unbekannt',
          amount: order.total || 0,
          status: order.paymentStatus || (order.status === 'Storniert' ? 'failed' : 'succeeded'),
          date: order.createdAt 
            ? new Date(order.createdAt).toLocaleDateString('de-DE') // Format date string
            : new Date().toLocaleDateString('de-DE'),
          timestamp: order.createdAt || new Date().toISOString(), // Store date string
          paymentMethod: order.paymentMethod || 'card',
          // Assume user details are nested or flattened in the order object from API
          customerName: order.user?.displayName || order.customerName || 'Unbekannt', 
          customerEmail: order.user?.email || order.customerEmail || 'Keine E-Mail'
        }));
          
        setPayments(paymentsData);

      } catch (err: any) {
        console.error('Error fetching payments:', err);
        const message = err.response?.data?.message || err.message || 'Fehler beim Laden der Zahlungen.';
        setError(message);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, []);

  // Filter payments based on search term and filters
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = 
      statusFilter === 'all' || 
      payment.status.toLowerCase() === statusFilter.toLowerCase();
      
    // Date filtering - comparing string dates, might need adjustment if API format differs
    let matchesDate = true;
    const now = new Date();
    const paymentDate = new Date(payment.timestamp); // Parse the timestamp string

    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchesDate = paymentDate >= today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = paymentDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = paymentDate >= monthAgo;
    }
      
    return matchesSearch && matchesStatus && matchesDate;
  });



  let totalRevenue = 0;
  filteredPayments.forEach((p) => {
      console.log({p})
      totalRevenue += p.amount
  })
  console.log({totalRevenue})
  // Format currency
  const formatCurrency = (amount: number) => {
    return `CHF ${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-900/20 to-red-900/10 p-6 rounded-lg border border-red-900/30">
        <h1 className="text-2xl font-medium text-fmv-silk mb-2">Zahlungen</h1>
        <p className="text-fmv-silk/70">Übersicht aller Zahlungen und Transaktionen.</p>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4 text-red-400">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-fmv-carbon-darker p-6 rounded-lg shadow-md border border-fmv-carbon-light/20"
        >
          <div className="flex items-center">
            <div className="bg-green-500/20 p-3 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-fmv-silk/60 text-sm">Gesamtumsatz</p>
              <p className="text-2xl font-medium text-fmv-silk">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-fmv-carbon-darker p-6 rounded-lg shadow-md border border-fmv-carbon-light/20"
        >
          <div className="flex items-center">
            <div className="bg-fmv-orange/20 p-3 rounded-full mr-4">
              <CreditCard className="h-6 w-6 text-fmv-orange" />
            </div>
            <div>
              <p className="text-fmv-silk/60 text-sm">Transaktionen</p>
              <p className="text-2xl font-medium text-fmv-silk">{filteredPayments.length}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-fmv-carbon-darker p-6 rounded-lg shadow-md border border-fmv-carbon-light/20"
        >
          <div className="flex items-center">
            <div className="bg-blue-500/20 p-3 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-fmv-silk/60 text-sm">Durchschnittswert</p>
              <p className="text-2xl font-medium text-fmv-silk">
                {formatCurrency(filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-fmv-carbon-darker p-4 rounded-lg shadow-md border border-fmv-carbon-light/20">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Bestellung oder Kunde suchen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-md bg-fmv-carbon-light/10 border border-fmv-carbon-light/30 text-fmv-silk focus:outline-none focus:ring-1 focus:ring-fmv-orange/50"
            />
          </div>
          
          <div className="relative sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-md bg-fmv-carbon-light/10 border border-fmv-carbon-light/30 text-fmv-silk focus:outline-none focus:ring-1 focus:ring-fmv-orange/50"
            >
              <option value="all">Alle Status</option>
              <option value="succeeded">Erfolgreich</option>
              <option value="failed">Fehlgeschlagen</option>
              <option value="pending">Ausstehend</option>
            </select>
          </div>
          
          <div className="relative sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-md bg-fmv-carbon-light/10 border border-fmv-carbon-light/30 text-fmv-silk focus:outline-none focus:ring-1 focus:ring-fmv-orange/50"
            >
              <option value="all">Alle Zeiträume</option>
              <option value="today">Heute</option>
              <option value="week">Letzte 7 Tage</option>
              <option value="month">Letzter Monat</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Payments Table */}
      <div className="bg-fmv-carbon-darker rounded-lg shadow-md border border-fmv-carbon-light/30 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-fmv-orange border-t-transparent"></div>
            <p className="mt-4 text-fmv-silk/70">Zahlungen werden geladen...</p>
          </div>
        ) : filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-fmv-carbon-light/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fmv-silk/70 uppercase tracking-wider">
                    Bestellung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fmv-silk/70 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fmv-silk/70 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fmv-silk/70 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fmv-silk/70 uppercase tracking-wider">
                    Zahlungsmethode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-fmv-silk/70 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fmv-carbon-light/10">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-fmv-carbon-light/5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-fmv-orange">
                      {payment.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fmv-silk">
                      <div>
                        <p>{payment.customerName}</p>
                        <p className="text-xs text-fmv-silk/60">{payment.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fmv-silk/70">
                      {payment.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fmv-silk">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-fmv-silk">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-fmv-silk/60" />
                        {payment.paymentMethod === 'card' ? 'Kreditkarte' : payment.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center w-fit ${
                        payment.status === 'succeeded'
                          ? 'bg-green-900/20 text-green-400' 
                          : payment.status === 'pending'
                            ? 'bg-yellow-900/20 text-yellow-400'
                            : 'bg-red-900/20 text-red-400'
                      }`}>
                        {payment.status === 'succeeded' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Erfolgreich</>
                        ) : payment.status === 'pending' ? (
                          <><Clock className="h-3 w-3 mr-1" /> Ausstehend</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Fehlgeschlagen</>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="bg-fmv-carbon-light/5 inline-flex rounded-full p-4 mb-4">
              <CreditCard size={24} className="text-fmv-silk/40" />
            </div>
            <h3 className="text-lg font-medium text-fmv-silk mb-2">Keine Zahlungen gefunden</h3>
            <p className="text-fmv-silk/70 mb-4">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Keine Zahlungen entsprechen Ihren Filterkriterien.' 
                : 'Es sind noch keine Zahlungen vorhanden.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;