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

function AdminPromotions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ title: '', description: '', code: '', discount_percent: '', starts_at: '', ends_at: '' });

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const create = async () => {
    if (!f.title.trim()) return;
    const payload: any = {
      title: f.title.trim(),
      description: f.description || null,
      code: f.code || null,
      discount_percent: f.discount_percent ? Number(f.discount_percent) : null,
      starts_at: f.starts_at || null,
      ends_at: f.ends_at || null,
    };
    const { error } = await supabase.from('promotions').insert(payload);
    if (error) return toast.error(error.message);
    if (user) await logAdminAction(user.id, 'promotion_created', 'promotion', null, payload);
    toast.success('Promoção criada');
    setF({ title: '', description: '', code: '', discount_percent: '', starts_at: '', ends_at: '' });
    qc.invalidateQueries({ queryKey: ['admin-promotions'] });
  };
  const toggle = async (id: number, is_active: boolean) => {
    const { error } = await supabase.from('promotions').update({ is_active: !is_active }).eq('id', id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['admin-promotions'] });
  };
  const remove = async (id: number) => {
    if (!confirm('Eliminar promoção?')) return;
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) return toast.error(error.message);
    if (user) await logAdminAction(user.id, 'promotion_deleted', 'promotion', String(id), null);
    qc.invalidateQueries({ queryKey: ['admin-promotions'] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Promoções</h1>
      <Card>
        <CardHeader><CardTitle>Nova promoção</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input placeholder="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <Input placeholder="Código (opcional)" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
          <Input type="number" placeholder="% Desconto" value={f.discount_percent} onChange={(e) => setF({ ...f, discount_percent: e.target.value })} />
          <div className="flex gap-2">
            <Input type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} />
            <Input type="datetime-local" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} />
          </div>
          <Textarea className="sm:col-span-2" placeholder="Descrição" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <Button className="sm:col-span-2" onClick={create}>Criar promoção</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Promoções ({data.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Carregando...</p> : (
            <div className="space-y-2">
              {data.map((p: any) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-md">
                  <div>
                    <p className="font-semibold">{p.title} {p.discount_percent ? `— ${p.discount_percent}%` : ''}</p>
                    {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                    <p className="text-xs text-muted-foreground">
                      {p.code ? `Código: ${p.code} • ` : ''}{p.is_active ? 'Ativa' : 'Inativa'}
                      {p.ends_at ? ` • até ${new Date(p.ends_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggle(p.id, p.is_active)}>{p.is_active ? 'Desativar' : 'Ativar'}</Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>Eliminar</Button>
                  </div>
                </div>
              ))}
              {data.length === 0 && <p className="text-muted-foreground">Nenhuma promoção.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/admin/promotions')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}><AdminPromotions /></ProtectedAdminRoute>
  ),
});
