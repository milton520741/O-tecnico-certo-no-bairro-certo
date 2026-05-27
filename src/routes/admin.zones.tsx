import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase, logAdminAction } from '@/lib/admin-permissions';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function AdminZones() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewZoneDialog, setShowNewZoneDialog] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');

  // Fetch zones
  const { data: zones = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const handleCreateZone = async () => {
    if (!currentUser || !newZoneName.trim()) return;

    try {
      const slug = newZoneName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const { error } = await supabase.from('zones').insert({
        name: newZoneName,
        slug,
      });

      if (error) throw error;

      await logAdminAction(currentUser.id, 'zone_created', 'zone', undefined, {
        name: newZoneName,
      });

      toast.success('Bairro criado com sucesso');
      setNewZoneName('');
      setShowNewZoneDialog(false);
      refetch();
    } catch (error) {
      toast.error('Erro ao criar bairro');
    }
  };

  const handleDeleteZone = async (zoneId: number, zoneName: string) => {
    if (!currentUser) return;
    if (!window.confirm(`Tem certeza que quer deletar "${zoneName}"?`)) return;

    try {
      const { error } = await supabase.from('zones').delete().eq('id', zoneId);

      if (error) throw error;

      await logAdminAction(currentUser.id, 'zone_deleted', 'zone', undefined, {
        id: zoneId,
        name: zoneName,
      });

      toast.success('Bairro deletado com sucesso');
      refetch();
    } catch (error) {
      toast.error('Erro ao deletar bairro');
    }
  };

  const filteredZones = zones.filter((z: any) =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Bairros</h1>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Bairros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{zones.length}</div>
        </CardContent>
      </Card>

      {/* Zones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bairros em Luanda</CardTitle>
          <Dialog open={showNewZoneDialog} onOpenChange={setShowNewZoneDialog}>
            <DialogTrigger asChild>
              <Button>+ Novo Bairro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Bairro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome do bairro (ex: Maianga)"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                />
                <Button onClick={handleCreateZone} className="w-full">
                  Criar Bairro
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Pesquisar bairros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filteredZones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredZones.map((zone: any) => (
                <div
                  key={zone.id}
                  className="p-4 border rounded-lg flex items-center justify-between hover:bg-muted/50"
                >
                  <div>
                    <p className="font-semibold">{zone.name}</p>
                    <p className="text-sm text-muted-foreground">{zone.slug}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteZone(zone.id, zone.name)}
                  >
                    Deletar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum bairro encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Você pode gerenciar todos os bairros de Luanda aqui. Crie, edite ou delete bairros
            conforme necessário. Os técnicos e empresas podem selecionar os bairros onde operam.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/admin/zones')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}>
      <AdminZones />
    </ProtectedAdminRoute>
  ),
});
