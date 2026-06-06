import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/admin-permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, AlertCircle, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentProof {
  id: string;
  owner_id: string;
  subscription_id: string | null;
  amount: number;
  proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
  plan: string;
  subscription?: {
    owner_id: string;
    owner_type: 'technician' | 'company';
    plan: string;
    profiles?: {
      full_name?: string;
      email?: string;
    };
  };
}

export function AdminPaymentProofsTable() {
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<PaymentProof | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch payment proofs with subscription details
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['admin-payment-proofs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_proofs')
        .select(`
          *,
          subscription:subscriptions(
            owner_id,
            owner_type,
            plan,
            profiles:owner_id(full_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Approve payment proof
  const approveMutation = useMutation({
    mutationFn: async ({ paymentId, notes }: { paymentId: string; notes?: string }) => {
      const { error: paymentError } = await supabase
        .from('payment_proofs')
        .update({
          status: 'approved',
          reviewer_id: (await supabase.auth.getUser()).data.user?.id,
          review_notes: notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      const payment = payments.find(p => p.id === paymentId);
      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }

      let subscriptionId = payment.subscription_id;
      if (!subscriptionId) {
        const ownerType = payment.plan === 'empresa_mensal' ? 'company' : 'technician';
        const { data: newSub, error: subCreateError } = await supabase
          .from('subscriptions')
          .insert({
            owner_id: payment.owner_id,
            owner_type: ownerType,
            plan: payment.plan,
            status: 'active',
            start_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (subCreateError || !newSub) {
          throw subCreateError || new Error('Erro ao criar assinatura de aprovação.');
        }

        subscriptionId = newSub.id;
        const { error: linkError } = await supabase
          .from('payment_proofs')
          .update({ subscription_id: subscriptionId })
          .eq('id', paymentId);

        if (linkError) throw linkError;
      }

      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          start_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (subError) throw subError;

      // Log the action
      await supabase.from('admin_logs').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'PAYMENT_APPROVED',
        entity_type: 'payment_proof',
        entity_id: paymentId,
        entity_data: payment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats-complete'] });
      setSelectedPayment(null);
      setApproveDialogOpen(false);
      setReviewNotes('');
    },
    onError: (error) => {
      console.error('Erro ao aprovar:', error);
    },
  });

  // Reject payment proof
  const rejectMutation = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      if (!reason.trim()) {
        throw new Error('Motivo da rejeição é obrigatório');
      }

      const { error } = await supabase
        .from('payment_proofs')
        .update({
          status: 'rejected',
          reviewer_id: (await supabase.auth.getUser()).data.user?.id,
          review_notes: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Log the action
      const payment = payments.find(p => p.id === paymentId);
      if (payment) {
        await supabase.from('admin_logs').insert({
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'PAYMENT_REJECTED',
          entity_type: 'payment_proof',
          entity_id: paymentId,
          entity_data: { ...payment, rejection_reason: reason },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats-complete'] });
      setRejectDialogOpen(false);
      setReviewNotes('');
      setSelectedPayment(null);
    },
    onError: (error) => {
      console.error('Erro ao rejeitar:', error);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Carregando comprovantes...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = payments.filter((p: PaymentProof) => p.status === 'pending').length;
  const approvedCount = payments.filter((p: PaymentProof) => p.status === 'approved').length;
  const rejectedCount = payments.filter((p: PaymentProof) => p.status === 'rejected').length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gestão de Comprovantes de Pagamento
              </CardTitle>
              <div className="flex gap-4 mt-2">
                <div className="text-sm">
                  <span className="text-gray-500">Total:</span> <span className="font-semibold">{payments.length}</span>
                </div>
                <div className="text-sm">
                  <span className="text-yellow-600">⚠️ Pendentes:</span>{' '}
                  <span className="font-semibold text-yellow-600">{pendingCount}</span>
                </div>
                <div className="text-sm">
                  <span className="text-green-600">✓ Aprovados:</span>{' '}
                  <span className="font-semibold text-green-600">{approvedCount}</span>
                </div>
                {rejectedCount > 0 && (
                  <div className="text-sm">
                    <span className="text-red-600">✗ Rejeitados:</span>{' '}
                    <span className="font-semibold text-red-600">{rejectedCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum comprovante encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilizador</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prova</TableHead>
                    <TableHead>Data de Envio</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: PaymentProof) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {payment.subscription?.profiles?.full_name || 'Sem nome'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.subscription?.plan || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {payment.amount.toLocaleString('pt-AO')} Kz
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {payment.status === 'approved' && (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                Aprovado
                              </Badge>
                            </>
                          )}
                          {payment.status === 'pending' && (
                            <>
                              <Clock className="w-4 h-4 text-yellow-500" />
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                Pendente
                              </Badge>
                            </>
                          )}
                          {payment.status === 'rejected' && (
                            <>
                              <XCircle className="w-4 h-4 text-red-500" />
                              <Badge className="bg-red-100 text-red-800 border-red-300">Rejeitado</Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-2"
                          onClick={() => setPreviewUrl(payment.proof_url)}
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {payment.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setApproveDialogOpen(true);
                              }}
                              disabled={approveMutation.isPending}
                            >
                              {approveMutation.isPending ? '⏳...' : '✓ Aprovar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setRejectDialogOpen(true);
                              }}
                              disabled={rejectMutation.isPending}
                            >
                              {rejectMutation.isPending ? '⏳...' : '✗ Rejeitar'}
                            </Button>
                          </div>
                        )}
                        {payment.status !== 'pending' && (
                          <div className="text-sm text-gray-500">
                            {payment.reviewed_at
                              ? `Revisto em ${format(new Date(payment.reviewed_at), 'dd/MM/yyyy', {
                                  locale: ptBR,
                                })}`
                              : 'Sem revisor'}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visualização do Comprovante</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex justify-center">
              <img src={previewUrl} alt="Comprovante" className="max-h-96 rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      {selectedPayment && (
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Comprovante</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="font-semibold text-sm">Utilizador</label>
                <p className="text-gray-700">
                  {selectedPayment.subscription?.profiles?.full_name || 'N/A'}
                </p>
              </div>
              <div>
                <label className="font-semibold text-sm">Valor</label>
                <p className="text-gray-700">
                  {selectedPayment.amount.toLocaleString('pt-AO')} Kz
                </p>
              </div>
              <div>
                <label className="font-semibold text-sm">Notas da Revisão</label>
                <Textarea
                  placeholder="Adicione notas sobre a aprovação (opcional)..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() =>
                  approveMutation.mutate({
                    paymentId: selectedPayment.id,
                    notes: reviewNotes,
                  })
                }
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? '⏳ Aprovando...' : '✓ Aprovar Pagamento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      {selectedPayment && (
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Comprovante</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="font-semibold text-sm">Utilizador</label>
                <p className="text-gray-700">
                  {selectedPayment.subscription?.profiles?.full_name || 'N/A'}
                </p>
              </div>
              <div>
                <label className="font-semibold text-sm">Motivo da Rejeição *</label>
                <Textarea
                  placeholder="Explique o motivo da rejeição (ex: comprovante não legível, valor incorreto)..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() =>
                  rejectMutation.mutate({
                    paymentId: selectedPayment.id,
                    reason: reviewNotes,
                  })
                }
                disabled={rejectMutation.isPending || !reviewNotes.trim()}
              >
                {rejectMutation.isPending ? '⏳ Rejeitando...' : '✗ Rejeitar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
