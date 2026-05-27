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

function AdminServices() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewServiceDialog, setShowNewServiceDialog] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch services
  const { data: services = [], isLoading: loadingServices, refetch: refetchServices } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch service categories
  const {
    data: categories = [],
    isLoading: loadingCategories,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['admin-service-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const handleCreateService = async () => {
    if (!currentUser || !newServiceName.trim()) return;

    try {
      const slug = newServiceName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const { error } = await supabase.from('services').insert({
        name: newServiceName,
        slug,
        icon: 'Wrench',
      });

      if (error) throw error;

      await logAdminAction(currentUser.id, 'service_created', 'service', undefined, {
        name: newServiceName,
      });

      toast.success('Serviço criado com sucesso');
      setNewServiceName('');
      setShowNewServiceDialog(false);
      refetchServices();
    } catch (error) {
      toast.error('Erro ao criar serviço');
    }
  };

  const handleCreateCategory = async () => {
    if (!currentUser || !newCategoryName.trim()) return;

    try {
      const slug = newCategoryName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const { error } = await supabase.from('service_categories').insert({
        name: newCategoryName,
        slug,
        icon: 'Folder',
      });

      if (error) throw error;

      await logAdminAction(currentUser.id, 'category_created', 'service_category', undefined, {
        name: newCategoryName,
      });

      toast.success('Categoria criada com sucesso');
      setNewCategoryName('');
      setShowNewCategoryDialog(false);
      refetchCategories();
    } catch (error) {
      toast.error('Erro ao criar categoria');
    }
  };

  const handleDeleteService = async (serviceId: number, serviceName: string) => {
    if (!currentUser) return;
    if (!window.confirm(`Tem certeza que quer deletar "${serviceName}"?`)) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);

      if (error) throw error;

      await logAdminAction(currentUser.id, 'service_deleted', 'service', undefined, {
        id: serviceId,
        name: serviceName,
      });

      toast.success('Serviço deletado com sucesso');
      refetchServices();
    } catch (error) {
      toast.error('Erro ao deletar serviço');
    }
  };

  const handleToggleCategoryActive = async (categoryId: number, isActive: boolean) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('service_categories')
        .update({ is_active: !isActive })
        .eq('id', categoryId);

      if (error) throw error;

      toast.success(isActive ? 'Categoria desativada' : 'Categoria ativada');
      refetchCategories();
    } catch (error) {
      toast.error('Erro ao atualizar categoria');
    }
  };

  const filteredServices = services.filter((s: any) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Serviços</h1>
      </div>

      {/* Tabs-like buttons */}
      <div className="flex gap-2 border-b">
        <button className="px-4 py-2 border-b-2 border-primary font-semibold">Serviços</button>
        <button className="px-4 py-2 text-muted-foreground">Categorias</button>
      </div>

      {/* Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Serviços ({filteredServices.length})</CardTitle>
          <Dialog open={showNewServiceDialog} onOpenChange={setShowNewServiceDialog}>
            <DialogTrigger asChild>
              <Button>+ Novo Serviço</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Serviço</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome do serviço (ex: Eletricista)"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                />
                <Button onClick={handleCreateService} className="w-full">
                  Criar Serviço
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Pesquisar serviços..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          {loadingServices ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filteredServices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Slug</th>
                    <th className="text-left py-2">Ícone</th>
                    <th className="text-left py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((service: any) => (
                    <tr key={service.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 font-semibold">{service.name}</td>
                      <td className="py-3 text-muted-foreground">{service.slug}</td>
                      <td className="py-3">{service.icon || 'Wrench'}</td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteService(service.id, service.name)}
                        >
                          Deletar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum serviço encontrado</p>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categorias de Serviços ({categories.length})</CardTitle>
          <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
            <DialogTrigger asChild>
              <Button>+ Nova Categoria</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome da categoria (ex: Construção)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <Button onClick={handleCreateCategory} className="w-full">
                  Criar Categoria
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loadingCategories ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Slug</th>
                    <th className="text-left py-2">Ativa</th>
                    <th className="text-left py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category: any) => (
                    <tr key={category.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 font-semibold">{category.name}</td>
                      <td className="py-3 text-muted-foreground">{category.slug}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            category.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {category.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleToggleCategoryActive(category.id, category.is_active)
                          }
                        >
                          {category.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/admin/services')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}>
      <AdminServices />
    </ProtectedAdminRoute>
  ),
});
