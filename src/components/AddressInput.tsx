import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { parseTronAddresses } from '../utils/tron';
import { Clipboard, Trash2, UserCheck, AlertCircle } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface AddressInputProps {
  addressText: string;
  setAddressText: (text: string) => void;
  validAddresses: string[];
  invalidAddresses: string[];
  userWalletAddress: string | null;
  autoActivate: boolean;
  setAutoActivate: (val: boolean) => void;
  language: Language;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  addressText,
  setAddressText,
  validAddresses,
  invalidAddresses,
  userWalletAddress,
  autoActivate,
  setAutoActivate,
  language,
}) => {
  const [showInvalidAlert, setShowInvalidAlert] = useState(false);
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  useEffect(() => {
    setShowInvalidAlert(invalidAddresses.length > 0);
  }, [invalidAddresses]);

  const handleFillMyAddress = () => {
    if (userWalletAddress) {
      setAddressText(userWalletAddress);
    } else {
      setAddressText('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
    }
  };

  const handleFillSampleAddresses = () => {
    const samples = [
      'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
      'TNUC9Qb1rRpS5CbWLmNMxXBjyFioydXjW1',
    ];
    setAddressText(samples.join('\n'));
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAddressText(text);
      }
    } catch (e) {
      // Fallback
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-2">
          {t('receivingAddress')}
        </span>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoActivate}
              onChange={(e) => setAutoActivate(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span>{t('autoActivate')}</span>
          </label>
        </div>
      </div>

      {/* Quick Fill Actions */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={handleFillMyAddress}
          className="bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition font-medium flex items-center space-x-1"
        >
          <UserCheck className="w-3 h-3" />
          <span>{t('fillMyAddress')}</span>
        </button>
        <button
          type="button"
          onClick={handleFillSampleAddresses}
          className="bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition font-medium"
        >
          {t('sampleAddresses')}
        </button>
        <button
          type="button"
          onClick={handlePasteClipboard}
          className="bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg transition font-medium flex items-center space-x-1"
        >
          <Clipboard className="w-3 h-3" />
          <span>{t('paste')}</span>
        </button>
        {addressText && (
          <button
            type="button"
            onClick={() => setAddressText('')}
            className="text-slate-400 hover:text-rose-600 ml-auto px-2 py-1 transition flex items-center space-x-1 text-[11px]"
          >
            <Trash2 className="w-3 h-3" />
            <span>{t('clear')}</span>
          </button>
        )}
      </div>

      {/* Textarea Input */}
      <div>
        <textarea
          rows={3}
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          placeholder={t('addressPlaceholder')}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-slate-400 resize-none font-mono transition"
        />
      </div>

      {/* Invalid Address Warning Banner */}
      {showInvalidAlert && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{t('invalidAddressNotice')}</span>
        </div>
      )}

      {/* Validation Counts */}
      <div className="flex justify-between text-xs text-slate-500 font-medium pt-0.5">
        <span>
          {t('validAddresses')}: <strong className="text-slate-800 font-bold">{validAddresses.length}</strong>/20
        </span>
        <span>
          {t('invalidAddresses')}: <strong className={`font-bold ${invalidAddresses.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {invalidAddresses.length}
          </strong>
        </span>
      </div>
    </div>
  );
};
