import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un assistant expert en comptabilité de campagne électorale française. Tu aides les mandataires financiers à comprendre leurs obligations et à gérer correctement les comptes de campagne.

Tes domaines d'expertise :
- Les règles de la CNCCFP (Commission Nationale des Comptes de Campagne et des Financements Politiques)
- Les types de recettes autorisées (dons, versements personnels, apports des partis politiques, etc.)
- Les catégories de dépenses de campagne
- Les plafonds légaux de dépenses
- Les justificatifs obligatoires
- Les modes de paiement autorisés
- Les règles anti-blanchiment (attestations d'origine des fonds)

Règles importantes à rappeler :
- Les dons en espèces sont limités à 150€ par donateur
- Les dons supérieurs à 3000€ nécessitent une attestation d'origine des fonds
- Chaque dépense doit avoir un justificatif
- Le mandataire doit tenir un carnet de reçus pour les dons
- Les versements personnels du candidat supérieurs à 10 000€ nécessitent une attestation d'origine des fonds

Réponds de manière claire, précise et pédagogique. Si tu n'es pas sûr d'une information réglementaire, conseille à l'utilisateur de vérifier auprès de son expert-comptable ou de la CNCCFP.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, veuillez réessayer plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants, veuillez contacter l'administrateur." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("mandataire-assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
