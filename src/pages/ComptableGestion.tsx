import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Send, Building2, Users, UserCheck, Loader2, Trash2, Key, Filter, Pencil } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { TYPES_ELECTION, Campaign, Candidat, Mandataire } from '@/types';

interface MandataireCandidatLink {
  id: string;
  mandataire_id: string;
  candidat_id: string;
}

export default function ComptableGestion() {
  const { session } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [mandataires, setMandataires] = useState<Mandataire[]>([]);
  const [mandataireCandidatLinks, setMandataireCandidatLinks] = useState<MandataireCandidatLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filter states
  const [candidatCampaignFilter, setCandidatCampaignFilter] = useState<string>('all');
  const [mandataireCampaignFilter, setMandataireCampaignFilter] = useState<string>('all');
  const [mandataireCandidatFilter, setMandataireCandidatFilter] = useState<string>('all');

  // Form states
  const [newCampaign, setNewCampaign] = useState({ nom: '', type_election: '', annee: new Date().getFullYear() });
  const [newCandidat, setNewCandidat] = useState({ nom: '', prenom: '', email: '', campaign_id: '', plafond_depenses: 0, circonscription: '' });
  const [newMandataire, setNewMandataire] = useState({ nom: '', prenom: '', email: '', candidat_id: '' });

  const [dialogOpen, setDialogOpen] = useState({ campaign: false, candidat: false, mandataire: false });
  const [inviteDialog, setInviteDialog] = useState<{ open: boolean; type: 'candidat' | 'mandataire'; record: Candidat | Mandataire | null }>({ open: false, type: 'candidat', record: null });
  const [inviteOptions, setInviteOptions] = useState({ customPassword: '', skipEmail: false });
  const [editCandidatDialog, setEditCandidatDialog] = useState<{ open: boolean; candidat: Candidat | null }>({ open: false, candidat: null });
  const [editPlafond, setEditPlafond] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [campaignsRes, candidatsRes, mandatairesRes, linksRes] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('candidats').select('*').order('created_at', { ascending: false }),
      supabase.from('mandataires').select('*').order('created_at', { ascending: false }),
      supabase.from('mandataire_candidats').select('*')
    ]);

    if (campaignsRes.data) setCampaigns(campaignsRes.data as Campaign[]);
    if (candidatsRes.data) setCandidats(candidatsRes.data as Candidat[]);
    if (mandatairesRes.data) setMandataires(mandatairesRes.data as Mandataire[]);
    if (linksRes.data) setMandataireCandidatLinks(linksRes.data as MandataireCandidatLink[]);
    
    setLoading(false);
  };

  // Get candidats linked to a mandataire
  const getMandataireCandidats = (mandataireId: string) => {
    const candidatIds = mandataireCandidatLinks
      .filter(link => link.mandataire_id === mandataireId)
      .map(link => link.candidat_id);
    return candidats.filter(c => candidatIds.includes(c.id));
  };

  // Get campaigns linked to a mandataire (through their candidats)
  const getMandataireCampaigns = (mandataireId: string) => {
    const linkedCandidats = getMandataireCandidats(mandataireId);
    const campaignIds = [...new Set(linkedCandidats.map(c => c.campaign_id))];
    return campaigns.filter(c => campaignIds.includes(c.id));
  };

  // Filter candidats by campaign
  const filteredCandidats = candidatCampaignFilter === 'all'
    ? candidats
    : candidats.filter(c => c.campaign_id === candidatCampaignFilter);

  // Filter mandataires by campaign and/or candidat
  const filteredMandataires = mandataires.filter(mandataire => {
    const linkedCandidats = getMandataireCandidats(mandataire.id);
    const linkedCampaignIds = linkedCandidats.map(c => c.campaign_id);
    
    // Filter by campaign
    if (mandataireCampaignFilter !== 'all') {
      if (!linkedCampaignIds.includes(mandataireCampaignFilter)) {
        return false;
      }
    }
    
    // Filter by candidat
    if (mandataireCandidatFilter !== 'all') {
      if (!linkedCandidats.some(c => c.id === mandataireCandidatFilter)) {
        return false;
      }
    }
    
    return true;
  });

  // Get candidats available for mandataire filter (based on campaign filter)
  const mandataireFilterCandidats = mandataireCampaignFilter === 'all'
    ? candidats
    : candidats.filter(c => c.campaign_id === mandataireCampaignFilter);

  const createCampaign = async () => {
    const { error } = await supabase.from('campaigns').insert({
      nom: newCampaign.nom,
      type_election: newCampaign.type_election,
      annee: newCampaign.annee
    });

    if (error) {
      toast.error('Erreur lors de la création de la campagne');
      return;
    }

    toast.success('Campagne créée avec succès');
    setDialogOpen({ ...dialogOpen, campaign: false });
    setNewCampaign({ nom: '', type_election: '', annee: new Date().getFullYear() });
    fetchData();
  };

  const createCandidat = async () => {
    const { data, error } = await supabase.from('candidats').insert({
      nom: newCandidat.nom,
      prenom: newCandidat.prenom,
      email: newCandidat.email,
      campaign_id: newCandidat.campaign_id,
      plafond_depenses: newCandidat.plafond_depenses,
      circonscription: newCandidat.circonscription
    }).select().single();

    if (error) {
      toast.error('Erreur lors de la création du candidat');
      return;
    }

    toast.success('Candidat créé avec succès');
    setDialogOpen({ ...dialogOpen, candidat: false });
    setNewCandidat({ nom: '', prenom: '', email: '', campaign_id: '', plafond_depenses: 0, circonscription: '' });
    fetchData();
  };

  const createMandataire = async () => {
    const { data, error } = await supabase.from('mandataires').insert({
      nom: newMandataire.nom,
      prenom: newMandataire.prenom,
      email: newMandataire.email
    }).select().single();

    if (error) {
      toast.error('Erreur lors de la création du mandataire');
      return;
    }

    // Link mandataire to candidat
    if (newMandataire.candidat_id && data) {
      await supabase.from('mandataire_candidats').insert({
        mandataire_id: data.id,
        candidat_id: newMandataire.candidat_id
      });
    }

    toast.success('Mandataire créé avec succès');
    setDialogOpen({ ...dialogOpen, mandataire: false });
    setNewMandataire({ nom: '', prenom: '', email: '', candidat_id: '' });
    fetchData();
  };

  const openInviteDialog = (type: 'candidat' | 'mandataire', record: Candidat | Mandataire) => {
    setInviteDialog({ open: true, type, record });
    setInviteOptions({ customPassword: '', skipEmail: false });
  };

  const inviteUser = async () => {
    if (!inviteDialog.record) return;
    
    setInviting(true);
    const { type, record } = inviteDialog;
    
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: record.email,
          nom: record.nom,
          prenom: record.prenom,
          role: type,
          candidat_id: type === 'candidat' ? record.id : undefined,
          mandataire_id: type === 'mandataire' ? record.id : undefined,
          custom_password: inviteOptions.customPassword || undefined,
          skip_email: inviteOptions.skipEmail
        }
      });

      if (error) throw error;
      
      if (inviteOptions.skipEmail && inviteOptions.customPassword) {
        toast.success(`Compte créé pour ${record.email} avec le mot de passe défini`);
      } else {
        toast.success(`Invitation envoyée à ${record.email}`);
      }
      setInviteDialog({ open: false, type: 'candidat', record: null });
      fetchData();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(error.message || "Erreur lors de l'envoi de l'invitation");
    } finally {
      setInviting(false);
    }
  };

  const deleteCampaign = async (campaign: Campaign) => {
    setDeleting(campaign.id);
    try {
      // First, get all candidats for this campaign
      const campaignCandidats = candidats.filter(c => c.campaign_id === campaign.id);
      
      // Delete all candidats (and their users) for this campaign
      for (const candidat of campaignCandidats) {
        await deleteCandidat(candidat, false);
      }

      // Delete the campaign
      const { error } = await supabase.from('campaigns').delete().eq('id', campaign.id);
      
      if (error) {
        toast.error('Erreur lors de la suppression de la campagne');
        console.error('Delete campaign error:', error);
        return;
      }

      toast.success('Campagne supprimée avec succès');
      fetchData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Erreur lors de la suppression de la campagne');
    } finally {
      setDeleting(null);
    }
  };

  const deleteCandidat = async (candidat: Candidat, showToast = true) => {
    if (showToast) setDeleting(candidat.id);
    try {
      // Get mandataires linked to this candidat
      const { data: links } = await supabase
        .from('mandataire_candidats')
        .select('mandataire_id')
        .eq('candidat_id', candidat.id);

      // Delete operations for this candidat
      await supabase.from('operations').delete().eq('candidat_id', candidat.id);

      // Delete mandataire links
      await supabase.from('mandataire_candidats').delete().eq('candidat_id', candidat.id);

      // Check if any of the linked mandataires have no other candidats and delete them
      if (links) {
        for (const link of links) {
          const { data: otherLinks } = await supabase
            .from('mandataire_candidats')
            .select('id')
            .eq('mandataire_id', link.mandataire_id);

          if (!otherLinks || otherLinks.length === 0) {
            const mandataire = mandataires.find(m => m.id === link.mandataire_id);
            if (mandataire) {
              await deleteMandataire(mandataire, false);
            }
          }
        }
      }

      // Delete user account if exists
      if (candidat.user_id) {
        await supabase.functions.invoke('delete-user', {
          body: { user_id: candidat.user_id }
        });
      }

      // Delete the candidat
      const { error } = await supabase.from('candidats').delete().eq('id', candidat.id);
      
      if (error) {
        if (showToast) toast.error('Erreur lors de la suppression du candidat');
        console.error('Delete candidat error:', error);
        return;
      }

      if (showToast) {
        toast.success('Candidat supprimé avec succès');
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting candidat:', error);
      if (showToast) toast.error('Erreur lors de la suppression du candidat');
    } finally {
      if (showToast) setDeleting(null);
    }
  };

  const deleteMandataire = async (mandataire: Mandataire, showToast = true) => {
    if (showToast) setDeleting(mandataire.id);
    try {
      // Delete operations for this mandataire
      await supabase.from('operations').delete().eq('mandataire_id', mandataire.id);

      // Delete mandataire links
      await supabase.from('mandataire_candidats').delete().eq('mandataire_id', mandataire.id);

      // Delete user account if exists
      if (mandataire.user_id) {
        await supabase.functions.invoke('delete-user', {
          body: { user_id: mandataire.user_id }
        });
      }

      // Delete the mandataire
      const { error } = await supabase.from('mandataires').delete().eq('id', mandataire.id);
      
      if (error) {
        if (showToast) toast.error('Erreur lors de la suppression du mandataire');
        console.error('Delete mandataire error:', error);
        return;
      }

      if (showToast) {
        toast.success('Mandataire supprimé avec succès');
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting mandataire:', error);
      if (showToast) toast.error('Erreur lors de la suppression du mandataire');
    } finally {
      if (showToast) setDeleting(null);
    }
  };

  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? `${campaign.nom} (${campaign.annee})` : 'N/A';
  };

  const openEditCandidatDialog = (candidat: Candidat) => {
    setEditCandidatDialog({ open: true, candidat });
    setEditPlafond(candidat.plafond_depenses || 0);
  };

  const updateCandidatPlafond = async () => {
    if (!editCandidatDialog.candidat) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('candidats')
        .update({ plafond_depenses: editPlafond })
        .eq('id', editCandidatDialog.candidat.id);

      if (error) {
        toast.error('Erreur lors de la mise à jour du plafond');
        console.error('Update error:', error);
        return;
      }

      toast.success('Plafond mis à jour avec succès');
      setEditCandidatDialog({ open: false, candidat: null });
      fetchData();
    } catch (error) {
      console.error('Error updating plafond:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des campagnes</h1>
          <p className="text-muted-foreground">Créez des campagnes, candidats et mandataires</p>
        </div>

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Campagnes ({campaigns.length})
            </TabsTrigger>
            <TabsTrigger value="candidats" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Candidats ({candidats.length})
            </TabsTrigger>
            <TabsTrigger value="mandataires" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Mandataires ({mandataires.length})
            </TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={dialogOpen.campaign} onOpenChange={(open) => setDialogOpen({ ...dialogOpen, campaign: open })}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle campagne
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une campagne</DialogTitle>
                    <DialogDescription>Ajoutez une nouvelle campagne électorale</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nom de la campagne</Label>
                      <Input 
                        value={newCampaign.nom} 
                        onChange={(e) => setNewCampaign({ ...newCampaign, nom: e.target.value })}
                        placeholder="Ex: Législatives 3ème circonscription"
                      />
                    </div>
                    <div>
                      <Label>Type d'élection</Label>
                      <Select value={newCampaign.type_election} onValueChange={(v) => setNewCampaign({ ...newCampaign, type_election: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPES_ELECTION.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Année</Label>
                      <Input 
                        type="number" 
                        value={newCampaign.annee} 
                        onChange={(e) => setNewCampaign({ ...newCampaign, annee: parseInt(e.target.value) })}
                      />
                    </div>
                    <Button onClick={createCampaign} className="w-full">Créer la campagne</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {campaigns.map(campaign => {
                const campaignCandidats = candidats.filter(c => c.campaign_id === campaign.id);
                return (
                  <Card key={campaign.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{campaign.nom}</CardTitle>
                          <CardDescription>{campaign.type_election} • {campaignCandidats.length} candidat(s)</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{campaign.annee}</Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" disabled={deleting === campaign.id}>
                                {deleting === campaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer la campagne ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. Tous les candidats ({campaignCandidats.length}), mandataires associés et leurs comptes utilisateur seront également supprimés.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteCampaign(campaign)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
              {campaigns.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Aucune campagne créée</p>
              )}
            </div>
          </TabsContent>

          {/* Candidats Tab */}
          <TabsContent value="candidats" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-muted-foreground" />
                <Select value={candidatCampaignFilter} onValueChange={setCandidatCampaignFilter}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Filtrer par campagne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les campagnes</SelectItem>
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nom} ({c.annee})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={dialogOpen.candidat} onOpenChange={(open) => setDialogOpen({ ...dialogOpen, candidat: open })}>
                <DialogTrigger asChild>
                  <Button disabled={campaigns.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau candidat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un candidat</DialogTitle>
                    <DialogDescription>Ajoutez un candidat à une campagne</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Prénom</Label>
                        <Input value={newCandidat.prenom} onChange={(e) => setNewCandidat({ ...newCandidat, prenom: e.target.value })} />
                      </div>
                      <div>
                        <Label>Nom</Label>
                        <Input value={newCandidat.nom} onChange={(e) => setNewCandidat({ ...newCandidat, nom: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={newCandidat.email} onChange={(e) => setNewCandidat({ ...newCandidat, email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Campagne</Label>
                      <Select value={newCandidat.campaign_id} onValueChange={(v) => setNewCandidat({ ...newCandidat, campaign_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la campagne" />
                        </SelectTrigger>
                        <SelectContent>
                          {campaigns.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.nom} ({c.annee})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Circonscription</Label>
                      <Input value={newCandidat.circonscription} onChange={(e) => setNewCandidat({ ...newCandidat, circonscription: e.target.value })} />
                    </div>
                    <div>
                      <Label>Plafond de dépenses (€)</Label>
                      <Input type="number" value={newCandidat.plafond_depenses} onChange={(e) => setNewCandidat({ ...newCandidat, plafond_depenses: parseFloat(e.target.value) })} />
                    </div>
                    <Button onClick={createCandidat} className="w-full">Créer le candidat</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredCandidats.length} candidat(s) trouvé(s)
            </div>

            <div className="grid gap-4">
              {filteredCandidats.map(candidat => (
                <Card key={candidat.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{candidat.prenom} {candidat.nom}</CardTitle>
                        <CardDescription>{candidat.email}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/10">
                          {getCampaignName(candidat.campaign_id)}
                        </Badge>
                        {candidat.user_id ? (
                          <Badge className="bg-success">Invité</Badge>
                        ) : (
                          <Button size="sm" onClick={() => openInviteDialog('candidat', candidat)} disabled={inviting}>
                            <Send className="h-4 w-4 mr-2" />
                            Inviter
                          </Button>
                        )}
                        <Button variant="outline" size="icon" onClick={() => openEditCandidatDialog(candidat)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" disabled={deleting === candidat.id}>
                              {deleting === candidat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le candidat ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Le candidat, ses opérations et son compte utilisateur seront supprimés.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCandidat(candidat)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {candidat.circonscription} • Plafond: {candidat.plafond_depenses?.toLocaleString('fr-FR')} €
                    </p>
                  </CardContent>
                </Card>
              ))}
              {filteredCandidats.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Aucun candidat trouvé</p>
              )}
            </div>

            {/* Dialog pour modifier le plafond */}
            <Dialog open={editCandidatDialog.open} onOpenChange={(open) => setEditCandidatDialog({ ...editCandidatDialog, open })}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier le plafond</DialogTitle>
                  <DialogDescription>
                    Modifier le plafond de dépenses de {editCandidatDialog.candidat?.prenom} {editCandidatDialog.candidat?.nom}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Plafond de dépenses (€)</Label>
                    <Input 
                      type="number" 
                      value={editPlafond} 
                      onChange={(e) => setEditPlafond(parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                  <Button onClick={updateCandidatPlafond} className="w-full" disabled={updating}>
                    {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Enregistrer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Mandataires Tab */}
          <TabsContent value="mandataires" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Filter size={18} className="text-muted-foreground" />
                <Select value={mandataireCampaignFilter} onValueChange={(v) => {
                  setMandataireCampaignFilter(v);
                  setMandataireCandidatFilter('all');
                }}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrer par campagne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les campagnes</SelectItem>
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nom} ({c.annee})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={mandataireCandidatFilter} onValueChange={setMandataireCandidatFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrer par candidat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les candidats</SelectItem>
                    {mandataireFilterCandidats.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={dialogOpen.mandataire} onOpenChange={(open) => setDialogOpen({ ...dialogOpen, mandataire: open })}>
                <DialogTrigger asChild>
                  <Button disabled={candidats.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau mandataire
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un mandataire</DialogTitle>
                    <DialogDescription>Ajoutez un mandataire et associez-le à un candidat</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Prénom</Label>
                        <Input value={newMandataire.prenom} onChange={(e) => setNewMandataire({ ...newMandataire, prenom: e.target.value })} />
                      </div>
                      <div>
                        <Label>Nom</Label>
                        <Input value={newMandataire.nom} onChange={(e) => setNewMandataire({ ...newMandataire, nom: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={newMandataire.email} onChange={(e) => setNewMandataire({ ...newMandataire, email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Candidat associé</Label>
                      <Select value={newMandataire.candidat_id} onValueChange={(v) => setNewMandataire({ ...newMandataire, candidat_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le candidat" />
                        </SelectTrigger>
                        <SelectContent>
                          {candidats.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.prenom} {c.nom} - {getCampaignName(c.campaign_id)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createMandataire} className="w-full">Créer le mandataire</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredMandataires.length} mandataire(s) trouvé(s)
            </div>

            <div className="grid gap-4">
              {filteredMandataires.map(mandataire => {
                const linkedCandidats = getMandataireCandidats(mandataire.id);
                const linkedCampaigns = getMandataireCampaigns(mandataire.id);
                
                return (
                  <Card key={mandataire.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{mandataire.prenom} {mandataire.nom}</CardTitle>
                          <CardDescription>{mandataire.email}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {mandataire.user_id ? (
                            <Badge className="bg-success">Invité</Badge>
                          ) : (
                            <Button size="sm" onClick={() => openInviteDialog('mandataire', mandataire)} disabled={inviting}>
                              <Send className="h-4 w-4 mr-2" />
                              Inviter
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" disabled={deleting === mandataire.id}>
                                {deleting === mandataire.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer le mandataire ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. Le mandataire, ses opérations et son compte utilisateur seront supprimés.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMandataire(mandataire)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {linkedCampaigns.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-muted-foreground">Campagnes:</span>
                          {linkedCampaigns.map(c => (
                            <Badge key={c.id} variant="outline" className="bg-primary/10">
                              {c.nom} ({c.annee})
                            </Badge>
                          ))}
                        </div>
                      )}
                      {linkedCandidats.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-muted-foreground">Candidats:</span>
                          {linkedCandidats.map(c => (
                            <Badge key={c.id} variant="secondary">
                              {c.prenom} {c.nom}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {linkedCandidats.length === 0 && (
                        <p className="text-sm text-warning">Aucun candidat associé</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {filteredMandataires.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Aucun mandataire trouvé</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Invite Dialog */}
        <Dialog open={inviteDialog.open} onOpenChange={(open) => setInviteDialog({ ...inviteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Inviter {inviteDialog.record?.prenom} {inviteDialog.record?.nom}
              </DialogTitle>
              <DialogDescription>
                Créez un compte pour ce {inviteDialog.type}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={inviteDialog.record?.email || ''} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Mot de passe personnalisé (optionnel)</Label>
                <Input 
                  type="text" 
                  value={inviteOptions.customPassword} 
                  onChange={(e) => setInviteOptions({ ...inviteOptions, customPassword: e.target.value })}
                  placeholder="Laisser vide pour générer automatiquement"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Si vide, un mot de passe temporaire sera généré automatiquement
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="skipEmail" 
                  checked={inviteOptions.skipEmail}
                  onCheckedChange={(checked) => setInviteOptions({ ...inviteOptions, skipEmail: checked === true })}
                />
                <Label htmlFor="skipEmail" className="text-sm font-normal cursor-pointer">
                  Ne pas envoyer d'email (mode test)
                </Label>
              </div>
              <Button onClick={inviteUser} className="w-full" disabled={inviting}>
                {inviting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Créer le compte
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
