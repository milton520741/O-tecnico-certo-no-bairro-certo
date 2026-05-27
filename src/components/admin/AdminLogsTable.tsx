import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/admin-permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, any>;
  created_at: string;
}

export function AdminLogsTable({ limit = 50 }: { limit?: number }) {
  // Fetch admin logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'bg-blue-100 text-blue-800';
    if (action.includes('updated')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('deleted')) return 'bg-red-100 text-red-800';
    if (action.includes('banned')) return 'bg-red-100 text-red-800';
    if (action.includes('verified')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      user_created: 'Utilizador Criado',
      user_updated: 'Utilizador Atualizado',
      user_deleted: 'Utilizador Eliminado',
      user_banned: 'Utilizador Banido',
      user_verified: 'Utilizador Verificado',
      subscription_approved: 'Assinatura Aprovada',
      subscription_rejected: 'Assinatura Rejeitada',
      payment_reviewed: 'Pagamento Revisado',
    };
    return labels[action] || action;
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registos de Atividade</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ação</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Alterações</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: AdminLog) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge className={getActionColor(log.action)}>
                    {getActionLabel(log.action)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{log.entity_type}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{log.entity_id?.slice(0, 8) || '—'}</TableCell>
                <TableCell className="text-xs">
                  {log.changes ? (
                    <div className="bg-muted p-2 rounded font-mono max-w-xs overflow-auto">
                      {Object.entries(log.changes)
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <div key={key}>
                            <span className="text-blue-600">{key}:</span>{' '}
                            <span className="text-green-600">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      {Object.keys(log.changes).length > 2 && (
                        <div className="text-muted-foreground">+{Object.keys(log.changes).length - 2} mais</div>
                      )}
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(log.created_at), 'PPp', { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
