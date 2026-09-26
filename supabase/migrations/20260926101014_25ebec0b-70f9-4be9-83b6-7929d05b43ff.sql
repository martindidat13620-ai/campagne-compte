CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mandataire_id uuid NOT NULL REFERENCES public.mandataires(id) ON DELETE CASCADE,
  comptable_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (mandataire_id, comptable_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their conversations"
ON public.conversations FOR SELECT TO authenticated
USING (
  comptable_id = auth.uid()
  OR is_own_mandataire(auth.uid(), mandataire_id)
);

CREATE POLICY "Comptables can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (
  comptable_id = auth.uid()
  AND is_comptable_for_mandataire(auth.uid(), mandataire_id)
);

CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.comptable_id = auth.uid() OR is_own_mandataire(auth.uid(), c.mandataire_id))
  )
);

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.comptable_id = auth.uid() OR is_own_mandataire(auth.uid(), c.mandataire_id))
  )
);

CREATE POLICY "Recipients can mark messages as read"
ON public.messages FOR UPDATE TO authenticated
USING (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.comptable_id = auth.uid() OR is_own_mandataire(auth.uid(), c.mandataire_id))
  )
)
WITH CHECK (
  sender_id <> auth.uid()
);

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;