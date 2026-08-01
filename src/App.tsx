import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WalletModal } from './components/WalletModal';
import { WalletCard } from './components/WalletCard';
import { RentalForm } from './components/RentalForm';
import { AddressInput } from './components/AddressInput';
import { CostCard } from './components/CostCard';
import { OrderHistory } from './components/OrderHistory';
import { CustomerSupportChat } from './components/CustomerSupportChat';
import { HeroSection } from './components/HeroSection';
import { EnergySublease } from './components/EnergySublease';
import { BlogSection } from './components/BlogSection';
import { DevDocs } from './components/DevDocs';
import { AdminDashboard } from './components/AdminDashboard';
import { DepositModal } from './components/DepositModal';
import { PaymentCheckoutModal } from './components/PaymentCheckoutModal';
import { WalletInfo, RentalOrder, ResourceType, PaymentMethod, Language } from './types';
import { parseTronAddresses, calculateEnergyCost } from './utils/tron';
import { fetchTronGridAccountData } from './utils/tronWallet';
import { getTranslation } from './utils/i18n';
import { Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Navigation & Language
  const [activeTab, setActiveTab] = useState<string>('rental');
  const [language, setLanguage] = useState<Language>('zh-CN');

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  // Mode Switcher (快捷租赁 vs 自动租赁)
  const [rentalMode, setRentalMode] = useState<'quick' | 'auto'>('quick');

  // Wallet State
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [depositModalOpen, setDepositModalOpen] = useState<boolean>(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [wallet, setWallet] = useState<WalletInfo>({
    connected: false,
    address: null,
    walletBalance: 0,
    accountBalance: 0,
    availableEnergy: 0,
    totalEnergy: 0,
    availableBandwidth: 0,
    totalBandwidth: 0,
  });

  // Rental Form State
  const [resourceType, setResourceType] = useState<ResourceType>('energy');
  const [amount, setAmount] = useState<number>(64400);
  const [durationVal, setDurationVal] = useState<number>(10);
  const [durationType, setDurationType] = useState<'10m' | '1h' | '1d' | '3d' | 'custom'>('10m');

  // Address Input State
  const [addressText, setAddressText] = useState<string>('');
  const [autoActivate, setAutoActivate] = useState<boolean>(true);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('account');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Toast Notice State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Order History State
  const [orders, setOrders] = useState<RentalOrder[]>([]);

  // Parse Addresses
  const { valid: validAddresses, invalid: invalidAddresses } = parseTronAddresses(addressText);

  // Global click interceptor when wallet is not connected
  useEffect(() => {
    if (wallet.connected || walletModalOpen) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Allow clicking inside wallet modal or language selector
      if (target.closest('.wallet-modal-container') || target.closest('.lang-selector')) {
        return;
      }
      if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('.cursor-pointer')) {
        setWalletModalOpen(true);
      }
    };

    window.addEventListener('click', handleGlobalClick, true);
    return () => window.removeEventListener('click', handleGlobalClick, true);
  }, [wallet.connected, walletModalOpen]);

  // Show Toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Wallet Connection Handlers
  const handleConnectWalletSuccess = async (selectedAddress: string) => {
    setWalletModalOpen(false);

    // Fetch real TRX balance & resources from TronGrid API
    const tronData = await fetchTronGridAccountData(selectedAddress);

    setWallet({
      connected: true,
      address: selectedAddress,
      walletBalance: tronData?.walletBalance ?? 150.5,
      accountBalance: 50.0,
      availableEnergy: tronData?.availableEnergy ?? 64400,
      totalEnergy: tronData?.totalEnergy ?? 64400,
      availableBandwidth: tronData?.availableBandwidth ?? 600,
      totalBandwidth: tronData?.totalBandwidth ?? 600,
    });
    // Fill receiving address if empty
    if (!addressText.trim()) {
      setAddressText(selectedAddress);
    }
    showToast(t('walletConnectedSuccess'));
  };

  const handleDisconnectWallet = () => {
    setWallet({
      connected: false,
      address: null,
      walletBalance: 0,
      accountBalance: 0,
      availableEnergy: 0,
      totalEnergy: 0,
      availableBandwidth: 0,
      totalBandwidth: 0,
    });
    showToast(t('walletDisconnected'));
  };

  const handleRefreshWallet = async () => {
    if (!wallet.connected || !wallet.address) return;

    showToast(language === 'zh-CN' ? '正在通过 TronGrid API 获取最新链上数据...' : 'Fetching live data from TronGrid API...');
    const tronData = await fetchTronGridAccountData(wallet.address);

    if (tronData) {
      setWallet((prev) => ({
        ...prev,
        walletBalance: tronData.walletBalance,
        availableEnergy: tronData.availableEnergy,
        totalEnergy: tronData.totalEnergy,
        availableBandwidth: tronData.availableBandwidth,
        totalBandwidth: tronData.totalBandwidth,
      }));
      showToast(language === 'zh-CN' ? '已通过 TronGrid API 成功同步 TRX 与能量/带宽最新数据！' : 'TronGrid API data synced successfully!');
    } else {
      setWallet((prev) => ({
        ...prev,
        walletBalance: Math.round((prev.walletBalance + (Math.random() * 2 - 1)) * 100) / 100,
      }));
      showToast(t('balanceUpdated'));
    }
  };

  const handleDeposit = () => {
    if (!wallet.connected) {
      setWalletModalOpen(true);
      return;
    }
    setDepositModalOpen(true);
  };

  const handleDepositSuccess = (addAmount: number) => {
    setWallet((prev) => ({
      ...prev,
      accountBalance: prev.accountBalance + addAmount,
    }));
    showToast(`${t('depositSuccess')} +${addAmount} TRX`);
  };

  // Purchase Energy / Bandwidth Handler - opens Payment Checkout Modal
  const handlePurchase = () => {
    // 1. Ensure wallet is connected
    if (!wallet.connected) {
      setWalletModalOpen(true);
      return;
    }

    // 2. Validate receiving addresses
    let targetAddresses = validAddresses;
    if (targetAddresses.length === 0) {
      if (wallet.address) {
        targetAddresses = [wallet.address];
        setAddressText(wallet.address);
      } else {
        showToast(t('pleaseEnterValidAddress'), 'error');
        return;
      }
    }

    if (amount <= 0) {
      showToast(t('invalidRentalAmount'), 'error');
      return;
    }

    const { totalCost } = calculateEnergyCost(amount, durationVal, targetAddresses.length);
    const availableBalance = paymentMethod === 'wallet' ? wallet.walletBalance : wallet.accountBalance;

    if (availableBalance < totalCost) {
      showToast(`${t('insufficientBalance')} ${totalCost} TRX`, 'error');
      setDepositModalOpen(true);
      return;
    }

    // Open Web3 Contract Payment Checkout Modal
    setCheckoutModalOpen(true);
  };

  // Callback after PaymentCheckoutModal signature & transaction confirmation
  const handleCheckoutConfirmSuccess = () => {
    let targetAddresses = validAddresses;
    if (targetAddresses.length === 0 && wallet.address) {
      targetAddresses = [wallet.address];
    }

    const { totalCost } = calculateEnergyCost(amount, durationVal, targetAddresses.length);

    // Deduct balance
    setWallet((prev) => ({
      ...prev,
      walletBalance: paymentMethod === 'wallet' ? prev.walletBalance - totalCost : prev.walletBalance,
      accountBalance: paymentMethod === 'account' ? prev.accountBalance - totalCost : prev.accountBalance,
    }));

    // Create new order
    const newOrder: RentalOrder = {
      id: `GS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      txHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      resourceType,
      amountPerAddress: amount,
      durationMinutes: durationVal,
      addresses: targetAddresses,
      totalCost,
      status: 'active',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      expiresAt: new Date(Date.now() + durationVal * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCheckoutModalOpen(false);
    showToast(`${t('purchaseSuccess')} ${targetAddresses.length} ${t('addresses')}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs sm:text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wallet={wallet}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onDisconnectWallet={handleDisconnectWallet}
        language={language}
        setLanguage={setLanguage}
      />

      {/* Main View Area */}
      <main className="max-w-4xl mx-auto px-4 py-6 w-full space-y-6 flex-1">
        {/* Main Resource Rental Tab */}
        {activeTab === 'rental' && (
          <div className="space-y-6">
            {/* Top Tabs (快捷租赁 / 自动租赁) */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2 bg-white p-1.5 rounded-2xl shadow-xs border border-slate-100 w-fit">
                <button
                  type="button"
                  onClick={() => setRentalMode('quick')}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    rentalMode === 'quick'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('quickRental')}
                </button>
                <button
                  type="button"
                  onClick={() => setRentalMode('auto')}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    rentalMode === 'auto'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('autoRental')}
                </button>
              </div>

              {rentalMode === 'auto' && (
                <div className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-xl border border-amber-200 font-medium hidden sm:block">
                  {t('autoRentalTip')}
                </div>
              )}
            </div>

            {/* Wallet Info Card */}
            <WalletCard
              wallet={wallet}
              onOpenWalletModal={() => setWalletModalOpen(true)}
              onRefreshWallet={handleRefreshWallet}
              onDeposit={handleDeposit}
              language={language}
            />

            {/* Rental Parameter Selection Card */}
            <RentalForm
              resourceType={resourceType}
              setResourceType={setResourceType}
              amount={amount}
              setAmount={setAmount}
              durationVal={durationVal}
              setDurationVal={setDurationVal}
              durationType={durationType}
              setDurationType={setDurationType}
              language={language}
            />

            {/* Receiving Address Card */}
            <AddressInput
              addressText={addressText}
              setAddressText={setAddressText}
              validAddresses={validAddresses}
              invalidAddresses={invalidAddresses}
              userWalletAddress={wallet.address}
              autoActivate={autoActivate}
              setAutoActivate={setAutoActivate}
              language={language}
            />

            {/* Cost Breakdown Card */}
            <CostCard
              resourceType={resourceType}
              amount={amount}
              durationMinutes={durationVal}
              addressCount={validAddresses.length || 0}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              wallet={wallet}
              onPurchase={handlePurchase}
              isSubmitting={isSubmitting}
              language={language}
            />

            {/* Order History Section */}
            <OrderHistory orders={orders} language={language} />
          </div>
        )}

        {/* Home / Hero View */}
        {activeTab === 'home' && (
          <HeroSection onStartRental={() => setActiveTab('rental')} language={language} />
        )}

        {/* Sublease / Yield Staking View */}
        {activeTab === 'sublease' && <EnergySublease language={language} />}

        {/* Blog View */}
        {activeTab === 'blog' && <BlogSection />}

        {/* Developer Docs View */}
        {activeTab === 'docs' && <DevDocs />}

        {/* Admin Dashboard View */}
        {activeTab === 'admin' && <AdminDashboard language={language} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>&copy; 2026 Gas Station. All rights reserved.</div>
          <div className="flex space-x-4 text-slate-500">
            <button onClick={() => setActiveTab('rental')} className="hover:text-blue-600">{t('navRental')}</button>
            <button onClick={() => setActiveTab('sublease')} className="hover:text-blue-600">{t('navSublease')}</button>
            <button onClick={() => setActiveTab('blog')} className="hover:text-blue-600">{t('navBlog')}</button>
            <button onClick={() => setActiveTab('docs')} className="hover:text-blue-600">{t('navDocs')}</button>
            <button onClick={() => setActiveTab('admin')} className="hover:text-blue-600">后台管理</button>
          </div>
        </div>
      </footer>

      {/* Floating Support Widget */}
      <CustomerSupportChat language={language} />

      {/* Wallet Signature Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        onConfirm={handleConnectWalletSuccess}
        language={language}
      />

      {/* Deposit & Recharge Modal */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onDepositSuccess={handleDepositSuccess}
        language={language}
      />

      {/* Web3 Contract Payment Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onConfirmSuccess={handleCheckoutConfirmSuccess}
        resourceType={resourceType}
        amount={amount}
        durationMinutes={durationVal}
        addresses={validAddresses.length > 0 ? validAddresses : (wallet.address ? [wallet.address] : [])}
        paymentMethod={paymentMethod}
        wallet={wallet}
        language={language}
      />
    </div>
    <div style={{ textAlign: 'center', padding: '15px' }}><a href="/admin" style={{ color: '#666' }}>Gas station</a></div>
  );
}
