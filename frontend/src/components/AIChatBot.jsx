import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Loader2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios'; // Đảm bảo đã import axios

// Gợi ý câu hỏi
const SUGGESTIONS = [
  "So sánh Ducati V4S và BMW S1000RR",
  "Tài chính 700tr mua xe Sport gì?",
  "Chính sách trả góp thế nào?",
  "Tư vấn bảo dưỡng xe định kỳ",
];

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      content: 'Chào bạn! 👋 Tôi là Moto AI. \n\nTôi được kết nối với Google Gemini để hỗ trợ bạn **so sánh xe**, **tư vấn kỹ thuật** và **báo giá**. Bạn cần giúp gì không?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // --- HÀM GỬI TIN NHẮN (GỌI API THẬT) ---
  const handleSend = async (text = null) => {
    const userMessageText = text || input.trim();
    if (!userMessageText) return;

    // 1. Hiện tin nhắn người dùng lên
    const newMessages = [...messages, { role: 'user', content: userMessageText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // 2. GỌI XUỐNG BACKEND (PYTHON)
      const res = await axios.post('http://127.0.0.1:8000/api/chat', { 
        message: userMessageText 
      });
      
      const botReply = res.data.reply; 
      
      // 3. Hiện câu trả lời từ AI
      setMessages(prev => [...prev, { role: 'bot', content: botReply }]);

    } catch (error) {
      console.error("Lỗi chat:", error);
      setMessages(prev => [...prev, { role: 'bot', content: "⚠️ Lỗi kết nối Server. Bạn hãy kiểm tra xem Backend (uvicorn) đã chạy chưa nhé!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* NÚT MỞ CHAT */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[999] bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 animate-bounce-slow group"
        >
          <MessageCircle size={28} />
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></span>
        </button>
      )}

      {/* KHUNG CHAT */}
      {isOpen && (
        <div className={`fixed z-[999] bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl transition-all duration-300 overflow-hidden flex flex-col
            ${isMinimized 
                ? 'bottom-6 right-6 w-72 h-14 rounded-2xl cursor-pointer hover:bg-slate-800' 
                : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-[100vh] sm:h-[600px] sm:rounded-3xl'
            }`}
        >
          {/* HEADER */}
          <div 
            className="bg-gradient-to-r from-blue-900/80 to-slate-800/90 p-4 border-b border-slate-700 flex justify-between items-center cursor-pointer"
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 p-[2px]">
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                        <Bot size={20} className="text-blue-400" />
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-1">
                        Moto AI <Sparkles size={12} className="text-yellow-400 fill-yellow-400"/>
                    </h3>
                    <p className="text-[10px] text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Gemini Powered
                    </p>
                </div>
            </div>
            
            {!isMinimized && (
                <div className="flex items-center gap-2">
                    <button onClick={(e) => {e.stopPropagation(); setIsMinimized(true)}} className="p-1.5 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-white transition">
                        <Minimize2 size={16}/>
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-500 transition">
                        <X size={18}/>
                    </button>
                </div>
            )}
          </div>

          {/* BODY */}
          {!isMinimized && (
            <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/30">
                    <div className="text-center text-[10px] text-gray-500 uppercase tracking-widest mb-4">Hỗ trợ tự động</div>
                    
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'bot' ? 'bg-slate-800 border border-slate-700' : 'bg-blue-600'}`}>
                                {msg.role === 'bot' ? <Bot size={16} className="text-blue-400"/> : <User size={16} className="text-white"/>}
                            </div>
                            
                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                            }`}>
                                {msg.role === 'bot' ? (
                                    <div className="markdown-content">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                <Loader2 size={16} className="text-blue-400 animate-spin"/>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-3 flex items-center gap-1">
                                <span className="text-xs text-gray-400 italic">Đang suy nghĩ...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* SUGGESTIONS */}
                {messages.length < 3 && (
                    <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                        {SUGGESTIONS.map((sug, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleSend(sug)}
                                className="whitespace-nowrap px-3 py-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white border border-slate-700 hover:border-blue-500 rounded-full text-xs text-gray-400 transition-colors"
                            >
                                {sug}
                            </button>
                        ))}
                    </div>
                )}

                {/* FOOTER */}
                <div className="p-3 bg-slate-800 border-t border-slate-700">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex items-center gap-2 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all"
                    >
                        <input 
                            type="text" 
                            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
                            placeholder="Nhập câu hỏi..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || isLoading}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIChatBot;