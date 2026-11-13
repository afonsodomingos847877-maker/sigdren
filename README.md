# SIG-DREN MATOLA

**Sistema Integrado de Mapeamento, Gestão e Monitoria de Zonas de Inundação e Infra-estruturas de Drenagem**  
*Empresa Municipal de Saneamento e Abastecimento de Água da Matola (EMSAAM)*

## Funcionalidades Implementadas

- **Website Institucional (Público)**: Inspirado em design minimalista de alta precisão, com secções de apresentação, sobre o sistema, funcionalidades e formulário de contacto.
- **Backoffice Protegido (RBAC)**: 6 perfis com permissões diferenciadas (Administrador, Gestor Municipal, Técnico GIS, Inspector de Campo, Responsável de Manutenção, Analista MEAL).
- **Dashboard Executivo**: 10 indicadores KPI, 6 gráficos dinâmicos (Recharts), mapa de localização e filtros interactivos.
- **Módulo GIS (Leaflet + OpenStreetMap)**: 8 camadas geográficas, pesquisa por bairro/infra-estrutura, leitura GPS em tempo real, importação e exportação GeoJSON.
- **Cadastro de Infra-estruturas**: Ficha técnica completa (21 campos), validação de duplicados, exportação Excel/CSV e ligação directa ao mapa.
- **Inspecção Digital Offline-First**: Armazenamento local em IndexedDB (`idb`) com suporte a fotografias e sincronização automática sem duplicados.
- **Gestão de Ocorrências e Inundações**: Fluxo de estados, mapa específico e indicadores de tempo médio de resposta.
- **Gestão de Manutenção**: Planos preventivos, ordens de trabalho, custos em MZN, progresso e alertas de prazo.
- **Monitoria e Avaliação (MEAL)**: 10 indicadores com cálculo automático, linha de base, metas, semáforos e exportação.
- **Relatórios e BI**: 7 tipos de relatórios com pré-visualização e exportação real em PDF e Excel.
- **Auditoria e Sustentabilidade**: Registo completo de acções (`audit_logs`) e backup integral em JSON.

## Como Executar Localmente

```bash
npm install
npm run dev
```

## Ligação a Supabase + PostGIS

O esquema SQL completo com PostGIS, índices espaciais `GIST` e políticas `RLS` encontra-se em `supabase/migrations/001_initial_schema.sql`.  
Para ligar a um projecto Supabase em produção, copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

