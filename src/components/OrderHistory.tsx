import React, { useState } from 'react';
import { RentalOrder, Language } from '../types';
import { shortenAddress, formatNumber } from '../utils/tron';
import { ExternalLink, RefreshCw, Layers, CheckCircle2, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface OrderHistoryProps {
  orders: RentalOrder[];
  onReOrder?: (order: RentalOrder) => void;
  language: Language;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, onReOrder, language }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const filteredOrders = orders.filter((order) => {
    if (filter === 'active') return order.status === 'active' || order.status === 'pending';
    if (filter === 'completed') return order.status === 'completed' || order.status === 'failed';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-100 space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <span>{t('orderHistory')}</span>
          {orders.length > 0 && (
            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {orders.length}
            </span>
          )}
        </div>

        {orders.length > 0 && (
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'all' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('all')}
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'active' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('active')}
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'completed' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('completed')}
            </button>
          </div>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl relative shadow-inner">
            <Layers className="w-9 h-9 text-slate-300" />
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-slate-300 text-white rounded-full flex items-center justify-center text-xs font-bold">
              ✕
            </div>
          </div>
          <div className="text-sm font-medium text-slate-400">{t('noData')}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800 font-mono">{order.id}</span>
                  <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">
                    {order.resourceType === 'energy' ? t('energy') : t('bandwidth')}
                  </span>
                </div>
                <div>
                  {order.status === 'active' && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[11px] flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{t('active')}</span>
                    </span>
                  )}
                  {order.status === 'pending' && (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-[11px]">
                      {t('delegating')}
                    </span>
                  )}
                  {order.status === 'completed' && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium text-[11px]">
                      {t('ended')}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1 border-y border-slate-200/50">
                <div>
                  <div className="text-slate-400">{t('quantity')}</div>
                  <div className="font-bold text-slate-800">{formatNumber(order.amountPerAddress)}</div>
                </div>
                <div>
                  <div className="text-slate-400">{t('duration')}</div>
                  <div className="font-bold text-slate-800">{order.durationMinutes} {t('mins')}</div>
                </div>
                <div>
                  <div className="text-slate-400">{t('targetAddress')}</div>
                  <div className="font-bold text-slate-800 font-mono">
                    {order.addresses.length > 1
                      ? `${order.addresses.length} addrs`
                      : shortenAddress(order.addresses[0] || '', 4)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">{t('cost')}</div>
                  <div className="font-bold text-blue-600">{order.totalCost} TRX</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>{order.createdAt}</span>
                {order.txHash && (
                  <a
                    href={`https://tronscan.org/#/transaction/${order.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center space-x-0.5"
                  >
                    <span>{t('txHash')}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
