import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PremiumCarousel } from '@/components/PremiumCarousel';
import { TechnicianCard } from '@/components/TechnicianCard';
import { CompanyCard } from '@/components/CompanyCard';

export function PremiumDashboards() {
  // Fetch verified premium technicians
  const { data: technicians = [] } = useQuery({
    queryKey: ['premium-technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technicians')
        .select(`
          id,
          full_name,
          profession,
          zone,
          experience_years,
          profile_photo,
          rating,
          completed_jobs,
          whatsapp_number,
          verified_by
        `)
        .eq('verified_by', null) // Remove if you want all verified
        .order('rating', { ascending: false })
        .order('completed_jobs', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch verified premium companies
  const { data: companies = [] } = useQuery({
    queryKey: ['premium-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          sector,
          zone,
          services,
          logo_url,
          rating,
          whatsapp_number,
          verified_by
        `)
        .eq('verified_by', null) // Remove if you want all verified
        .order('rating', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <>
      {/* Technicians Carousel */}
      {technicians.length > 0 && (
        <PremiumCarousel
          title="Técnicos Premium Verificados"
          itemsPerView={4}
        >
          {technicians.map((tech: any) => (
            <TechnicianCard
              key={tech.id}
              id={tech.id}
              name={tech.full_name}
              profession={tech.profession}
              zone={tech.zone}
              experience={tech.experience_years || 0}
              avatar={tech.profile_photo}
              rating={tech.rating}
              completedJobs={tech.completed_jobs}
              whatsapp={tech.whatsapp_number}
              verified={!!tech.verified_by}
            />
          ))}
        </PremiumCarousel>
      )}

      {/* Companies Carousel */}
      {companies.length > 0 && (
        <PremiumCarousel
          title="Empresas Premium Verificadas"
          itemsPerView={4}
        >
          {companies.map((company: any) => (
            <CompanyCard
              key={company.id}
              id={company.id}
              name={company.name}
              sector={company.sector}
              zone={company.zone}
              services={company.services || []}
              logo={company.logo_url}
              rating={company.rating}
              whatsapp={company.whatsapp_number}
              verified={!!company.verified_by}
            />
          ))}
        </PremiumCarousel>
      )}
    </>
  );
}
