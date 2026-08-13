import React, { useState } from 'react';
import { InventoryItem, UserRole } from '../types';
import { 
  Pill, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Layers, 
  DollarSign, 
  X,
  Trash2
} from 'lucide-react';

interface InventorySectionProps {
  userRole?: UserRole;
  inventory: InventoryItem[];
  onAddItem: (item: Partial<InventoryItem>) => void;
  onDeleteItem?: (id: string) => void;
  searchQuery: string;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  userRole = 'admin',
  inventory,
  onAddItem,
  onDeleteItem,
  searchQuery,
}) => {
  const canManageInventory = userRole === 'admin' || userRole === 'staff';
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'أدوية' as InventoryItem['category'],
    quantity: 50,
    minStockAlert: 20,
    price: 30,
    batchNumber: 'BT-' + Math.floor(10000 + Math.random() * 90000),
    expiryDate: '2027-12-31',
    unit: 'علبة',
    manufacturer: 'شركة الدواء الوطنية',
  });

  const query = (localSearch || searchQuery).toLowerCase();

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = 
      item.itemName.toLowerCase().includes(query) ||
      item.batchNumber.toLowerCase().includes(query) ||
      item.manufacturer.toLowerCase().includes(query);

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName) return;

    onAddItem({
      itemName: formData.itemName,
      category: formData.category,
      quantity: Number(formData.quantity),
      minStockAlert: Number(formData.minStockAlert),
      price: Number(formData.price),
      batchNumber: formData.batchNumber,
      expiryDate: formData.expiryDate,
      unit: formData.unit,
      manufacturer: formData.manufacturer,
    });

    setShowAddModal(false);
    setFormData({
      itemName: '',
      category: 'أدوية',
      quantity: 50,
      minStockAlert: 20,
      price: 30,
      batchNumber: 'BT-' + Math.floor(10000 + Math.random() * 90000),
      expiryDate: '2027-12-31',
      unit: 'علبة',
      manufacturer: 'شركة الدواء الوطنية',
    });
  };

  const lowStockCount = inventory.filter(i => i.status === 'منخفض' || i.quantity <= i.minStockAlert).length;

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white">إدارة الصيدلية والمستودع الطبي</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            متابعة الأصناف والكميات، أرقام التشغيلات، تنبيهات النقص التلقائية، وتواريخ انتهاء الصلاحية
          </p>
        </div>

        {canManageInventory && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف دواء / توريد جديد</span>
          </button>
        )}
      </div>

      {/* Low Stock Highlight Alert Banner if needed */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-200 flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">تنبيه نظام الصيدلية والتوريد:</p>
            <p>يوجد عدد <span className="font-bold underline">{lowStockCount} أدوية/مستلزمات</span> وصل مخزونها للحد الأدنى المحذر منه باللون الأحمر بالجدول أدناد.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative sm:col-span-2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث باسم الدواء، رقم التشغيلة (Batch)، أو الشركة المصنعة..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="all">كافة الفئات (أدوية، مستلزمات، معدات...)</option>
          <option value="أدوية">أدوية وعقاقير</option>
          <option value="مستلزمات طبية">مستلزمات أدوات طبية</option>
          <option value="محلول وقائي">محاليل وسوائل طبية</option>
          <option value="معدات">معدات حماية</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 font-bold border-b border-slate-700 whitespace-nowrap">
              <tr>
                <th className="p-4">اسم الدواء / الصنف</th>
                <th className="p-4">الفئة</th>
                <th className="p-4">الكمية المتوفرة</th>
                <th className="p-4">حد التنبيه (Min)</th>
                <th className="p-4">سعر الوحدة</th>
                <th className="p-4">رقم التشغيلة (Batch)</th>
                <th className="p-4">تاريخ الصلاحية</th>
                <th className="p-4">الشركة المصنعة</th>
                <th className="p-4">حالة المخزون</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    لا توجد أدوية مطابقة للبحث الحسابي حالياً.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.status === 'منخفض' || item.quantity <= item.minStockAlert;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isLow ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="p-4 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${isLow ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></div>
                          <span>{item.itemName}</span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {item.category}
                        </span>
                      </td>

                      <td className="p-4 font-mono font-bold text-sm whitespace-nowrap">
                        <span className={isLow ? 'text-rose-400 font-black' : 'text-slate-100'}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-400 whitespace-nowrap">
                        {item.minStockAlert} {item.unit}
                      </td>

                      <td className="p-4 font-bold text-emerald-400 font-mono whitespace-nowrap">
                        {item.price.toLocaleString('ar-SY')} ل.س
                      </td>

                      <td className="p-4 font-mono text-slate-300 whitespace-nowrap">
                        {item.batchNumber}
                      </td>

                      <td className="p-4 font-mono text-slate-300 whitespace-nowrap">
                        {item.expiryDate}
                      </td>

                      <td className="p-4 text-slate-400 whitespace-nowrap">
                        {item.manufacturer}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap ${
                          isLow
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isLow ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                          <span>{isLow ? 'مخزون منخفض' : 'متوفر'}</span>
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {onDeleteItem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteItem(item.id);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                            title="حذف الصنف من المستودع"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl text-right p-6 space-y-6 text-slate-200">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" />
                <span>إضافة صنف دواء / مستلزم جديد</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الصنف الدوائي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: باراسيتامول 500 ملجم"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الفئة *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="أدوية">أدوية وعقاقير</option>
                    <option value="مستلزمات طبية">مستلزمات طبية</option>
                    <option value="محلول وقائي">محاليل وسوائل</option>
                    <option value="معدات">معدات حماية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الوحدة *</label>
                  <input
                    type="text"
                    required
                    placeholder="علبة، شريط، عبوة..."
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الكمية *</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">حد التنبيه (Min)</label>
                  <input
                    type="number"
                    required
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">سعر الوحدة (ل.س)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم التشغيلة (Batch No)</label>
                  <input
                    type="text"
                    required
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ انتهاء الصلاحية</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الشركة المصنعة</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold shadow-lg shadow-sky-600/30"
                >
                  إضافة المخزون
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
