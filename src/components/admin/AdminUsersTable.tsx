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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AdminUser {
  id: string;
  full_name?: string;
  company_name?: string;
  email: string;
  is_verified: boolean;
  is_banned: boolean;
  is_premium: boolean;
  created_at: string;
  admin_notes?: string;
}

export function AdminUsersTable() {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const [techniciansRes, companiesRes] = await Promise.all([
        supabase.from('technicians').select('*').order('created_at', { ascending: false }),
        supabase.from('companies').select('*').order('created_at', { ascending: false }),
      ]);

      const technicians = (techniciansRes.data || []).map((t: any) => ({
        ...t,
        type: 'technician',
      }));
      const companies = (companiesRes.data || []).map((c: any) => ({
        ...c,
        type: 'company',
      }));

      return [...technicians, ...companies];
    },
  });

  // Ban user mutation
  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: authData } = await supabase.auth.getUser();
      const { data, error } = await (supabase.rpc as any)('ban_user', {
        _user_id: userId,
        _banned_by: authData.user?.id,
        _reason: banReason,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowBanDialog(false);
      setSelectedUser(null);
      setBanReason('');
    },
  });

  const handleBanUser = async () => {
    if (selectedUser) {
      await banMutation.mutateAsync(selectedUser.id);
    }
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Utilizadores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Verificado</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name || user.company_name || 'N/A'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.type === 'technician' ? 'Técnico' : 'Empresa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_verified ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_premium ? (
                      <Badge>Premium</Badge>
                    ) : (
                      <Badge variant="secondary">Básico</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_banned ? (
                      <Badge variant="destructive">Banido</Badge>
                    ) : (
                      <Badge variant="default">Ativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={user.is_banned}
                      onClick={() => {
                        setSelectedUser(user);
                        setShowBanDialog(true);
                      }}
                    >
                      {user.is_banned ? 'Banido' : 'Banir'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Banir Utilizador?</AlertDialogTitle>
            <AlertDialogDescription>
              Está prestes a banir {selectedUser?.full_name || selectedUser?.company_name}. Esta ação é
              irreversível a menos que desbaneie manualmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Motivo (opcional)
              </label>
              <textarea
                id="reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Descreva o motivo do banimento..."
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              disabled={banMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {banMutation.isPending ? 'Banindo...' : 'Banir Utilizador'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
