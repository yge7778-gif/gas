import React, { useState } from 'react';
import { ResourceType, Language } from '../types';
import { HelpCircle, Zap, X, Sliders, Check, ArrowRight } from 'lucide-react';
import { formatNumber } from '../utils/tron';
import { getTranslation } from '../utils/i18n';

interface RentalFormProps {
  resourceType: ResourceType;
  setResourceType: (type: ResourceType) => void;
  amount: number;
  setAmount: (val: number) => void;
  durationVal: number;
  setDurationVal: (val: number) => void;
  durationType: '10m' | '1h' | '1d' | '3d' | 'custom';
  setDurationType: (type: '10m' | '1h' | '1d' | '3d' | 'custom') => void;
  language: Language;
}

export const RentalForm: React.FC<RentalFormProps> = ({
  resourceType,
  setResourceType,
  amount,
  setAmount,
  durationVal,
  setDurationVal,
  durationType,
  setDurationType,
  language,
}) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState<'usdt_exist' | 'usdt_new' | 'trx'>('usdt_exist');
  const [transferCount, setTransferCount] = useState<number>(1);

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  // Quick preset amounts
  const energyPresets = [
    { label: '+64.4K', value: 64400 },
    { label: '+130.4K', value: 130400 },
    { label: '+500K', value: 500000 },
    { label: '+1M', value: 1000000 },
    { label: '+5M', value: 5000000 },
  ];

  const bandwidthPresets = [
    { label: '+1K', value: 1000 },
    { label: '+5K', value: 5000 },
    { label: '+10K', value: 10000 },
    { label: '+50K', value: 50000 },
  ];

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0) {
      setAmount(num);
    } else if (raw === '') {
      setAmount(0);
    }
  };

  const handleDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      setDurationVal(num);
    } else if (raw === '') {
      setDurationVal(0);
    }
  };

  const calculateTransfersFromAmount = (): number => {
    if (amount <= 0) return 0;
    return Math.max(1, Math.floor(amount / 64400));
  };

  const applyTransferCalculation = () => {
    let baseEnergy = 64400;
    if (transferType === 'usdt_new') baseEnergy = 130400;
    if (transferType === 'trx') baseEnergy = 32000;

    setAmount(baseEnergy * transferCount);
    setShowTransferModal(false);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-6">
      {/* Resource Type Tabs & Status Badge */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex space-x-6 text-sm font-bold">
          <button
            onClick={() => setResourceType('energy')}
            className={`pb-2 transition-colors relative cursor-pointer ${
              resourceType === 'energy'
                ? 'text-blue-600 font-extrabold border-b-2 border-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t('energy')}
          </button>
          <button
            onClick={() => setResourceType('bandwidth')}
            className={`pb-2 transition-colors relative cursor-pointer ${
              resourceType === 'bandwidth'
                ? 'text-blue-600 font-extrabold border-b-2 border-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t('bandwidth')}
          </button>
        </div>

        <div className="flex items-center space-x-1.5 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-semibold border border-blue-100/60 shadow-2xs">
          <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
          <span>{t('resourcesAbundant')}</span>
        </div>
      </div>

      {/* 租用数量 Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-slate-800 flex items-center space-x-1">
            <span>{t('rentalQuantity')}</span>
            <HelpCircle 
              className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" 
              title="TRON Gas Station"
            />
          </span>
          {resourceType === 'energy' && (
            <span className="text-xs text-slate-500">
              {t('estimatedTransfers')} <strong className="text-slate-800">{calculateTransfersFromAmount()} {t('times')}</strong>{' '}
              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="text-blue-600 hover:underline font-semibold ml-1 cursor-pointer"
              >
                {t('modify')}
              </button>
            </span>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            id="energyAmount"
            value={amount > 0 ? formatNumber(amount) : ''}
            onChange={handleAmountInputChange}
            placeholder={resourceType === 'energy' ? '64,400' : '5,000'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          {amount > 0 && (
            <button
              type="button"
              onClick={() => setAmount(0)}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
          {(resourceType === 'energy' ? energyPresets : bandwidthPresets).map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setAmount(preset.value)}
              className="bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 border border-slate-200 rounded-lg py-2 text-xs font-semibold text-slate-700 transition cursor-pointer active:scale-95"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 租用时间 Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-slate-800 flex items-center space-x-1">
            <span>{t('rentalDuration')}</span>
            <HelpCircle
              className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help"
            />
          </span>
          <span className="text-xs text-slate-400">
            {durationType === '10m' && `10 ${t('mins')}`}
            {durationType === '1h' && `1 ${t('hours')} (60 ${t('mins')})`}
            {durationType === '1d' && `1 ${t('days')} (1440 ${t('mins')})`}
            {durationType === '3d' && `3 ${t('days')} (4320 ${t('mins')})`}
            {durationType === 'custom' && `${durationVal} ${t('mins')}`}
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            id="durationInput"
            value={durationVal > 0 ? durationVal : ''}
            onChange={handleDurationInputChange}
            placeholder="10"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-base font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          <div className="absolute right-3 top-3 text-xs font-medium text-slate-400">
            {t('mins')}
          </div>
        </div>

        {/* Duration Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setDurationType('10m');
              setDurationVal(10);
            }}
            className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              durationType === '10m'
                ? 'bg-blue-50 border border-blue-400 text-blue-600 shadow-2xs'
                : 'bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700'
            }`}
          >
            10m
          </button>
          <button
            type="button"
            onClick={() => {
              setDurationType('1h');
              setDurationVal(60);
            }}
            className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              durationType === '1h'
                ? 'bg-blue-50 border border-blue-400 text-blue-600 shadow-2xs'
                : 'bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700'
            }`}
          >
            1h
          </button>
          <button
            type="button"
            onClick={() => {
              setDurationType('1d');
              setDurationVal(1440);
            }}
            className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              durationType === '1d'
                ? 'bg-blue-50 border border-blue-400 text-blue-600 shadow-2xs'
                : 'bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700'
            }`}
          >
            1d
          </button>
          <button
            type="button"
            onClick={() => {
              setDurationType('3d');
              setDurationVal(4320);
            }}
            className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              durationType === '3d'
                ? 'bg-blue-50 border border-blue-400 text-blue-600 shadow-2xs'
                : 'bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700'
            }`}
          >
            3d
          </button>
          <button
            type="button"
            onClick={() => {
              setDurationType('custom');
              if (durationVal === 10 || durationVal === 60 || durationVal === 1440 || durationVal === 4320) {
                setDurationVal(10080); // 7 days
              }
            }}
            className={`rounded-lg py-2 text-xs font-bold transition cursor-pointer col-span-3 sm:col-span-1 ${
              durationType === 'custom'
                ? 'bg-blue-50 border border-blue-400 text-blue-600 shadow-2xs'
                : 'bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700'
            }`}
          >
            {t('more')}
          </button>
        </div>
      </div>

      {/* Transfer Estimator Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">{t('estimateModalTitle')}</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700">{t('transferTypeLabel')}</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setTransferType('usdt_exist')}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    transferType === 'usdt_exist'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{t('usdtExist')}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{t('usdtExistDesc')}</div>
                  </div>
                  {transferType === 'usdt_exist' && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTransferType('usdt_new')}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    transferType === 'usdt_new'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{t('usdtNew')}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{t('usdtNewDesc')}</div>
                  </div>
                  {transferType === 'usdt_new' && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTransferType('trx')}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    transferType === 'trx'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{t('trxContract')}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{t('trxContractDesc')}</div>
                  </div>
                  {transferType === 'trx' && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('estimatedTransferCount')}</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setTransferCount(Math.max(1, transferCount - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-base"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={transferCount}
                    onChange={(e) => setTransferCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center bg-slate-50 border border-slate-200 rounded-xl py-2 font-bold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setTransferCount(transferCount + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-base"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-500">
                    {t('totalCalculated')}: <strong className="text-blue-600">
                      {formatNumber(
                        (transferType === 'usdt_new' ? 130400 : transferType === 'trx' ? 32000 : 64400) * transferCount
                      )}
                    </strong> {t('energy')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={applyTransferCalculation}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm flex items-center justify-center space-x-1"
              >
                <span>{t('applySettings')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
