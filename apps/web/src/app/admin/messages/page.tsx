'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ChatBox from '@/components/ChatBox';

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/messages/conversations')
      .then(({ data }) => setConversations(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 900,
          fontFamily: 'Playfair Display, serif', marginBottom: 8,
        }}>
          Messages
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Supervision des échanges sur la plateforme
        </p>
      </div>

      <ChatBox conversations={conversations} loadingConvs={loading} />
    </div>
  );
}