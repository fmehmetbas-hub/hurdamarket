import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../store/auth.store';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { messagesApi } from '../services/api';

let socket = null;

const getSocket = (token) => {
  if (!socket || !socket.connected) {
    socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });
  }
  return socket;
};

export default function ChatPanel({ offerId }) {
  const { user, token }   = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const bottomRef               = useRef(null);

  // Mevcut mesajları yükle
  const { data: history } = useQuery({
    queryKey: ['messages', offerId],
    queryFn:  () => messagesApi.getByOffer(offerId).then(r => r.data),
    onSuccess: (data) => setMessages(data),
  });

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    s.emit('join_offer', offerId);
    s.on('new_message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return () => s.off('new_message');
  }, [offerId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!text.trim() || !socket) return;
    socket.emit('send_message', { offerId, content: text.trim() });
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">Henüz mesaj yok. Konuşmayı başlat!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm
                ${isMe
                  ? 'bg-green-700 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                <p className="leading-relaxed">{msg.content}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-green-200' : 'text-gray-400'}`}>
                  {format(new Date(msg.sent_at), 'HH:mm', { locale: tr })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Yazma alanı */}
      <div className="border-t p-3 flex gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Mesajınızı yazın..."
          rows={1}
          className="flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="w-10 h-10 bg-green-700 text-white rounded-xl flex items-center justify-center hover:bg-green-800 transition disabled:opacity-40 flex-shrink-0"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
