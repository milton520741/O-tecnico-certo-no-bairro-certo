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

function AdminAppointments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>('all');

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-appointments', status],
    queryFn: async () => {
      let q = supabase.from('appointments').select('*').order('scheduled_for', { ascending: false });
      if (status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    if (error) return toast.error(error.message);
    if (user) await logAdminAction(user.id, 'appointment_status_changed', 'appointment', String(id), { status: newStatus });
    qc.invalidateQueries({ queryKey: ['admin-appointments'] });
  };
  const reschedule = async (id: number, when: string) => {
    if (!when) return;
    const { error } = await supabase.from('appointments').update({ scheduled_for: when }).eq('id', id);
    if (error) return toast.error(error.message);
    if (user) await logAdminAction(user.id, 'appointment_rescheduled', 'appointment', String(id), { scheduled_for: when });
    toast.success('Reagendado');
    qc.invalidateQueries({ queryKey: ['admin-appointments'] });
  };
  const remove = async (id: number) => {
    if (!confirm('Eliminar agendamento?')) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['admin-appointments'] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Agendamentos</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Agendamentos ({data.length})</CardTitle>
          <select className="border rounded px-3 py-2 bg-background" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="confirmed">Confirmados</option>
            <option value="completed">Concluídos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Carregando...</p> : (
            <div className="space-y-2">
              {data.map((a: any) => (
                <div key={a.id} className="p-3 border rounded-md space-y-2">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <p className="font-semibold">{new Date(a.scheduled_for).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Cliente: {a.client_id} • Prestador: {a.provider_id} ({a.provider_type}) • {a.status}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {a.status !== 'confirmed' && <Button size="sm" onClick={() => updateStatus(a.id, 'confirmed')}>Confirmar</Button>}
                      {a.status !== 'completed' && <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'completed')}>Concluir</Button>}
                      {a.status !== 'cancelled' && <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'cancelled')}>Cancelar</Button>}
                      <Button size="sm" variant="destructive" onClick={() => remove(a.id)}>Eliminar</Button>
                    </div>
                  </div>
                  {a.notes && <p className="text-sm text-muted-foreground">{a.notes}</p>}
                  <div className="flex gap-2 items-center">
                    <Input type="datetime-local" onChange={(e) => (a._new = e.target.value)} />
                    <Button size="sm" variant="outline" onClick={() => reschedule(a.id, a._new)}>Reagendar</Button>
                  </div>
                </div>
              ))}
              {data.length === 0 && <p className="text-muted-foreground">Nenhum agendamento.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/admin/appointments')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}><AdminAppointments /></ProtectedAdminRoute>
  ),
});
