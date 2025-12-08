import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  nom: string;
  prenom: string;
  role: "mandataire" | "candidat";
  candidat_id?: string;
  mandataire_id?: string;
  custom_password?: string;
  skip_email?: boolean;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendInvitationEmail(email: string, nom: string, prenom: string, role: string, tempPassword: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured");
    throw new Error("Service d'email non configuré");
  }

  const appUrl = "https://preview--compte-de-campagne-v2.lovable.app";
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ComptaCampagne <onboarding@resend.dev>",
      to: [email],
      subject: "Invitation à rejoindre ComptaCampagne",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0;">ComptaCampagne</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">Bonjour ${prenom} ${nom},</h2>
            <p style="color: #666; font-size: 16px;">
              Vous avez été invité(e) à rejoindre ComptaCampagne en tant que <strong>${role}</strong>.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e3a5f;">
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Vos identifiants de connexion :</strong></p>
              <p style="margin: 5px 0; color: #666;">Email : <strong>${email}</strong></p>
              <p style="margin: 5px 0; color: #666;">Mot de passe temporaire : <strong>${tempPassword}</strong></p>
            </div>
            <p style="color: #e74c3c; font-size: 14px;">
              ⚠️ Nous vous recommandons de changer votre mot de passe dès votre première connexion.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${appUrl}/auth" style="background: #1e3a5f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Se connecter
              </a>
            </div>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            © 2024 ComptaCampagne - Gestion des comptes de campagne
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Resend API error:", error);
    throw new Error("Erreur lors de l'envoi de l'email");
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the caller is authenticated and is a comptable
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header manquant");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callerUser) {
      throw new Error("Non autorisé");
    }

    // Check if caller is comptable
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id);

    const isComptable = callerRoles?.some(r => r.role === "comptable");
    if (!isComptable) {
      throw new Error("Seul un comptable peut inviter des utilisateurs");
    }

    const { email, nom, prenom, role, candidat_id, mandataire_id, custom_password, skip_email }: InviteUserRequest = await req.json();

    console.log(`Inviting user: ${email} as ${role}`);

    // Use custom password or generate temporary one
    const tempPassword = custom_password || generateTempPassword();

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { nom, prenom }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw new Error(`Erreur création utilisateur: ${createError.message}`);
    }

    console.log(`User created: ${newUser.user.id}`);

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role });

    if (roleError) {
      console.error("Error assigning role:", roleError);
      throw new Error(`Erreur attribution rôle: ${roleError.message}`);
    }

    // Link to candidat or mandataire record
    if (role === "candidat" && candidat_id) {
      await supabaseAdmin
        .from("candidats")
        .update({ user_id: newUser.user.id })
        .eq("id", candidat_id);
    } else if (role === "mandataire" && mandataire_id) {
      await supabaseAdmin
        .from("mandataires")
        .update({ user_id: newUser.user.id })
        .eq("id", mandataire_id);
    }

    // Send invitation email (unless skipped)
    if (!skip_email) {
      try {
        await sendInvitationEmail(email, nom, prenom, role, tempPassword);
        console.log(`Invitation email sent to ${email}`);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Continue - user was created successfully
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUser.user.id,
        message: `Invitation envoyée à ${email}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in invite-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
