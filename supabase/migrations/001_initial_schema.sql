-- SIG-DREN MATOLA - Esquema Relacional & Geoespacial (PostgreSQL + PostGIS)
-- Empresa Municipal de Saneamento e Abastecimento de Água da Matola

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Perfis / Funções (RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Utilizadores
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role_id UUID NOT NULL REFERENCES roles(id),
  department TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Bairros da Matola
CREATE TABLE IF NOT EXISTS neighborhoods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  administrative_post TEXT NOT NULL,
  municipality TEXT NOT NULL DEFAULT 'Matola',
  province TEXT NOT NULL DEFAULT 'Maputo',
  centroid GEOMETRY(Point, 4326),
  boundary GEOMETRY(Polygon, 4326),
  population_estimate INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tipos de Infra-estrutura
CREATE TABLE IF NOT EXISTS infrastructure_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  geometry_kind TEXT NOT NULL DEFAULT 'Point'
);

-- 5. Infra-estruturas de Drenagem
CREATE TABLE IF NOT EXISTS infrastructures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type_id UUID NOT NULL REFERENCES infrastructure_types(id),
  province TEXT NOT NULL DEFAULT 'Maputo',
  municipality TEXT NOT NULL DEFAULT 'Matola',
  administrative_post TEXT NOT NULL,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
  location_description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOMETRY(Geometry, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  length_m DOUBLE PRECISION,
  width_m DOUBLE PRECISION,
  depth_m DOUBLE PRECISION,
  material TEXT,
  construction_year INTEGER,
  conservation_state TEXT NOT NULL CHECK (conservation_state IN ('Bom estado', 'Estado aceitável', 'Necessita de manutenção', 'Estado crítico')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Baixo', 'Moderado', 'Alto', 'Crítico')),
  last_survey_date DATE NOT NULL,
  photo_url TEXT,
  notes TEXT,
  responsible_technician_id UUID REFERENCES users(id),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_infrastructures_geom ON infrastructures USING GIST (geom);

-- 6. Inspecções Digitais
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_sync_id TEXT UNIQUE,
  infrastructure_id UUID NOT NULL REFERENCES infrastructures(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES users(id),
  inspection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  structural_state TEXT NOT NULL CHECK (structural_state IN ('Bom estado', 'Estado aceitável', 'Necessita de manutenção', 'Estado crítico')),
  has_obstruction BOOLEAN NOT NULL DEFAULT FALSE,
  has_waste_accumulation BOOLEAN NOT NULL DEFAULT FALSE,
  has_erosion BOOLEAN NOT NULL DEFAULT FALSE,
  has_structural_damage BOOLEAN NOT NULL DEFAULT FALSE,
  severity TEXT NOT NULL CHECK (severity IN ('Bom estado', 'Estado aceitável', 'Necessita de manutenção', 'Estado crítico')),
  photo_url TEXT,
  observations TEXT,
  synced_from_offline BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inspections_geom ON inspections USING GIST (geom);

-- 7. Ocorrências e Inundações
CREATE TABLE IF NOT EXISTS occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  occurrence_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  description TEXT NOT NULL,
  photo_url TEXT,
  communication_source TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Baixa', 'Média', 'Alta', 'Crítica')),
  affected_people INTEGER,
  affected_households INTEGER,
  infrastructure_id UUID REFERENCES infrastructures(id),
  responsible_id UUID REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('Nova ocorrência', 'Em avaliação', 'Em intervenção', 'Resolvida', 'Encerrada')),
  resolved_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_occurrences_geom ON occurrences USING GIST (geom);

-- 8. Zonas de Risco
CREATE TABLE IF NOT EXISTS risk_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Baixo', 'Moderado', 'Alto', 'Crítico')),
  geojson JSONB NOT NULL,
  geom GEOMETRY(Geometry, 4326),
  estimated_affected_population INTEGER,
  description TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_risk_zones_geom ON risk_zones USING GIST (geom);

-- 9. Planos de Manutenção
CREATE TABLE IF NOT EXISTS maintenance_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  neighborhood_id UUID REFERENCES neighborhoods(id),
  budget_mzn NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Activo',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Ordens de Trabalho / Intervenções
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  plan_id UUID REFERENCES maintenance_plans(id),
  infrastructure_id UUID REFERENCES infrastructures(id),
  occurrence_id UUID REFERENCES occurrences(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_team TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Baixa', 'Normal', 'Alta', 'Urgente')),
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  completed_date DATE,
  cost_mzn NUMERIC(14, 2) NOT NULL DEFAULT 0,
  materials_used TEXT,
  progress_pct INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  before_photo_url TEXT,
  after_photo_url TEXT,
  completion_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('Planeada', 'Pendente', 'Em execução', 'Concluída', 'Cancelada')),
  responsible_id UUID REFERENCES users(id),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Histórico de Ordens de Trabalho
CREATE TABLE IF NOT EXISTS work_order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Indicadores MEAL
CREATE TABLE IF NOT EXISTS indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  definition TEXT NOT NULL,
  formula TEXT NOT NULL,
  unit TEXT NOT NULL,
  baseline_value NUMERIC(12, 2) NOT NULL,
  target_value NUMERIC(12, 2) NOT NULL,
  current_value NUMERIC(12, 2) NOT NULL,
  measurement_frequency TEXT NOT NULL,
  verification_source TEXT NOT NULL,
  responsible_role TEXT NOT NULL,
  auto_computed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Resultados Históricos de Indicadores
CREATE TABLE IF NOT EXISTS indicator_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  reference_period TEXT NOT NULL,
  measured_value NUMERIC(12, 2) NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Notificações e Alertas
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'success')),
  target_role TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Registo de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'SYNC')),
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE infrastructures ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas base para utilizadores autenticados
CREATE POLICY "Authenticated read infrastructures" ON infrastructures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write infrastructures" ON infrastructures FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read inspections" ON inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write inspections" ON inspections FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read occurrences" ON occurrences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write occurrences" ON occurrences FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read work_orders" ON work_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write work_orders" ON work_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated read audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

