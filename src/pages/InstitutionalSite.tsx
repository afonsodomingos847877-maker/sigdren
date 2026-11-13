import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  ClipboardCheck,
  Database,
  Globe2,
  Layers,
  Mail,
  MapPin,
  Phone,
  Wrench,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const FEATURE_CARDS = [
  {
    title: 'Mapa GIS',
    desc: 'Camadas vectoriais em tempo real sobre OpenStreetMap.',
    icon: Globe2,
  },
  {
    title: 'Cadastro Técnico',
    desc: 'Inventário georreferenciado de canais, valas e colectores.',
    icon: Database,
  },
  {
    title: 'Zonas de Risco',
    desc: 'Identificação de pontos críticos e áreas de inundação.',
    icon: Layers,
  },
  {
    title: 'Inspecção Offline',
    desc: 'Vistorias no terreno com sincronização automática.',
    icon: ClipboardCheck,
  },
  {
    title: 'Manutenção',
    desc: 'Ordens de trabalho, equipas e controlo de prazos.',
    icon: Wrench,
  },
  {
    title: 'Indicadores MEAL',
    desc: 'Monitoria de metas e relatórios em PDF e Excel.',
    icon: BarChart3,
  },
];

export const InstitutionalSite: React.FC = () => {
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-white text-[#171717]">
      {/* Fixed Minimalist Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="#inicio" className="focus:outline-none">
            <Logo />
          </a>

          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#171717]">
            <a href="#inicio" className="hover:text-[#2563EB] transition-colors">
              Início
            </a>
            <a href="#sobre" className="hover:text-[#2563EB] transition-colors">
              Sobre
            </a>
            <a href="#funcionalidades" className="hover:text-[#2563EB] transition-colors">
              Funcionalidades
            </a>
            <a href="#contactos" className="hover:text-[#2563EB] transition-colors">
              Contactos
            </a>
          </nav>

          <Link
            to="/login"
            className="px-4 py-1.5 text-[13px] font-medium rounded-sm bg-[#171717] text-white hover:bg-[#142B4A] transition-colors"
          >
            Aceder ao sistema
          </Link>
        </div>
      </header>

      {/* Hero Section - Clean Tesla Style */}
      <section
        id="inicio"
        className="relative pt-14 min-h-[82vh] flex items-center justify-center overflow-hidden bg-[#142B4A] text-white"
      >
        <img
          src="/banner.jpg"
          alt="SIG-DREN Matola"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#142B4A]/45 to-black/65" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center py-24 animate-fade-in">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-3">
            SIG-DREN Matola
          </h1>

          <p className="text-base sm:text-lg text-neutral-200 font-normal mb-8">
            Dados geográficos que transformam a gestão urbana.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#funcionalidades"
              className="w-full sm:w-52 py-2.5 px-6 rounded-sm bg-[#2563EB] hover:bg-blue-700 text-white text-[13px] font-medium transition-colors text-center"
            >
              Explorar a plataforma
            </a>
            <Link
              to="/login"
              className="w-full sm:w-52 py-2.5 px-6 rounded-sm bg-white text-[#171717] hover:bg-neutral-100 text-[13px] font-medium transition-colors text-center"
            >
              Aceder ao sistema
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Metrics Strip */}
      <section className="border-b border-neutral-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="font-display text-2xl font-semibold text-[#171717]">10 Bairros</div>
            <div className="text-xs text-[#777777] mt-1">Matola</div>
          </div>
          <div>
            <div className="font-display text-2xl font-semibold text-[#171717]">8 Camadas</div>
            <div className="text-xs text-[#777777] mt-1">GIS / PostGIS</div>
          </div>
          <div>
            <div className="font-display text-2xl font-semibold text-[#171717]">Offline</div>
            <div className="text-xs text-[#777777] mt-1">Inspecção de Campo</div>
          </div>
          <div>
            <div className="font-display text-2xl font-semibold text-[#171717]">6 Perfis</div>
            <div className="text-xs text-[#777777] mt-1">Acesso RBAC</div>
          </div>
        </div>
      </section>

      {/* Sobre o Sistema - Concise */}
      <section id="sobre" className="py-20 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold text-[#171717] mb-3">
              Gestão de drenagem com precisão.
            </h2>
            <p className="text-sm text-[#777777] leading-relaxed">
              Plataforma institucional da EMSAAM para cadastro, monitoria de riscos, inspecção digital e manutenção da rede pluvial da Matola.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              'Localização exacta da rede',
              'Estado de conservação',
              'Pontos críticos de cheia',
              'Controlo de intervenções',
            ].map((item) => (
              <div
                key={item}
                className="p-4 rounded-lg bg-[#F4F4F4] font-medium text-[#171717]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades - Minimal Cards */}
      <section id="funcionalidades" className="py-20 bg-[#F4F4F4]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl font-semibold text-[#171717] mb-10 text-center">
            Funcionalidades
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white rounded-xl p-6 border border-neutral-200/70 hover:shadow-sm transition-shadow"
                >
                  <Icon className="w-5 h-5 text-[#2563EB] mb-4" />
                  <h3 className="font-display text-base font-semibold text-[#171717] mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#777777]">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contactos */}
      <section id="contactos" className="py-20 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <h2 className="font-display text-3xl font-semibold text-[#171717]">Contactos</h2>
            <div className="space-y-3 text-sm text-[#555555]">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#2563EB]" />
                <span>Município da Matola, Maputo</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#2563EB]" />
                <span>+258 21 720 000</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#2563EB]" />
                <span>sigdren@emsaam.gov.mz</span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleContactSubmit}
            className="bg-[#F4F4F4] rounded-xl p-6 space-y-3"
          >
            {contactSent && (
              <div className="p-2.5 rounded bg-emerald-50 text-xs text-[#16A34A]">
                Mensagem enviada com sucesso.
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Nome"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#2563EB]"
              />
              <input
                type="email"
                required
                placeholder="E-mail"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <input
              type="text"
              required
              placeholder="Assunto"
              value={contactForm.subject}
              onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
              className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#2563EB]"
            />
            <textarea
              required
              rows={3}
              placeholder="Mensagem"
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              className="w-full px-3 py-2 rounded-sm bg-white border border-neutral-200 text-xs focus:outline-none focus:border-[#2563EB]"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-sm bg-[#171717] hover:bg-[#142B4A] text-white text-xs font-medium transition-colors"
            >
              Enviar
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-6 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777777]">
          <div>SIG-DREN MATOLA © {new Date().getFullYear()} - EMSAAM</div>
          <a
            href="https://www.muv.co.mz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-[#171717] transition-colors"
          >
            <span>Powered By Muv</span>
            <img src="/logo_muv.png" alt="Muv" className="h-5 w-auto object-contain" />
          </a>
        </div>
      </footer>
    </div>
  );
};
