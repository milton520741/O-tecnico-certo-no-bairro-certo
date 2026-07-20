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

function AdminNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ title: '', message: '', audience: 'all' });

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const send = async () => {
    if (!f.title.trim() || !f.message.trim() || !user) return;
    const { error } = await supabase.from('notifications').insert({
      title: f.title.trim(), message: f.message.trim(), audience: f.audience, created_by: user.id,
    });
    if (error) return toast.error(error.message);
    await logAdminAction(user.id, 'notification_sent', 'notification', null, f);
    toast.success('Notificação enviada');
    setF({ title: '', message: '', audience: 'all' });
    qc.invalidateQueries({ queryKey: ['admin-notifications'] });
  };
  const remove = async (id: number) => {
    if (!confirm('Eliminar notificação?')) return;
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['admin-notifications'] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Central de Notificações</h1>
      <Card>
        <CardHeader><CardTitle>Enviar nova notificação</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <Textarea placeholder="Mensagem" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
          <select className="w-full border rounded px-3 py-2 bg-background" value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}>
            <option value="all">Todos</option>
            <option value="technician">Só técnicos</option>
            <option value="company">Só empresas</option>
            <option value="admin">Só admins</option>
          </select>
          <Button onClick={send}>Enviar</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Histórico ({data.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Carregando...</p> : (
            <div className="space-y-2">
              {data.map((n: any) => (
                <div key={n.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-md">
                  <div>
                    <p className="font-semibold">{n.title} <span className="text-xs text-muted-foreground">({n.audience})</span></p>
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => remove(n.id)}>Eliminar</Button>
                </div>
              ))}
              {data.length === 0 && <p className="text-muted-foreground">Nenhuma notificação enviada.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/admin/notifications')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}><AdminNotifications /></ProtectedAdminRoute>
  ),
});
