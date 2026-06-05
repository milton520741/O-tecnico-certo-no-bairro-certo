import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Subscription {
  id: number;
  owner_id: string;
  owner_type: 'technician' | 'company';
  plan: 'simples' | 'premium' | 'empresa_mensal';
  status: 'pending' | 'active' | 'expired' | 'rejected';
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
  } | null;
}

const PLAN_PRICES: Record<string, { label: string; price: number }> = {
  simples: { label: 'Simples', price: 1000 },
  premium: { label: 'Premium', price: 2000 },
  empresa_mensal: { label: 'Empresa', price: 10000 },
};

export function AdminSubscriptionsTable() {
  const queryClient = useQueryClient();
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch subscriptions with user details
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          profiles:owner_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Subscription[];
    },
  });

  // Approve subscription
  const approveMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
          start_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setSelectedSubscription(null);
    },
  });

  // Reject subscription
  const rejectMutation = useMutation({
    mutationFn: async ({
      subscriptionId,
      reason,
    }: {
      subscriptionId: number;
      reason: string;
    }) => {
      if (!reason.trim()) {
        throw new Error('Motivo da rejeição é obrigatório');
      }

      const { error } = await (supabase
        .from('subscriptions') as any)
        .update({
          status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedSubscription(null);
    },
    onError: (error) => {
      console.error('Erro ao rejeitar:', error);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Carregando assinaturas...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = subscriptions.filter((s: Subscription) => s.status === 'pending').length;
  const activeCount = subscriptions.filter((s: Subscription) => s.status === 'active').length;
  const rejectedCount = subscriptions.filter((s: Subscription) => s.status === 'rejected').length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Assinaturas</CardTitle>
              <div className="flex gap-4 mt-2">
                <div className="text-sm">
                  <span className="text-gray-500">Total:</span> <span className="font-semibold">{subscriptions.length}</span>
                </div>
                <div className="text-sm">
                  <span className="text-yellow-600">⚠️ Pendentes:</span> <span className="font-semibold text-yellow-600">{pendingCount}</span>
                </div>
                <div className="text-sm">
                  <span className="text-green-600">✓ Ativas:</span> <span className="font-semibold text-green-600">{activeCount}</span>
                </div>
                {rejectedCount > 0 && (
                  <div className="text-sm">
                    <span className="text-red-600">✗ Rejeitadas:</span> <span className="font-semibold text-red-600">{rejectedCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma assinatura encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilizador</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub: Subscription) => (
                    <TableRow key={sub.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {sub.profiles?.full_name || 'Sem nome'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {sub.profiles?.email || 'Sem email'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PLAN_PRICES[sub.plan]?.label || sub.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {PLAN_PRICES[sub.plan]?.price.toLocaleString('pt-AO')} Kz
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {sub.status === 'active' && (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <Badge className="bg-green-100 text-green-800 border-green-300">Ativa</Badge>
                            </>
                          )}
                          {sub.status === 'pending' && (
                            <>
                              <Clock className="w-4 h-4 text-yellow-500" />
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>
                            </>
                          )}
                          {sub.status === 'expired' && (
                            <>
                              <AlertCircle className="w-4 h-4 text-gray-500" />
                              <Badge className="bg-gray-100 text-gray-800 border-gray-300">Expirada</Badge>
                            </>
                          )}
                          {sub.status === 'rejected' && (
                            <>
                              <XCircle className="w-4 h-4 text-red-500" />
                              <Badge className="bg-red-100 text-red-800 border-red-300">Rejeitada</Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(sub.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {sub.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => approveMutation.mutate(sub.id)}
                              disabled={approveMutation.isPending}
                            >
                              {approveMutation.isPending ? '⏳...' : '✓ Aprovar'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedSubscription(sub);
                                setRejectDialogOpen(true);
                              }}
                            >
                              ✗ Rejeitar
                            </Button>
                          </div>
                        )}
                        {sub.status !== 'pending' && (
                          <span className="text-gray-400 text-sm">—</span>
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

      {/* Modal de Rejeição */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Rejeitar Assinatura
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedSubscription && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700">Utilizador:</span>
                    <br />
                    <span className="text-blue-900">{selectedSubscription.profiles?.full_name}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700">Email:</span>
                    <br />
                    <span className="text-blue-900">{selectedSubscription.profiles?.email}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700">Plano:</span>
                    <br />
                    <span className="text-blue-900">
                      {PLAN_PRICES[selectedSubscription.plan]?.label} ({PLAN_PRICES[selectedSubscription.plan]?.price.toLocaleString('pt-AO')} Kz)
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Motivo da Rejeição <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Ex: Documento inválido, suspeita de fraude, dados incompletos, informações não correspondem..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-28 border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 flex items-start gap-1">
                <span>ℹ️</span>
                <span>O utilizador receberá uma notificação com este motivo por email</span>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
              }}
              disabled={rejectMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedSubscription) {
                  rejectMutation.mutate({
                    subscriptionId: selectedSubscription.id,
                    reason: rejectReason,
                  });
                }
              }}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? '⏳ Rejeitando...' : 'Rejeitar Assinatura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

