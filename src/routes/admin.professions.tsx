import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from '@/lib/admin-permissions';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { toast } from 'sonner';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function AdminProfessions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [q, setQ] = useState('');

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-professions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('professions').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const create = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from('professions').insert({ name: name.trim(), slug: slugify(name) });
    if (error) return toast.error(error.message);
    if (user) await logAdminAction(user.id, 'profession_created', 'profession', null, { name });
    toast.success('Profissão criada');
    setName('');
    qc.invalidateQueries({ queryKey: ['admin-professions'] });
  };
  const toggle = async (id: number, is_active: boolean) => {
    const { error } = await supabase.from('professions').update({ is_active: !is_active }).eq('id', id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['admin-professions'] });
  };
  const remove = async (id: number, n: string) => {
    if (!confirm(`Eliminar "${n}"?`)) return;
    const { error } = await supabase.from('professions').delete().eq('id', id);
    if (error) return toast.error(error.message);
    if (user) await logAdminAction(user.id, 'profession_deleted', 'profession', String(id), { name: n });
    toast.success('Eliminada');
    qc.invalidateQueries({ queryKey: ['admin-professions'] });
  };

  const filtered = data.filter((p: any) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Profissões</h1>
      <Card>
        <CardHeader><CardTitle>Nova profissão</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Ex.: Canalizador" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={create}>Adicionar</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Profissões ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <Input placeholder="Pesquisar..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-4" />
          {isLoading ? <p>Carregando...</p> : (
            <div className="space-y-2">
              {filtered.map((p: any) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-md">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.slug} • {p.is_active ? 'Ativa' : 'Inativa'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggle(p.id, p.is_active)}>{p.is_active ? 'Desativar' : 'Ativar'}</Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(p.id, p.name)}>Eliminar</Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-muted-foreground">Nenhuma profissão.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/admin/professions')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}><AdminProfessions /></ProtectedAdminRoute>
  ),
});
