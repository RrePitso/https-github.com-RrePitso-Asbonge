import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChartIcon, UtensilsIcon, TruckIcon } from '../components/Icons';

const DAILY_DATA = [
  { name: 'Mon', orders: 45, revenue: 4500 },
  { name: 'Tue', orders: 52, revenue: 5200 },
  { name: 'Wed', orders: 48, revenue: 4800 },
  { name: 'Thu', orders: 61, revenue: 6100 },
  { name: 'Fri', orders: 85, revenue: 10500 },
  { name: 'Sat', orders: 95, revenue: 12000 },
  { name: 'Sun', orders: 70, revenue: 8000 },
];

const CATEGORY_DATA = [
  { name: 'Food Delivery', value: 75 },
  { name: 'Parcels', value: 25 },
];

const COLORS = ['#E63946', '#457B9D'];

const AdminPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
             <BarChartIcon className="w-8 h-8 text-brand-dark" />
             Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Overview of Asbonge Eats performance in West Rand</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-bold text-brand-dark">System Online</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase">Total Revenue (Weekly)</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">R 51,100</h3>
          <span className="text-green-500 text-sm font-bold">+12% from last week</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase">Active Orders</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">14</h3>
          <span className="text-brand-blue text-sm font-bold">8 Food, 6 Parcels</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase">Active Drivers</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">28</h3>
          <span className="text-gray-400 text-sm">In West Rand District</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DAILY_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R${value/1000}k`}/>
              <Tooltip 
                formatter={(value: number) => [`R ${value}`, 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="revenue" fill="#1D3557" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Service Distribution</h3>
          <div className="flex-grow flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
             {CATEGORY_DATA.map((entry, index) => (
               <div key={index} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                 <span className="text-sm text-gray-600">{entry.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              <tr>
                <td className="px-6 py-4 font-mono">#ORD-209</td>
                <td className="px-6 py-4">Thabo M.</td>
                <td className="px-6 py-4"><span className="flex items-center gap-1"><UtensilsIcon className="w-3 h-3"/> Food</span></td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Preparing</span></td>
                <td className="px-6 py-4 font-bold">R 185.00</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-mono">#PAR-882</td>
                <td className="px-6 py-4">Sarah L.</td>
                <td className="px-6 py-4"><span className="flex items-center gap-1"><TruckIcon className="w-3 h-3"/> Parcel</span></td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">In Transit</span></td>
                <td className="px-6 py-4 font-bold">R 60.00</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-mono">#ORD-208</td>
                <td className="px-6 py-4">Lerato K.</td>
                <td className="px-6 py-4"><span className="flex items-center gap-1"><UtensilsIcon className="w-3 h-3"/> Food</span></td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Delivered</span></td>
                <td className="px-6 py-4 font-bold">R 240.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;