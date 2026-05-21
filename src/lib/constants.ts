/**
 * EvoluinF — Constantes globais do negócio.
 * Para substituir o logo: trocar o ficheiro em `/public/logo.png`
 * (mesmo nome). É renderizado pelo componente <Logo />.
 */

export const BRAND = {
  name: "EvoluinF",
  slogan: "Evolução Infinita",
  logo: "/logo.png",
} as const;

export const CONTACT = {
  ownerWhatsapp: "+244947470500",
  ownerWhatsappDisplay: "+244 947 470 500",
  email: "evoluingroupoilandgas@gmail.com",
  iban: "0058 0000 0749 1366 1012 0",
  xpress: "947470500",
} as const;

export const PLANS = {
  simples: { id: "simples", label: "Técnico Simples", price: 1000, owner: "technician" as const, perks: ["Perfil público", "Listagem padrão"] },
  premium: { id: "premium", label: "Técnico Premium", price: 2000, owner: "technician" as const, perks: ["Selo PREMIUM", "Destaque visual", "Prioridade na listagem"] },
  empresa_mensal: { id: "empresa_mensal", label: "Empresa Mensal", price: 10000, owner: "company" as const, perks: ["Página empresarial", "Visibilidade total", "Selo verificado disponível"] },
} as const;

export type PlanId = keyof typeof PLANS;

export const formatKz = (n: number) =>
  new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(n);

/** Mensagem URL-encoded para WhatsApp do técnico (cliente final) */
export const buildClientWhatsappMessage = (service: string, zone: string) =>
  encodeURIComponent(
    `Olá, encontrei seu contacto no EvoluinF. Preciso de ${service || "[SERVIÇO]"} em ${zone || "[ZONA]"}. Pode informar disponibilidade e orçamento?`
  );

/** Mensagem URL-encoded para WhatsApp do proprietário (ativação de assinatura) */
export const buildActivationMessage = (name: string, plan: string) =>
  encodeURIComponent(
    `Olá EvoluinF, quero ativar meu cadastro. Meu nome é ${name || "[NOME]"}. Plano: ${plan || "[SIMPLES/PREMIUM]"}. Já fiz o pagamento. Segue comprovativo.`
  );

export const whatsappUrl = (phone: string, message: string) => {
  const clean = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${message}`;
};
