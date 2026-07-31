import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, HelpCircle } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { getTranslation } from '../utils/i18n';

interface CustomerSupportChatProps {
  language: Language;
}

export const CustomerSupportChat: React.FC<CustomerSupportChatProps> = ({ language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: t('chatWelcome'),
      timestamp: '10:26',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const quickFaqs = [
    t('faq1'),
    t('faq2'),
    t('faq3'),
    t('faq4'),
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');

    // Generate bot reply
    setTimeout(() => {
      let reply = 'Thank you for your inquiry! Our support team is revieweing your message.';

      if (text.includes('手续费') || text.includes('省') || text.includes('fee') || text.includes('save') || text.includes('費')) {
        reply = 'In the TRON network, direct USDT transfers burn ~27.25-60.5 TRX. Renting 64,400 energy via Gas Station costs ~1.685 TRX, saving up to 90%!';
      } else if (text.includes('USDT') || text.includes('能量') || text.includes('energy')) {
        reply = 'Standard TRC20 USDT transfer: If receiver has USDT, consumes ~64,400 energy. If new address, consumes ~130,400 energy.';
      } else if (text.includes('到账') || text.includes('延迟') || text.includes('time') || text.includes('delay')) {
        reply = 'Gas Station uses smart staking delegation, delegating energy within 1-3 seconds after order confirmation.';
      } else if (text.includes('API')) {
        reply = 'We offer RESTful APIs and Webhooks. Check our Developer Docs for details.';
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen ? (
        /* Floating Widget */
        <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-white shadow-xl rounded-full px-4 py-2 text-xs font-semibold text-slate-700 flex items-center space-x-2 border border-slate-100">
            <span>Customer Support Chat</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition cursor-pointer"
            aria-label="Open Customer Support Chat"
          >
            <MessageSquare className="w-5 h-5 fill-current" />
          </button>
        </div>
      ) : (
        /* Expanded Chat Window */
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-80 sm:w-96 h-[480px] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-none">{t('chatAssistant')}</h4>
                <span className="text-[10px] text-blue-100 flex items-center space-x-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{t('chatOnline')}</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex space-x-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-2xs'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  <span
                    className={`text-[9px] block text-right mt-1 ${
                      msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Quick FAQ buttons inside chat */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">{t('quickFaq')}:</span>
              <div className="space-y-1.5">
                {quickFaqs.map((faq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(faq)}
                    className="w-full text-left bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-600 p-2 rounded-xl text-[11px] font-medium transition flex items-center justify-between"
                  >
                    <span>{faq}</span>
                    <Sparkles className="w-3 h-3 text-blue-500 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('typeQuestion')}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white p-2 rounded-xl transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
