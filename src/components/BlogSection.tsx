import React from 'react';
import { BookOpen, Calendar, ArrowRight, Zap, Shield } from 'lucide-react';

export const BlogSection: React.FC = () => {
  const posts = [
    {
      id: 1,
      title: '如何通过波场 TRON 能量租赁降低 90% 的 USDT 转账手续费？',
      category: '指南与教程',
      date: '2026-07-28',
      summary: '直接燃烧 TRX 转账 USDT 需要消耗 27~64 TRX。本文详解如何利用 Gas Station 能量租赁一键降低转账成本。',
      readTime: '4 分钟阅读',
    },
    {
      id: 2,
      title: 'TRON 波场能量与带宽机制全解析：智能合约到底如何扣费？',
      category: '原理科普',
      date: '2026-07-20',
      summary: '深入探讨波场链上的 Energy 与 Bandwidth 资源计算模型，帮助交易所与大额转账用户优化资源策略。',
      readTime: '6 分钟阅读',
    },
    {
      id: 3,
      title: ' Gas Station 自动化 API 发布：支持定时与自动续订能量',
      category: '产品更新',
      date: '2026-07-12',
      summary: '针对量化交易与量化机器人用户推出的 REST API，支持毫秒级订单派发与查询。',
      readTime: '3 分钟阅读',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gas Station 官方博客</h2>
            <p className="text-xs text-slate-500 mt-0.5">TRON 链上资源、USDT 省费技巧与区块链干货分享</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-md transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{post.date}</span>
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                  {post.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>{post.readTime}</span>
                <span className="flex items-center space-x-1 hover:underline cursor-pointer">
                  <span>阅读全文</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
