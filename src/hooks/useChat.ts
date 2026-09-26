import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Conversation {
  id: string;
  mandataire_id: string;
  comptable_id: string;
  otherName: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface MandataireOption {
  id: string;
  nom: string;
  prenom: string;
}

export function useChat() {
  const { user, hasRole } = useAuth();
  const isComptable = hasRole('comptable');

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [mandataireId, setMandataireId] = useState<string | null>(null);
  const [availableMandataires, setAvailableMandataires] = useState<MandataireOption[]>([]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    if (isComptable) {
      // Toutes les conversations du comptable, avec les infos du mandataire
      const { data: convs } = await supabase
        .from('conversations')
        .select('id, mandataire_id, comptable_id, mandataires(nom, prenom)')
        .eq('comptable_id', user.id)
        .order('updated_at', { ascending: false });

      // Messages non lus adressés au comptable
      const { data: unreadMsgs } = await supabase
        .from('messages')
        .select('conversation_id')
        .is('read_at', null)
        .neq('sender_id', user.id);

      const unreadByConv = new Map<string, number>();
      (unreadMsgs || []).forEach(m => {
        unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) || 0) + 1);
      });

      setConversations(
        (convs || []).map(c => ({
          id: c.id,
          mandataire_id: c.mandataire_id,
          comptable_id: c.comptable_id,
          otherName: c.mandataires ? `${c.mandataires.prenom} ${c.mandataires.nom}` : 'Mandataire',
          unread: unreadByConv.get(c.id) || 0,
        }))
      );

      // Mandataires du comptable sans conversation existante
      const { data: mandataires } = await supabase
        .from('mandataires')
        .select('id, nom, prenom');

      const existingIds = new Set((convs || []).map(c => c.mandataire_id));
      setAvailableMandataires(
        (mandataires || []).filter(m => !existingIds.has(m.id))
      );
    } else {
      // Côté mandataire : retrouver sa fiche puis sa conversation
      const { data: mand } = await supabase
        .from('mandataires')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!mand) {
        setConversations([]);
        setLoading(false);
        return;
      }
      setMandataireId(mand.id);

      const { data: convs } = await supabase
        .from('conversations')
        .select('id, mandataire_id, comptable_id')
        .eq('mandataire_id', mand.id);

      const { data: unreadMsgs } = await supabase
        .from('messages')
        .select('conversation_id')
        .is('read_at', null)
        .neq('sender_id', user.id);

      const unreadByConv = new Map<string, number>();
      (unreadMsgs || []).forEach(m => {
        unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) || 0) + 1);
      });

      setConversations(
        (convs || []).map(c => ({
          id: c.id,
          mandataire_id: c.mandataire_id,
          comptable_id: c.comptable_id,
          otherName: 'Votre expert-comptable',
          unread: unreadByConv.get(c.id) || 0,
        }))
      );
    }
    setLoading(false);
  }, [user, isComptable]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Temps réel : rafraîchir quand un message arrive
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const startConversation = async (mandataireIdToAdd: string): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('conversations')
      .insert({ mandataire_id: mandataireIdToAdd, comptable_id: user.id })
      .select('id')
      .single();
    if (error) {
      console.error('Erreur création conversation:', error);
      return null;
    }
    await fetchConversations();
    return data.id;
  };

  return { loading, conversations, availableMandataires, startConversation, refresh: fetchConversations, isComptable, mandataireId };
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages((data || []) as ChatMessage[]);

    // Marquer comme lus les messages reçus
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .is('read_at', null)
      .neq('sender_id', user.id);

    setLoading(false);
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Temps réel sur la conversation ouverte
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        () => fetchMessages()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!user || !conversationId || !content.trim()) return false;
    const { error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: user.id, content: content.trim() });
    if (error) {
      console.error('Erreur envoi message:', error);
      return false;
    }
    await fetchMessages();
    return true;
  };

  return { messages, loading, sendMessage };
}

// Compteur global de messages non lus (pour le badge de navigation)
export function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    const { count: unread } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
      .neq('sender_id', user.id);
    setCount(unread || 0);
  }, [user]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    const channel = supabase
      .channel('unread-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchCount())
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchCount]);

  return count;
}
