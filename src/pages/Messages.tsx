import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useChat, useMessages, Conversation } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { loading, conversations, availableMandataires, startConversation, isComptable } = useChat();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage } = useMessages(selectedConv?.id || null);

  // Sélection automatique côté mandataire (une seule conversation)
  useEffect(() => {
    if (!isComptable && conversations.length > 0 && !selectedConv) {
      setSelectedConv(conversations[0]);
    }
  }, [conversations, isComptable, selectedConv]);

  // Garder la conversation sélectionnée à jour (compteur non lus)
  useEffect(() => {
    if (selectedConv) {
      const updated = conversations.find(c => c.id === selectedConv.id);
      if (updated && updated.unread !== selectedConv.unread) {
        setSelectedConv(updated);
      }
    }
  }, [conversations, selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const ok = await sendMessage(newMessage);
    if (ok) {
      setNewMessage('');
    } else {
      toast({ title: 'Erreur', description: "Le message n'a pas pu être envoyé.", variant: 'destructive' });
    }
    setSending(false);
  };

  const handleStartConversation = async (mandataireId: string) => {
    const convId = await startConversation(mandataireId);
    setDialogOpen(false);
    if (convId) {
      toast({ title: 'Conversation créée', description: 'Vous pouvez maintenant échanger avec ce mandataire.' });
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const chatPanel = (
    <Card className="flex flex-col h-[600px]">
      {selectedConv ? (
        <>
          {/* En-tête */}
          <div className="border-b px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <MessageCircle size={18} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">{selectedConv.otherName}</p>
              <p className="text-xs text-muted-foreground">Conversation privée</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-10">
                Aucun message pour le moment. Écrivez le premier !
              </p>
            )}
            {messages.map(msg => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2',
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={cn('text-[10px] mt-1', isMine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {formatTime(msg.created_at)}
                      {isMine && msg.read_at && ' · Lu'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Saisie */}
          <div className="border-t p-3 flex gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Écrivez votre message..."
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon">
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 p-6">
          <MessageCircle size={48} className="opacity-30" />
          {isComptable ? (
            <p className="text-sm text-center">Sélectionnez une conversation ou démarrez-en une nouvelle.</p>
          ) : (
            <p className="text-sm text-center">
              Aucune conversation pour le moment.<br />
              Votre expert-comptable ouvrira une conversation avec vous.
            </p>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Messagerie</h1>
            <p className="text-muted-foreground text-sm">
              Échangez directement avec {isComptable ? 'vos mandataires' : 'votre expert-comptable'}
            </p>
          </div>
          {isComptable && availableMandataires.length > 0 && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={18} className="mr-2" />
                  Nouvelle conversation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Démarrer une conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  {availableMandataires.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleStartConversation(m.id)}
                      className="w-full text-left px-4 py-3 rounded-lg border hover:bg-secondary transition-colors"
                    >
                      <p className="font-medium">{m.prenom} {m.nom}</p>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isComptable ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Liste des conversations */}
            <Card className="md:col-span-1 h-[600px] overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10 px-4">
                  Aucune conversation. Cliquez sur « Nouvelle conversation » pour commencer.
                </p>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b flex items-center justify-between gap-2 transition-colors',
                      selectedConv?.id === conv.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageCircle size={16} className="text-primary" />
                      </div>
                      <span className="font-medium truncate">{conv.otherName}</span>
                    </div>
                    {conv.unread > 0 && (
                      <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {conv.unread}
                      </span>
                    )}
                  </button>
                ))
              )}
            </Card>
            <div className="md:col-span-2">{chatPanel}</div>
          </div>
        ) : (
          <div className="max-w-2xl">{chatPanel}</div>
        )}
      </div>
    </AppLayout>
  );
}
