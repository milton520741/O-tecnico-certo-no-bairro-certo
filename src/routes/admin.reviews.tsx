import { createFileRoute } from '@tanstack/react-router';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { PermissionLevel } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from '@/lib/admin-permissions';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { toast } from 'sonner';

function AdminReviews() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [responses, setResponses] = useState<Record<number, string>>({});

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const setStatus = async (id: number, status: string) => {
    const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    if (user) await logAdminAction(user.id, 'review_status_changed', 'review', String(id), { status });
    qc.invalidateQueries({ queryKey: ['admin-reviews'] });
  };
  const respond = async (id: number) => {
    const admin_response = responses[id]?.trim();
    if (!admin_response) return;
    const { error } = await supabase.from('reviews').update({ admin_response }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Resposta guardada');
    qc.invalidateQueries({ queryKey: ['admin-reviews'] });
  };
  const remove = async (id: number) => {
    if (!confirm('Eliminar avaliação?')) return;
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) return toast.error(error.message);
    if (user) await logAdminAction(user.id, 'review_deleted', 'review', String(id), null);
    qc.invalidateQueries({ queryKey: ['admin-reviews'] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Avaliações</h1>
      <Card>
        <CardHeader><CardTitle>Avaliações ({data.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Carregando...</p> : (
            <div className="space-y-3">
              {data.map((r: any) => (
                <div key={r.id} className="p-3 border rounded-md space-y-2">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div>
                      <p className="font-semibold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} <span className="text-xs text-muted-foreground">({r.target_type})</span></p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} • {r.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setStatus(r.id, r.status === 'visible' ? 'hidden' : 'visible')}>
                        {r.status === 'visible' ? 'Ocultar' : 'Mostrar'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(r.id)}>Eliminar</Button>
                    </div>
                  </div>
                  {r.comment && <p className="text-sm">{r.comment}</p>}
                  {r.admin_response && <p className="text-sm bg-muted p-2 rounded"><strong>Resposta:</strong> {r.admin_response}</p>}
                  <div className="flex gap-2">
                    <Textarea placeholder="Responder..." value={responses[r.id] || ''} onChange={(e) => setResponses({ ...responses, [r.id]: e.target.value })} />
                    <Button size="sm" onClick={() => respond(r.id)}>Responder</Button>
                  </div>
                </div>
              ))}
              {data.length === 0 && <p className="text-muted-foreground">Sem avaliações.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/admin/reviews')({
  component: () => (
    <ProtectedAdminRoute minLevel={PermissionLevel.ADMIN}><AdminReviews /></ProtectedAdminRoute>
  ),
});
