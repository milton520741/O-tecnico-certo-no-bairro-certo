import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase, logAdminAction } from '@/lib/admin-permissions';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { useState } from 'react';

interface AdminSetting {
  id: number;
  key: string;
  value: any;
  description: string;
}

function AdminSettings() {
  const { user: currentUser } = useAuth();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Fetch settings
  const { data: settings = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const handleSaveSetting = async (key: string, value: any) => {
    if (!currentUser) return;

    try {
      // Parse value if it's JSON
      let parsedValue = value;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // If not JSON, use as string
      }

      const { error } = await supabase
        .from('admin_settings')
        .update({ value: parsedValue })
        .eq('key', key);

      if (error) throw error;

      await logAdminAction(currentUser.id, 'settings_changed', 'admin_setting', undefined, {
        key,
        old_value: settings.find((s) => s.key === key)?.value,
        new_value: parsedValue,
      });

      toast.success('Configuração atualizada com sucesso');
      setEditingKey(null);
      refetch();
    } catch (error) {
      toast.error('Erro ao atualizar configuração');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
        <div className="text-sm text-muted-foreground">Apenas para Super Admins</div>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Globais</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : settings.length > 0 ? (
            <div className="space-y-4">
              {settings.map((setting: AdminSetting) => (
                <div key={setting.key} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold">{setting.key}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    {editingKey === setting.key ? (
                      <div className="flex gap-2 ml-4">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveSetting(setting.key, editingValue)}
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingKey(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingKey(setting.key);
                          setEditingValue(JSON.stringify(setting.value));
                        }}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {JSON.stringify(setting.value)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma configuração encontrada</p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Valores são salvos como JSON</li>
            <li>Strings devem ser envolvidas em aspas duplas</li>
            <li>Booleanos devem ser true ou false (sem aspas)</li>
            <li>Números podem ser inseridos diretamente</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/admin/settings')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.SUPER_ADMIN}>
      <AdminSettings />
    </ProtectedAdminRoute>
  ),
});
