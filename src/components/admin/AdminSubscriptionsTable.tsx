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
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Subscription {
  id: string;
  owner_id: string;
  plan: 'simples' | 'premium' | 'empresa_mensal';
  status: 'pending' | 'active' | 'expired' | 'rejected';
  start_at: string;
  end_at: string;
  created_at: string;
}

export function AdminSubscriptionsTable() {
  const queryClient = useQueryClient();
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Fetch subscriptions
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Approve subscription
  const approveMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
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
      subscriptionId: string;
      reason: string;
    }) => {
      const { error } = await supabase
        .from('subscriptions')
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
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'simples':
        return 'Simples';
      case 'premium':
        return 'Premium';
      case 'empresa_mensal':
        return 'Empresa';
      default:
        return plan;
    }
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Assinaturas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Início</TableHead>
              <TableHead>Data de Fim</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub: Subscription) => (
              <TableRow key={sub.id}>
                <TableCell className="font-mono text-sm">{sub.id.slice(0, 8)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getPlanLabel(sub.plan)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {sub.status === 'active' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {sub.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                    {sub.status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                    <Badge className={getStatusColor(sub.status)}>
                      {sub.status === 'pending' ? 'Pendente' : sub.status === 'active' ? 'Ativa' : sub.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {sub.start_at ? format(new Date(sub.start_at), 'PPP', { locale: ptBR }) : '—'}
                </TableCell>
                <TableCell>
                  {sub.end_at ? format(new Date(sub.end_at), 'PPP', { locale: ptBR }) : '—'}
                </TableCell>
                <TableCell>{format(new Date(sub.created_at), 'PPP', { locale: ptBR })}</TableCell>
                <TableCell>
                  {sub.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => approveMutation.mutate(sub.id)}
                        disabled={approveMutation.isPending}
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectMutation.mutate({ subscriptionId: sub.id, reason: '' })}
                        disabled={rejectMutation.isPending}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
