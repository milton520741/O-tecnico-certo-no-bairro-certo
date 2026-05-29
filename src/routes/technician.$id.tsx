import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/technician/$id")({
  component: TechnicianProfilePage,
});

interface Technician {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  bio: string | null;
  phone_whatsapp: string | null;
  years_experience: number;
  is_verified: boolean;
  is_premium: boolean;
  created_at: string;
}

interface Subscription {
  id: string;
  status: string;
  plan: string;
  expires_at: string | null;
}

function TechnicianProfilePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        // Get technician
        const { data: tech } = await supabase
          .from("technicians")
          .select("*")
          .eq("id", id)
          .single();

        if (!tech) {
          setTechnician(null);
          setLoading(false);
          return;
        }

        setTechnician(tech);

        // Get subscription
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("owner_id", id)
          .eq("status", "active")
          .maybeSingle();

        if (sub) {
          setSubscription(sub);
        }

        // Get services
        const { data: svc } = await supabase
          .from("technician_services")
          .select("services(name)")
          .eq("technician_id", id);

        setServices(svc?.map((s: any) => s.services.name) || []);

        // Get zones
        const { data: zns } = await supabase
          .from("technician_zones")
          .select("zones(name)")
          .eq("technician_id", id);

        setZones(zns?.map((z: any) => z.zones.name) || []);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>A carregar perfil...</p>
      </div>
    );

  if (!technician)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Técnico não encontrado.</p>
      </div>
    );

  const hasActiveSubscription = subscription && subscription.status === "active";
  const isExpired =
    subscription && new Date(subscription.expires_at || "") < new Date();
  const isSubscriptionValid = hasActiveSubscription && !isExpired;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              {technician.profile_photo_url ? (
                <img
                  src={technician.profile_photo_url}
                  alt={technician.full_name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-brand-500"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center border-4 border-brand-500">
                  <span className="text-2xl text-slate-400">👤</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {technician.full_name}
                  </h1>
                  <p className="text-slate-600 mt-2">
                    {technician.years_experience} anos de experiência
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {technician.is_verified && (
                    <Badge className="bg-green-500">✓ Verificado</Badge>
                  )}
                  {technician.is_premium && (
                    <Badge className="bg-amber-500">👑 Premium</Badge>
                  )}
                </div>
              </div>

              {/* Bio */}
              {technician.bio && (
                <p className="text-slate-700 mt-4">{technician.bio}</p>
              )}

              {/* Contact Section */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                {isSubscriptionValid ? (
                  // Show WhatsApp if subscribed
                  <div>
                    <p className="text-sm text-slate-600 mb-2">
                      Contactar por WhatsApp:
                    </p>
                    <a
                      href={`https://wa.me/${technician.phone_whatsapp?.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                      📱 {technician.phone_whatsapp}
                    </a>
                  </div>
                ) : (
                  // Show message if not subscribed
                  <div className="text-red-700 font-semibold">
                    ⚠️ Contacto bloqueado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        {!isSubscriptionValid && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-red-700 mb-2">
              ⚠️ Sem Assinatura Ativa
            </h3>
            <p className="text-red-600 mb-4">
              O perfil está sendo visitado! Para revelar seu contacto, ative uma
              assinatura mensal:
            </p>
            <div className="flex gap-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  window.location.href = `/payment?plan=simples&tech_id=${id}`;
                }}
              >
                Plano Simples - 1.000 Kz
              </Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => {
                  window.location.href = `/payment?plan=premium&tech_id=${id}`;
                }}
              >
                Plano Premium - 2.000 Kz
              </Button>
            </div>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Serviços</h2>
            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <Badge key={service} className="bg-blue-100 text-blue-700">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Zones */}
        {zones.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Zonas de Atuação</h2>
            <div className="flex flex-wrap gap-2">
              {zones.map((zone) => (
                <Badge key={zone} className="bg-slate-100 text-slate-700">
                  📍 {zone}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Portfólio</h2>
          <p className="text-slate-600">
            Em breve: Galeria de trabalhos realizados
          </p>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <Link
            to="/technicians"
            className="text-brand-600 hover:text-brand-700 font-semibold"
          >
            ← Voltar à listagem
          </Link>
        </div>
      </div>
    </div>
  );
}
