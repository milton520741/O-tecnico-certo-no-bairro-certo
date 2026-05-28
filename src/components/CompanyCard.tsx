import React from 'react';
import { MessageCircle, CheckCircle2, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CompanyCardProps {
  id: string;
  name: string;
  sector: string;
  zone: string;
  services: string[];
  logo?: string;
  rating?: number;
  whatsapp: string;
  verified?: boolean;
}

export function CompanyCard({
  id,
  name,
  sector,
  zone,
  services,
  logo,
  rating,
  whatsapp,
  verified = true,
}: CompanyCardProps) {
  const handleWhatsApp = () => {
    const message = `Olá ${name}, gostaria de saber mais sobre os serviços de ${services[0] || sector}.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsapp}?text=${encoded}`, '_blank');
  };

  return (
    <div className="h-full">
      <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:shadow-2xl transition-all duration-300 h-full flex flex-col group">
        {/* Header com Logo */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-12 w-12 border-2 border-amber-400/50 group-hover:border-amber-400 transition-colors">
              <AvatarImage src={logo} alt={name} />
              <AvatarFallback className="bg-indigo-600 text-white font-bold">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm truncate">
                {name}
              </h3>
              <p className="text-xs text-blue-300 truncate">
                {sector}
              </p>
            </div>
          </div>
          {verified && (
            <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
        </div>

        {/* Info */}
        <div className="space-y-3 mb-4 flex-1">
          {/* Localização */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-xs text-slate-300">{zone}</span>
          </div>

          {/* Serviços */}
          {services && services.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Serviços:</p>
              <div className="flex flex-wrap gap-1">
                {services.slice(0, 2).map((service, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs bg-blue-600/30 text-blue-200 border-blue-400/30"
                  >
                    {service}
                  </Badge>
                ))}
                {services.length > 2 && (
                  <Badge
                    variant="outline"
                    className="text-xs border-slate-500 text-slate-300"
                  >
                    +{services.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Rating */}
          {rating !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">⭐</span>
              <span className="text-xs text-slate-300">
                {rating.toFixed(1)} / 5.0
              </span>
            </div>
          )}
        </div>

        {/* Botão WhatsApp */}
        <Button
          onClick={handleWhatsApp}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
          size="sm"
        >
          <MessageCircle className="w-4 h-4" />
          Contatar
        </Button>
      </div>
    </div>
  );
}
