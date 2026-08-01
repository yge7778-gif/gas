import React from 'react';
import { Language } from '../types';
import { Sparkles, Gift, Zap, ShieldAlert, Award } from 'lucide-react';

interface DevDocsProps {
  language?: Language;
}

export const DevDocs: React.FC<DevDocsProps> = ({ language = 'zh-CN' }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 顶部标头 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-3xl shadow-xl space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-200">
          <Sparkles className="w-4 h-4" />
          <span>欢迎光临加油站</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">平台欢迎说明与近期活动</h1>
        <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
          欢迎使用新一代 TRON 波场能量与带宽租赁平台。我们致力于为您提供极速、安全、省钱的链上资源分配服务，让您的每一笔转账省时更省心。
        </p>
      </div>

      {/* 活动一：新手立减与充值福利 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 text-blue-600">
          <div className="p-3 bg-blue-50 rounded-2xl">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">活动一：新用户首单专享优惠</h2>
            <p className="text-xs text-slate-400">活动时间：长期有效</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          所有首次注册并连接钱包的用户，在平台进行首笔能量或带宽租赁时，均可享受超低折扣价。系统将自动匹配最优通道，助您实现低成本链上转账。
        </p>
      </div>

      {/* 活动二：能量合伙人与质押分红 */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 text-emerald-600">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">活动二：能量分销与合伙人计划</h2>
            <p className="text-xs text-slate-400">高额返佣，共享红利</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          您可以将闲置的 TRX 质押获取能量，并通过分销页面一键托管至平台。平台将高频调度资源，为您带来稳定且可观的日常收益分成。
        </p>
      </div>

      {/* 安全与使用说明 */}
      <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl space-y-3">
        <div className="flex items-center space-x-2 text-white font-bold">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>平台使用安全提示</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          本平台采用去中心化智能合约与 API 双重保障机制。请确保您通过官方正规链接访问，切勿向任何人透露您的私钥或助记词。如有任何疑问，可随时通过右下角客服咨询。
        </p>
      </div>
    </div>
  );
};
