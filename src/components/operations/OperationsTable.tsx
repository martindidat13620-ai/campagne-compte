import { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Operation, ValidationStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface OperationsTableProps {
  operations: Operation[];
  showValidationActions?: boolean;
  showDeleteAction?: boolean;
  onValidate?: (id: string) => void;
  onReject?: (id: string, comment: string) => void;
  onDelete?: (id: string) => Promise<void>;
}

export function OperationsTable({ 
  operations, 
  showValidationActions = false,
  showDeleteAction = false,
  onValidate,
  onReject,
  onDelete
}: OperationsTableProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredOps = useMemo(() => {
    return operations
      .filter(op => {
        const matchesSearch = 
          (op.beneficiaire?.toLowerCase().includes(search.toLowerCase()) || '') ||
          (op.donateur_nom?.toLowerCase().includes(search.toLowerCase()) || '') ||
          op.categorie.toLowerCase().includes(search.toLowerCase());
        
        const matchesType = typeFilter === 'all' || op.type_operation === typeFilter;
        const matchesStatus = statusFilter === 'all' || op.statut_validation === statusFilter;
        
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [operations, search, typeFilter, statusFilter]);

  const getStatusBadge = (status: ValidationStatus) => {
    switch (status) {
      case 'validee':
        return (
          <Badge variant="outline" className="badge-validated gap-1">
            <CheckCircle2 size={12} />
            Validée
          </Badge>
        );
      case 'rejetee':
        return (
          <Badge variant="outline" className="badge-rejected gap-1">
            <XCircle size={12} />
            Refusée
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="badge-pending gap-1">
            <Clock size={12} />
            En attente
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Montant', 'Catégorie', 'Bénéficiaire/Donateur', 'Statut'];
    const rows = filteredOps.map(op => [
      op.date,
      op.type_operation,
      op.montant,
      op.categorie,
      op.beneficiaire || op.donateur_nom || '',
      op.statut_validation
    ]);

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `operations_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter size={16} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="depense">Dépenses</SelectItem>
              <SelectItem value="recette">Recettes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="validee">Validée</SelectItem>
              <SelectItem value="rejetee">Refusée</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportCSV}>
            <Download size={16} className="mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Catégorie</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="hidden sm:table-cell">Statut</TableHead>
              <TableHead className="w-[80px]">Pièce</TableHead>
              {showValidationActions && <TableHead className="w-[100px]">Actions</TableHead>}
              {showDeleteAction && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showValidationActions ? 7 : (showDeleteAction ? 7 : 6)} className="text-center py-8 text-muted-foreground">
                  Aucune opération trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredOps.map((op) => (
                <TableRow 
                  key={op.id} 
                  className={cn(
                    "table-row-hover cursor-pointer",
                    !op.justificatif_url && op.type_operation === 'depense' && 'bg-destructive/5'
                  )}
                  onClick={() => setSelectedOp(op)}
                >
                  <TableCell className="font-medium text-muted-foreground">
                    {formatDate(op.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1.5 rounded-md",
                        op.type_operation === 'depense' ? 'bg-destructive/10' : 'bg-success/10'
                      )}>
                        {op.type_operation === 'depense' ? (
                          <ArrowUpRight size={14} className="text-destructive" />
                        ) : (
                          <ArrowDownLeft size={14} className="text-success" />
                        )}
                      </div>
                      <span className="font-medium truncate max-w-[200px]">
                        {op.beneficiaire || op.donateur_nom || op.categorie}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {op.categorie}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold",
                    op.type_operation === 'depense' ? 'text-destructive' : 'text-success'
                  )}>
                    {op.type_operation === 'depense' ? '-' : '+'}{op.montant.toLocaleString('fr-FR')} €
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {getStatusBadge(op.statut_validation)}
                  </TableCell>
                  <TableCell>
                    {op.justificatif_url ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-accent">
                        <FileText size={16} />
                      </Button>
                    ) : (
                      op.type_operation === 'depense' && (
                        <span className="text-xs text-destructive">Manquant</span>
                      )
                    )}
                  </TableCell>
                  {showValidationActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {op.statut_validation === 'en_attente' && (
                          <>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-success hover:bg-success/10"
                              onClick={() => onValidate?.(op.id)}
                            >
                              <CheckCircle2 size={16} />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => onReject?.(op.id, 'Justificatif insuffisant')}
                            >
                              <XCircle size={16} />
                            </Button>
                          </>
                        )}
                        {onDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                disabled={deletingId === op.id}
                              >
                                {deletingId === op.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer cette opération ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {op.statut_validation === 'validee' ? (
                                    <>Attention, vous avez validé cette {op.type_operation === 'depense' ? 'dépense' : 'recette'}. Êtes-vous sûr de vouloir la supprimer ?</>
                                  ) : (
                                    <>Cette action est irréversible. L'opération de {op.montant.toLocaleString('fr-FR')} € sera définitivement supprimée.</>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(op.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {showDeleteAction && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            disabled={deletingId === op.id}
                          >
                            {deletingId === op.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette opération ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. L'opération de {op.montant.toLocaleString('fr-FR')} € sera définitivement supprimée.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(op.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOp} onOpenChange={() => setSelectedOp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail de l'opération</DialogTitle>
          </DialogHeader>
          {selectedOp && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-lg",
                  selectedOp.type_operation === 'depense' ? 'bg-destructive/10' : 'bg-success/10'
                )}>
                  {selectedOp.type_operation === 'depense' ? (
                    <ArrowUpRight size={24} className="text-destructive" />
                  ) : (
                    <ArrowDownLeft size={24} className="text-success" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {selectedOp.beneficiaire || selectedOp.donateur_nom || selectedOp.categorie}
                  </p>
                  <p className="text-muted-foreground">{selectedOp.categorie}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedOp.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant</p>
                  <p className={cn(
                    "font-bold text-lg",
                    selectedOp.type_operation === 'depense' ? 'text-destructive' : 'text-success'
                  )}>
                    {selectedOp.montant.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mode de paiement</p>
                  <p className="font-medium capitalize">{selectedOp.mode_paiement}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  {getStatusBadge(selectedOp.statut_validation)}
                </div>
              </div>

              {selectedOp.commentaire && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Commentaire</p>
                  <p className="text-foreground">{selectedOp.commentaire}</p>
                </div>
              )}

              {selectedOp.commentaire_comptable && (
                <div className="p-3 bg-warning/10 rounded-lg">
                  <p className="text-sm font-medium text-warning mb-1">Note du comptable</p>
                  <p className="text-foreground">{selectedOp.commentaire_comptable}</p>
                </div>
              )}

              {selectedOp.justificatif_url && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={async () => {
                    const { data } = await supabase.storage
                      .from('justificatifs')
                      .createSignedUrl(selectedOp.justificatif_url!, 3600);
                    if (data?.signedUrl) {
                      window.open(data.signedUrl, '_blank');
                    }
                  }}
                >
                  <ExternalLink size={16} className="mr-2" />
                  Voir le justificatif
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
