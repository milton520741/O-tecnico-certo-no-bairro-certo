import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from '@/lib/admin-permissions';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { toast } from 'sonner';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function AdminCategories() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const create = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from('categories').insert({ name: name.trim(), slug: slugify(name), description: desc || null });
    if (error) return toast.error(error.message);
    if (user) await logAdminAction(user.id, 'category_created', 'category', null, { name });
    toast.success('Categoria criada');
    setName(''); setDesc('');
    qc.invalidateQueries({ queryKey: ['admin-categories'] });
  };
  const toggle = async (id: number, is_active: boolean) => {
    const { error } = await supabase.from('categories').update({ is_active: !is_active }).eq('id', id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['admin-categories'] });
  };
  const remove = async (id: number, n: string) => {
    if (!confirm(`Eliminar "${n}"?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return toast.error(error.message);
    if (user) await logAdminAction(user.id, 'category_deleted', 'category', String(id), { name: n });
    toast.success('Eliminada');
    qc.invalidateQueries({ queryKey: ['admin-categories'] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Categorias</h1>
      <Card>
        <CardHeader><CardTitle>Nova categoria</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Ex.: Construção" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Descrição (opcional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Button onClick={create}>Adicionar</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Categorias ({data.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Carregando...</p> : (
            <div className="space-y-2">
              {data.map((c: any) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-md">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                    <p className="text-xs text-muted-foreground">{c.slug} • {c.is_active ? 'Ativa' : 'Inativa'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggle(c.id, c.is_active)}>{c.is_active ? 'Desativar' : 'Ativar'}</Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(c.id, c.name)}>Eliminar</Button>
                  </div>
                </div>
              ))}
              {data.length === 0 && <p className="text-muted-foreground">Nenhuma categoria.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/admin/categories')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}><AdminCategories /></ProtectedAdminRoute>
  ),
});
