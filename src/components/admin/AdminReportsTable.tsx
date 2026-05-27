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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  priority: 'normal' | 'high' | 'critical';
  assigned_to: string;
  resolution: string;
  created_at: string;
  resolved_at: string;
}

export function AdminReportsTable() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [resolution, setResolution] = useState('');

  // Fetch reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Resolve report mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ reportId, newStatus }: { reportId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('user_reports')
        .update({
          status: newStatus,
          resolution: resolution,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setShowDialog(false);
      setSelectedReport(null);
      setResolution('');
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div>Carregando...</div>;

  const pendingReports = reports.filter((r: UserReport) => r.status === 'pending');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Denúncias ({pendingReports.length} pendentes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Motivo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report: UserReport) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.reason}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(report.priority)}>
                      {report.priority === 'critical'
                        ? 'Crítica'
                        : report.priority === 'high'
                          ? 'Alta'
                          : 'Normal'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status === 'pending'
                        ? 'Pendente'
                        : report.status === 'resolved'
                          ? 'Resolvido'
                          : 'Rejeitado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {report.description}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(report.created_at), 'PPP', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReport(report);
                        setShowDialog(true);
                      }}
                    >
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Denúncia</DialogTitle>
            <DialogDescription>
              {selectedReport?.status === 'pending' && 'Esta denúncia ainda não foi processada.'}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Motivo</p>
                  <p>{selectedReport.reason}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prioridade</p>
                  <Badge className={getPriorityColor(selectedReport.priority)}>
                    {selectedReport.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedReport.status)}>
                    {selectedReport.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data</p>
                  <p>{format(new Date(selectedReport.created_at), 'PPp', { locale: ptBR })}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Descrição</p>
                <p className="bg-muted p-3 rounded">{selectedReport.description}</p>
              </div>

              {selectedReport.status === 'pending' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Resolução
                    </label>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Descreva a ação tomada..."
                      className="w-full border rounded p-2 text-sm mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Fechar
            </Button>
            {selectedReport?.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() =>
                    resolveMutation.mutate({ reportId: selectedReport.id, newStatus: 'dismissed' })
                  }
                  disabled={resolveMutation.isPending}
                >
                  Rejeitar
                </Button>
                <Button
                  onClick={() =>
                    resolveMutation.mutate({ reportId: selectedReport.id, newStatus: 'resolved' })
                  }
                  disabled={resolveMutation.isPending || !resolution}
                >
                  Resolver
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
