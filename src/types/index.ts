export type RoleCode =
  | 'admin'
  | 'gestor_municipal'
  | 'tecnico_gis'
  | 'inspector_campo'
  | 'responsavel_manutencao'
  | 'analista_meal';

export type Permission =
  | 'view_dashboard'
  | 'view_gis'
  | 'edit_gis'
  | 'import_export_gis'
  | 'view_infrastructures'
  | 'create_infrastructure'
  | 'edit_infrastructure'
  | 'delete_infrastructure'
  | 'view_inspections'
  | 'create_inspection'
  | 'view_occurrences'
  | 'create_occurrence'
  | 'edit_occurrence'
  | 'view_maintenance'
  | 'manage_maintenance'
  | 'approve_maintenance'
  | 'view_meal'
  | 'manage_meal'
  | 'view_reports'
  | 'export_reports'
  | 'manage_users'
  | 'manage_settings';

export interface Role {
  code: RoleCode;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: RoleCode;
  department: string;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  administrativePost: 'Matola Sede' | 'Infulene' | 'Machava';
  municipality: 'Matola';
  province: 'Maputo';
  centerLat: number;
  centerLng: number;
  populationEstimate: number;
}

export type InfrastructureType =
  | 'Vala de drenagem'
  | 'Canal de drenagem'
  | 'Colector'
  | 'Bacia de retenção'
  | 'Passagem hidráulica';

export type ConservationState =
  | 'Bom estado'
  | 'Estado aceitável'
  | 'Necessita de manutenção'
  | 'Estado crítico';

export type RiskLevel = 'Baixo' | 'Moderado' | 'Alto' | 'Crítico';

export interface Infrastructure {
  id: string;
  code: string;
  name: string;
  type: InfrastructureType;
  province: string;
  municipality: string;
  administrativePost: 'Matola Sede' | 'Infulene' | 'Machava';
  neighborhoodId: string;
  neighborhoodName: string;
  locationDescription: string;
  latitude: number;
  longitude: number;
  lengthM?: number;
  widthM?: number;
  depthM?: number;
  material: string;
  constructionYear?: number;
  conservationState: ConservationState;
  riskLevel: RiskLevel;
  lastSurveyDate: string;
  photoUrl?: string;
  notes?: string;
  responsibleTechnician: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Inspection {
  id: string;
  clientSyncId: string;
  infrastructureId: string;
  infrastructureCode: string;
  infrastructureName: string;
  technicianName: string;
  inspectionDate: string;
  latitude: number;
  longitude: number;
  structuralState: ConservationState;
  hasObstruction: boolean;
  hasWasteAccumulation: boolean;
  hasErosion: boolean;
  hasStructuralDamage: boolean;
  severity: ConservationState;
  photoUrl?: string;
  observations: string;
  syncStatus: 'synced' | 'pending';
  isDemo: boolean;
  createdAt: string;
}

export type OccurrenceSeverity = 'Baixa' | 'Média' | 'Alta' | 'Crítica';
export type OccurrenceStatus =
  | 'Nova ocorrência'
  | 'Em avaliação'
  | 'Em intervenção'
  | 'Resolvida'
  | 'Encerrada';

export interface Occurrence {
  id: string;
  code: string;
  occurrenceType:
    | 'Inundação urbana'
    | 'Obstrução de colector'
    | 'Transbordo de vala'
    | 'Erosão de talude'
    | 'Dano estrutural';
  occurredAt: string;
  neighborhoodId: string;
  neighborhoodName: string;
  latitude: number;
  longitude: number;
  description: string;
  photoUrl?: string;
  communicationSource: 'Equipa de campo' | 'Munícipe / Linha Verde' | 'Protecção Civil' | 'Vereação';
  severity: OccurrenceSeverity;
  affectedPeople?: number;
  affectedHouseholds?: number;
  infrastructureId?: string;
  infrastructureCode?: string;
  responsibleName: string;
  status: OccurrenceStatus;
  resolvedAt?: string;
  isDemo: boolean;
  createdAt: string;
}

export interface RiskZone {
  id: string;
  code: string;
  name: string;
  neighborhoodId: string;
  neighborhoodName: string;
  riskLevel: RiskLevel;
  coordinates: [number, number][]; // [lat, lng] polygon vertices
  estimatedAffectedPopulation: number;
  description: string;
  isDemo: boolean;
}

export interface MaintenancePlan {
  id: string;
  code: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  neighborhoodName: string;
  budgetMzn: number;
  status: 'Activo' | 'Concluído' | 'Planeado';
}

export type WorkOrderPriority = 'Baixa' | 'Normal' | 'Alta' | 'Urgente';
export type WorkOrderStatus = 'Planeada' | 'Pendente' | 'Em execução' | 'Concluída' | 'Cancelada';

export interface WorkOrderHistoryEntry {
  id: string;
  previousStatus?: WorkOrderStatus;
  newStatus: WorkOrderStatus;
  notes: string;
  changedBy: string;
  changedAt: string;
}

export interface WorkOrder {
  id: string;
  code: string;
  planId?: string;
  infrastructureId?: string;
  infrastructureCode?: string;
  infrastructureName?: string;
  occurrenceId?: string;
  title: string;
  description: string;
  assignedTeam: string;
  priority: WorkOrderPriority;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  costMzn: number;
  materialsUsed: string;
  progressPct: number;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  completionNotes?: string;
  status: WorkOrderStatus;
  responsibleName: string;
  history: WorkOrderHistoryEntry[];
  isDemo: boolean;
  createdAt: string;
}

export interface IndicatorResult {
  id: string;
  referencePeriod: string;
  measuredValue: number;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface MealIndicator {
  id: string;
  code: string;
  name: string;
  definition: string;
  formula: string;
  unit: string;
  baselineValue: number;
  targetValue: number;
  currentValue: number;
  higherIsBetter: boolean;
  measurementFrequency: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
  verificationSource: string;
  responsible: string;
  autoComputed: boolean;
  history: IndicatorResult[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'Ocorrência' | 'Infra-estrutura' | 'Inspecção' | 'Manutenção' | 'Relatório' | 'Sistema';
  severity: 'info' | 'warning' | 'critical' | 'success';
  read: boolean;
  linkPath?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userName: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'SYNC';
  entity: string;
  entityId?: string;
  details: string;
  createdAt: string;
}

export type GeoLayerKey =
  | 'valas'
  | 'canais'
  | 'colectores'
  | 'bacias'
  | 'passagens'
  | 'inundacoes'
  | 'zonas_risco'
  | 'intervencoes';

