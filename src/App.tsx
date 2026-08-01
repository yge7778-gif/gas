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
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('rental');
  const [language, setLanguage] = useState<Language>('zh-CN');

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  // 后台登录状态
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<string>('');
  const [adminPass, setAdminPass] = useState<string>('');

  const [rentalMode, setRentalMode] = useState<'quick' | 'auto'>('quick');

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

  const [resourceType, setResourceType] = useState<ResourceType>('energy');
  const [amount, setAmount] = useState<number>(64400);
  const [durationVal, setDurationVal] = useState<number>(10);
  const [durationType, setDurationType] = useState<'10m' | '1h' | '1d' | '3d' | 'custom'>('10m');

  const [addressText, setAddressText] = useState<string>('');
  const [autoActivate, setAutoActivate] = useState<boolean>(true);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('account');
  const [isSubmitting] = useState<boolean>(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [orders, setOrders] = useState<RentalOrder[]>([]);

  const { valid: validAddresses, invalid: invalidAddresses } = parseTronAddresses(addressText);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleConnectWalletSuccess = async (selectedAddress: string) => {
    setWalletModalOpen(false);
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
      showToast('TronGrid API data synced successfully!');
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

  const handlePurchase = () => {
    if (!wallet.connected) {
      setWalletModalOpen(true);
      return;
    }
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
    setCheckoutModalOpen(true);
  };

  const handleCheckoutConfirmSuccess = () => {
    let targetAddresses = validAddresses;
    if (targetAddresses.length === 0 && wallet.address) {
      targetAddresses = [wallet.address];
    }
    const { totalCost } = calculateEnergyCost(amount, durationVal, targetAddresses.length);
    setWallet((prev) => ({
      ...prev,
      walletBalance: paymentMethod === 'wallet' ? prev.walletBalance - totalCost : prev.walletBalance,
      accountBalance: paymentMethod === 'account' ? prev.accountBalance - totalCost : prev.accountBalance,
    }));

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
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs sm:text-sm font-semibold ${toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wallet={wallet}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onDisconnectWallet={handleDisconnectWallet}
        language={language}
        setLanguage={setLanguage}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 w-full space-y-6 flex-1">
        {activeTab === 'rental' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2 bg-white p-1.5 rounded-2xl shadow-xs border border-slate-100 w-fit">
                <button type="button" onClick={() => setRentalMode('quick')} className={`px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${rentalMode === 'quick' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{t('quickRental')}</button>
                <button type="button" onClick={() => setRentalMode('auto')} className={`px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${rentalMode === 'auto' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{t('autoRental')}</button>
              </div>
            </div>
            <WalletCard wallet={wallet} onOpenWalletModal={() => setWalletModalOpen(true)} onRefreshWallet={handleRefreshWallet} onDeposit={handleDeposit} language={language} />
            <RentalForm resourceType={resourceType} setResourceType={setResourceType} amount={amount} setAmount={setAmount} durationVal={durationVal} setDurationVal={setDurationVal} durationType={durationType} setDurationType={setDurationType} language={language} />
            <AddressInput addressText={addressText} setAddressText={setAddressText} validAddresses={validAddresses} invalidAddresses={invalidAddresses} userWalletAddress={wallet.address} autoActivate={autoActivate} setAutoActivate={setAutoActivate} language={language} />
            <CostCard resourceType={resourceType} amount={amount} durationMinutes={durationVal} addressCount={validAddresses.length || 0} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} wallet={wallet} onPurchase={handlePurchase} isSubmitting={isSubmitting} language={language} />
            <OrderHistory orders={orders} language={language} />
          </div>
        )}

        {activeTab === 'home' && <HeroSection onStartRental={() => setActiveTab('rental')} language={language} />}
        {activeTab === 'sublease' && <EnergySublease language={language} />}
        {activeTab === 'blog' && <BlogSection />}
        {activeTab === 'docs' && <DevDocs />}

        {/* 后台管理（登录拦截保护） */}
        {activeTab === 'admin' && (
          <div>
            {!isAdminLoggedIn ? (
              <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6 mt-12">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">管理员身份验证</h2>
                  <p className="text-xs text-slate-400">请输入账号和密码以访问管理控制台</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">账号 (Username)</label>
                    <input 
                      type="text" 
                      value={adminUser} 
                      onChange={(e) => setAdminUser(e.target.value)} 
                      placeholder="请输入管理员账号" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">密码 (Password)</label>
                    <input 
                      type="password" 
                      value={adminPass} 
                      onChange={(e) => setAdminPass(e.target.value)} 
                      placeholder="请输入管理员密码" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (adminUser.trim() && adminPass.trim()) {
                        setIsAdminLoggedIn(true);
                      } else {
                        showToast('请输入正确的管理员账号和密码', 'error');
                      }
                    }} 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-xs transition cursor-pointer shadow-sm"
                  >
                    安全登录
                  </button>
                </div>
              </div>
            ) : (
              <AdminDashboard language={language} />
            )}
          </div>
        )}
      </main>

      {/* 底部版权栏（绝对无“后台管理”文字） */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>&copy; 2026 Gas Station. All rights reserved.</div>
          <div className="flex space-x-4 text-slate-500">
            <button onClick={() => setActiveTab('rental')} className="hover:text-blue-600">{t('navRental')}</button>
            <button onClick={() => setActiveTab('sublease')} className="hover:text-blue-600">{t('navSublease')}</button>
            <button onClick={() => setActiveTab('blog')} className="hover:text-blue-600">{t('navBlog')}</button>
            <button onClick={() => setActiveTab('docs')} className="hover:text-blue-600">{t('navDocs')}</button>
          </div>
        </div>
      </footer>

      {/* 隐蔽后台入口：最底部小字按键 */}
      <div style={{ textAlign: 'center', padding: '15px' }}>
        <button 
          onClick={() => {
            setActiveTab('admin');
            setIsAdminLoggedIn(false);
          }} 
          style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '12px' }}
        >
          Gas station
        </button>
      </div>

      <CustomerSupportChat language={language} />
      <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} onConfirm={handleConnectWalletSuccess} language={language} />
      <DepositModal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} onDepositSuccess={handleDepositSuccess} language={language} />
      <PaymentCheckoutModal isOpen={checkoutModalOpen} onClose={() => setCheckoutModalOpen(false)} onConfirmSuccess={handleCheckoutConfirmSuccess} resourceType={resourceType} amount={amount} durationMinutes={durationVal} addresses={validAddresses.length > 0 ? validAddresses : (wallet.address ? [wallet.address] : [])} paymentMethod={paymentMethod} wallet={wallet} language={language} />
    </div>
  );
}
