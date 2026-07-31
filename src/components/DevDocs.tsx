import React, { useState } from 'react';
import { Code, Terminal, Copy, Check, Key, Zap, Shield, FileText } from 'lucide-react';

export const DevDocs: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const apiCodeSnippets = [
    {
      title: '1. 创建能量租赁订单 (Create Rental Order)',
      endpoint: 'POST https://gasstation.ai/api/v1/rent',
      code: `curl -X POST "https://gasstation.ai/api/v1/rent" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "resourceType": "energy",
    "amount": 64400,
    "durationMinutes": 10,
    "addresses": ["TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"]
  }'`,
    },
    {
      title: '2. 查询实时价格与库存 (Query Price & Liquidity)',
      endpoint: 'GET https://gasstation.ai/api/v1/prices',
      code: `curl -X GET "https://gasstation.ai/api/v1/prices" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">开发者 API 文档</h2>
              <p className="text-xs text-slate-500 mt-0.5">RESTful API / Webhook 支持高频自动化能量派发</p>
            </div>
          </div>
          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full font-mono">
            v1.2.0 API
          </span>
        </div>

        {/* API Key Box */}
        <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 shadow-md">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold flex items-center space-x-1.5 text-blue-400">
              <Key className="w-4 h-4" />
              <span>您的开发者 API 密钥 (API Key)</span>
            </span>
            <span className="text-slate-400">状态: 激活</span>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl flex items-center justify-between font-mono text-xs text-emerald-400 border border-slate-700">
            <span>gs_live_9984f1a20b83e4c8291f092</span>
            <button
              onClick={() => handleCopy('gs_live_9984f1a20b83e4c8291f092', 99)}
              className="text-slate-400 hover:text-white p-1 rounded transition"
            >
              {copiedIndex === 99 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Code Snippets */}
        <div className="space-y-6">
          {apiCodeSnippets.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>{item.title}</span>
                <span className="text-slate-400 font-mono text-[11px]">{item.endpoint}</span>
              </div>
              <div className="bg-slate-950 rounded-2xl p-4 relative group font-mono text-xs text-slate-200 overflow-x-auto border border-slate-800 shadow-inner">
                <button
                  onClick={() => handleCopy(item.code, idx)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg transition"
                >
                  {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="leading-relaxed">{item.code}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
