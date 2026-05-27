import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase, logAdminAction } from '@/lib/admin-permissions';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function AdminManagement() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [makeSuper, setMakeSuper] = useState(false);

  // Fetch admins
  const { data: admins = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-list'],
    queryFn: async () => {
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(
          `
          id,
          user_id,
          role,
          profiles!user_roles_user_id_fkey(email)
        `
        )
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const { data: superAdmins, error: superError } = await supabase
        .from('super_admins')
        .select('user_id');

      if (superError) throw superError;

      const superAdminIds = new Set(superAdmins?.map((s) => s.user_id) || []);

      return (
        adminRoles?.map((admin: any) => ({
          ...admin,
          is_super_admin: superAdminIds.has(admin.user_id),
        })) || []
      );
    },
  });

  const handleMakeSuperAdmin = async (userId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Tem certeza que quer promover este admin a Super Admin?')) return;

    try {
      const { error } = await supabase.from('super_admins').insert({
        user_id: userId,
        created_by: currentUser.id,
      });

      if (error) throw error;

      await logAdminAction(currentUser.id, 'admin_promoted', 'admin', userId);

      toast.success('Admin promovido a Super Admin');
      refetch();
    } catch (error) {
      toast.error('Erro ao promover admin');
    }
  };

  const handleRemoveSuperAdmin = async (userId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Tem certeza que quer remover Super Admin deste utilizador?')) return;

    try {
      const { error } = await supabase.from('super_admins').delete().eq('user_id', userId);

      if (error) throw error;

      await logAdminAction(currentUser.id, 'admin_demoted', 'admin', userId);

      toast.success('Permissão de Super Admin removida');
      refetch();
    } catch (error) {
      toast.error('Erro ao remover permissão');
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Tem certeza que quer remover permissões de admin deste utilizador?')) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      // Also remove super admin if exists
      await supabase.from('super_admins').delete().eq('user_id', userId);

      await logAdminAction(currentUser.id, 'admin_removed', 'admin', userId);

      toast.success('Admin removido');
      refetch();
    } catch (error) {
      toast.error('Erro ao remover admin');
    }
  };

  const handleAddAdmin = async () => {
    if (!currentUser || !newAdminEmail.trim()) return;

    try {
      // First, get user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newAdminEmail)
        .single();

      if (userError || !userData) {
        toast.error('Utilizador não encontrado');
        return;
      }

      const userId = userData.id;

      // Check if already admin
      const { data: existingAdmin } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();

      if (existingAdmin) {
        toast.error('Este utilizador já é admin');
        return;
      }

      // Add admin role
      const { error: insertError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'admin',
      });

      if (insertError) throw insertError;

      // If makeSuper is checked, also add to super_admins
      if (makeSuper) {
        await supabase.from('super_admins').insert({
          user_id: userId,
          created_by: currentUser.id,
        });
      }

      await logAdminAction(currentUser.id, 'admin_added', 'admin', userId);

      toast.success(`${makeSuper ? 'Super A' : 'A'}dmin adicionado com sucesso`);
      setNewAdminEmail('');
      setMakeSuper(false);
      setShowAddAdminDialog(false);
      refetch();
    } catch (error) {
      toast.error('Erro ao adicionar admin');
    }
  };

  const filteredAdmins = admins.filter((a: any) =>
    a.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Admins</h1>
        <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
          <DialogTrigger asChild>
            <Button>+ Adicionar Admin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Email do utilizador"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={makeSuper}
                  onChange={(e) => setMakeSuper(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Tornar Super Admin</span>
              </label>
              <Button onClick={handleAddAdmin} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Input
        placeholder="Pesquisar por email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admins Registados ({filteredAdmins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filteredAdmins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-left py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((admin: any) => (
                    <tr key={admin.id} className="border-b hover:bg-muted/50">
                      <td className="py-3">{admin.profiles?.email}</td>
                      <td className="py-3">
                        {admin.is_super_admin ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                            Super Admin
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          {!admin.is_super_admin && currentUser?.id !== admin.user_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMakeSuperAdmin(admin.user_id)}
                            >
                              Promover
                            </Button>
                          )}
                          {admin.is_super_admin && currentUser?.id !== admin.user_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveSuperAdmin(admin.user_id)}
                            >
                              Remover Super
                            </Button>
                          )}
                          {currentUser?.id !== admin.user_id && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveAdmin(admin.user_id)}
                            >
                              Remover Admin
                            </Button>
                          )}
                          {currentUser?.id === admin.user_id && (
                            <span className="text-xs text-muted-foreground">Você</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum admin encontrado</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/admin/admins')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.SUPER_ADMIN}>
      <AdminManagement />
    </ProtectedAdminRoute>
  ),
});
