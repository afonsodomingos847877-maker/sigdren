import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppNotification,
  AuditLog,
  Infrastructure,
  Inspection,
  MaintenancePlan,
  MealIndicator,
  Neighborhood,
  Occurrence,
  Permission,
  RiskZone,
  RoleCode,
  User,
  WorkOrder,
  WorkOrderStatus,
} from '@/types';
import {
  DEMO_AUDIT_LOGS,
  DEMO_INFRASTRUCTURES,
  DEMO_INSPECTIONS,
  DEMO_MAINTENANCE_PLANS,
  DEMO_MEAL_INDICATORS,
  DEMO_NEIGHBORHOODS,
  DEMO_NOTIFICATIONS,
  DEMO_OCCURRENCES,
  DEMO_RISK_ZONES,
  DEMO_USERS,
  DEMO_WORK_ORDERS,
} from '@/data/demoData';
import { hasPermission, ROLES } from '@/config/roles';
import {
  clearAllState,
  clearOfflineInspection,
  enqueueOfflineInspection,
  getOfflineInspectionsQueue,
  loadStateKey,
  saveStateKey,
} from '@/lib/offlineDb';
import { apiRequest } from '@/lib/api';

interface AppContextValue {
  isHydrated: boolean;
  dbConnected: boolean;
  currentUser: User | null;
  can: (permission: Permission) => boolean;
  login: (email: string, password?: string) => Promise<{ ok: boolean; error?: string }>;
  loginAsRole: (role: RoleCode) => Promise<void>;
  logout: () => void;

  // Online / Offline
  isOnline: boolean;
  simulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  pendingOfflineCount: number;
  syncOfflineInspections: () => Promise<number>;

  // Data collections
  neighborhoods: Neighborhood[];
  users: User[];
  infrastructures: Infrastructure[];
  inspections: Inspection[];
  occurrences: Occurrence[];
  riskZones: RiskZone[];
  maintenancePlans: MaintenancePlan[];
  workOrders: WorkOrder[];
  indicators: MealIndicator[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];

  // Actions
  addInfrastructure: (item: Omit<Infrastructure, 'id' | 'createdAt' | 'updatedAt'>) => { ok: boolean; error?: string };
  updateInfrastructure: (id: string, patch: Partial<Infrastructure>) => void;
  deleteInfrastructure: (id: string) => void;

  addInspection: (item: Omit<Inspection, 'id' | 'createdAt' | 'syncStatus'>) => Promise<{ synced: boolean }>;

  addOccurrence: (item: Omit<Occurrence, 'id' | 'createdAt'>) => void;
  updateOccurrenceStatus: (id: string, status: Occurrence['status']) => void;

  addRiskZone: (zone: Omit<RiskZone, 'id'>) => void;
  importGeoJsonFeatures: (geojson: GeoJSON.FeatureCollection) => number;

  addMaintenancePlan: (plan: Omit<MaintenancePlan, 'id'>) => void;
  addWorkOrder: (wo: Omit<WorkOrder, 'id' | 'createdAt' | 'history'>) => void;
  updateWorkOrder: (id: string, patch: Partial<WorkOrder>, statusNote?: string) => void;

  recordIndicatorResult: (indicatorId: string, period: string, value: number, notes?: string) => void;
  addIndicator: (ind: Omit<MealIndicator, 'id' | 'history'>) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;

  addUser: (user: Omit<User, 'id' | 'createdAt'>) => { ok: boolean; error?: string };
  updateUser: (id: string, patch: Partial<User>) => void;

  recordAudit: (action: AuditLog['action'], entity: string, details: string, entityId?: string) => void;
  exportFullBackup: () => void;
  importFullBackup: (payload: { data?: Record<string, unknown[]> }) => Promise<{ ok: boolean; error?: string }>;
  resetDemoData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const STORAGE_USER_KEY = 'sig_dren_current_user_id';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [browserOnline, setBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const isOnline = browserOnline && !simulatedOffline;

  const [neighborhoods] = useState<Neighborhood[]>(DEMO_NEIGHBORHOODS);
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [infrastructures, setInfrastructures] = useState<Infrastructure[]>(DEMO_INFRASTRUCTURES);
  const [inspections, setInspections] = useState<Inspection[]>(DEMO_INSPECTIONS);
  const [occurrences, setOccurrences] = useState<Occurrence[]>(DEMO_OCCURRENCES);
  const [riskZones, setRiskZones] = useState<RiskZone[]>(DEMO_RISK_ZONES);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>(DEMO_MAINTENANCE_PLANS);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(DEMO_WORK_ORDERS);
  const [baseIndicators, setBaseIndicators] = useState<MealIndicator[]>(DEMO_MEAL_INDICATORS);
  const [notifications, setNotifications] = useState<AppNotification[]>(DEMO_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(DEMO_AUDIT_LOGS);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);

  // Listen to browser online/offline
  useEffect(() => {
    const onOnline = () => setBrowserOnline(true);
    const onOffline = () => setBrowserOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Hydrate from MongoDB API (with IndexedDB offline fallback)
  useEffect(() => {
    async function hydrate() {
      try {
        const offlineQueue = await getOfflineInspectionsQueue<Inspection>();
        setPendingOfflineCount(offlineQueue.length);

        const apiRes = await apiRequest<{
          users: User[];
          infrastructures: Infrastructure[];
          inspections: Inspection[];
          occurrences: Occurrence[];
          riskZones: RiskZone[];
          maintenancePlans: MaintenancePlan[];
          workOrders: WorkOrder[];
          indicators: MealIndicator[];
          notifications: AppNotification[];
          auditLogs: AuditLog[];
        }>('/api/bootstrap', {
          method: 'POST',
          body: JSON.stringify({
            seed: {
              users: DEMO_USERS,
              infrastructures: DEMO_INFRASTRUCTURES,
              inspections: DEMO_INSPECTIONS,
              occurrences: DEMO_OCCURRENCES,
              riskZones: DEMO_RISK_ZONES,
              maintenancePlans: DEMO_MAINTENANCE_PLANS,
              workOrders: DEMO_WORK_ORDERS,
              indicators: DEMO_MEAL_INDICATORS,
              notifications: DEMO_NOTIFICATIONS,
              auditLogs: DEMO_AUDIT_LOGS,
            },
          }),
        });

        let loadedUsers: User[] = DEMO_USERS;

        if (apiRes.ok && apiRes.data) {
          setDbConnected(true);
          loadedUsers = apiRes.data.users.length ? apiRes.data.users : DEMO_USERS;
          setUsers(loadedUsers);
          setInfrastructures(apiRes.data.infrastructures);
          setInspections(apiRes.data.inspections);
          setOccurrences(apiRes.data.occurrences);
          setRiskZones(apiRes.data.riskZones);
          setMaintenancePlans(apiRes.data.maintenancePlans);
          setWorkOrders(apiRes.data.workOrders);
          if (apiRes.data.indicators.length) setBaseIndicators(apiRes.data.indicators);
          setNotifications(apiRes.data.notifications);
          setAuditLogs(apiRes.data.auditLogs);
        } else {
          const [
            sUsers,
            sInfra,
            sInsp,
            sOcc,
            sRz,
            sPlans,
            sWo,
            sInd,
            sNotif,
            sAudit,
          ] = await Promise.all([
            loadStateKey<User[]>('users'),
            loadStateKey<Infrastructure[]>('infrastructures'),
            loadStateKey<Inspection[]>('inspections'),
            loadStateKey<Occurrence[]>('occurrences'),
            loadStateKey<RiskZone[]>('riskZones'),
            loadStateKey<MaintenancePlan[]>('maintenancePlans'),
            loadStateKey<WorkOrder[]>('workOrders'),
            loadStateKey<MealIndicator[]>('indicators'),
            loadStateKey<AppNotification[]>('notifications'),
            loadStateKey<AuditLog[]>('auditLogs'),
          ]);

          loadedUsers = (sUsers ?? DEMO_USERS).map((u) =>
            u.id === 'usr-1' && u.fullName === 'Eng. Carlos Nhantumbo'
              ? { ...u, fullName: 'Eng. Afonso Domingos' }
              : u
          );
          if (sUsers) setUsers(loadedUsers);
          if (sInfra) setInfrastructures(sInfra);
          if (sInsp) setInspections(sInsp);
          if (sOcc) setOccurrences(sOcc);
          if (sRz) setRiskZones(sRz);
          if (sPlans) setMaintenancePlans(sPlans);
          if (sWo) setWorkOrders(sWo);
          if (sInd) setBaseIndicators(sInd);
          if (sNotif) setNotifications(sNotif);
          if (sAudit) setAuditLogs(sAudit);
        }

        const savedUserId = localStorage.getItem(STORAGE_USER_KEY);
        if (savedUserId) {
          const found = loadedUsers.find((u) => u.id === savedUserId && u.active);
          if (found) setCurrentUser(found);
        }
      } finally {
        setIsHydrated(true);
      }
    }
    hydrate();
  }, []);

  // Persist collections to IndexedDB when changed
  useEffect(() => {
    if (!isHydrated) return;
    saveStateKey('users', users);
  }, [users, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    saveStateKey('infrastructures', infrastructures);
  }, [infrastructures, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    saveStateKey('inspections', inspections);
  }, [inspections, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    saveStateKey('occurrences', occurrences);
  }, [occurrences, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    saveStateKey('riskZones', riskZones);
  }, [riskZones, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    saveStateKey('maintenancePlans', maintenancePlans);
  }, [maintenancePlans, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    saveStateKey('workOrders', workOrders);
  }, [workOrders, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    saveStateKey('indicators', baseIndicators);
  }, [baseIndicators, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    saveStateKey('notifications', notifications);
  }, [notifications, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    saveStateKey('auditLogs', auditLogs);
  }, [auditLogs, isHydrated]);

  const recordAudit = useCallback(
    (action: AuditLog['action'], entity: string, details: string, entityId?: string) => {
      const entry: AuditLog = {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userName: currentUser?.fullName ?? 'Sistema',
        userRole: currentUser ? ROLES[currentUser.role].name : 'Sistema',
        action,
        entity,
        entityId,
        details,
        createdAt: new Date().toISOString(),
      };
      setAuditLogs((prev) => [entry, ...prev].slice(0, 200));
      void apiRequest('/api/audit-logs', { method: 'POST', body: JSON.stringify(entry) });
    },
    [currentUser]
  );

  const addNotification = useCallback(
    (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      const item: AppNotification = {
        ...n,
        id: `not-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [item, ...prev]);
      void apiRequest('/api/notifications', { method: 'POST', body: JSON.stringify(item) });
    },
    []
  );

  const can = useCallback(
    (permission: Permission) => hasPermission(currentUser?.role, permission),
    [currentUser]
  );

  const login = useCallback(
    async (email: string, password?: string) => {
      if (dbConnected && password !== undefined) {
        const res = await apiRequest<{ token: string; user: User; error?: string }>(
          '/api/auth/login',
          {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          }
        );
        if (!res.ok || !res.data?.user) {
          return { ok: false, error: res.data?.error || 'Credenciais inválidas.' };
        }
        const updated = res.data.user;
        localStorage.setItem('sig_dren_auth_token', res.data.token);
        setCurrentUser(updated);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        localStorage.setItem(STORAGE_USER_KEY, updated.id);
        recordAudit('LOGIN', 'Sessão', 'Autenticação efectuada com palavra-passe e token JWT.');
        return { ok: true };
      }

      const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) return { ok: false, error: 'Utilizador não encontrado.' };
      if (!found.active) return { ok: false, error: 'Conta desactivada. Contacte o Administrador.' };
      const updated = { ...found, lastLoginAt: new Date().toISOString() };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      localStorage.setItem(STORAGE_USER_KEY, updated.id);
      recordAudit('LOGIN', 'Sessão', 'Autenticação efectuada com sucesso no backoffice.');
      return { ok: true };
    },
    [users, dbConnected, recordAudit]
  );

  const loginAsRole = useCallback(
    async (role: RoleCode) => {
      const found = users.find((u) => u.role === role && u.active);
      if (found) {
        await login(found.email, 'sigdren2026');
      }
    },
    [users, login]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem('sig_dren_auth_token');
  }, []);

  // Infrastructure CRUD
  const addInfrastructure = useCallback(
    (item: Omit<Infrastructure, 'id' | 'createdAt' | 'updatedAt'>) => {
      const duplicate = infrastructures.some(
        (i) => i.code.trim().toLowerCase() === item.code.trim().toLowerCase()
      );
      if (duplicate) {
        return { ok: false, error: `Já existe uma infra-estrutura com o código ${item.code}.` };
      }
      const now = new Date().toISOString();
      const created: Infrastructure = {
        ...item,
        id: `inf-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setInfrastructures((prev) => [created, ...prev]);
      void apiRequest('/api/infrastructures', { method: 'POST', body: JSON.stringify(created) });
      recordAudit('CREATE', 'Infra-estrutura', `Registou ${created.code} (${created.name}).`, created.id);
      if (created.conservationState === 'Estado crítico' || created.riskLevel === 'Crítico') {
        addNotification({
          title: 'Infra-estrutura Crítica Cadastrada',
          message: `${created.code} (${created.neighborhoodName}) marcada como crítica.`,
          category: 'Infra-estrutura',
          severity: 'critical',
          linkPath: '/app/infrastructures',
        });
      }
      return { ok: true };
    },
    [infrastructures, recordAudit, addNotification]
  );

  const updateInfrastructure = useCallback(
    (id: string, patch: Partial<Infrastructure>) => {
      const updatedPatch = { ...patch, updatedAt: new Date().toISOString() };
      setInfrastructures((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updatedPatch } : i))
      );
      void apiRequest(`/api/infrastructures/${id}`, { method: 'PATCH', body: JSON.stringify(updatedPatch) });
      recordAudit('UPDATE', 'Infra-estrutura', `Actualizou ficha da infra-estrutura ${id}.`, id);
    },
    [recordAudit]
  );

  const deleteInfrastructure = useCallback(
    (id: string) => {
      const target = infrastructures.find((i) => i.id === id);
      setInfrastructures((prev) => prev.filter((i) => i.id !== id));
      void apiRequest(`/api/infrastructures/${id}`, { method: 'DELETE' });
      recordAudit('DELETE', 'Infra-estrutura', `Eliminou ${target?.code ?? id}.`, id);
    },
    [infrastructures, recordAudit]
  );

  // Inspections + Real Offline Sync
  const addInspection = useCallback(
    async (item: Omit<Inspection, 'id' | 'createdAt' | 'syncStatus'>) => {
      const now = new Date().toISOString();
      const inspection: Inspection = {
        ...item,
        id: `insp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        syncStatus: isOnline ? 'synced' : 'pending',
        createdAt: now,
      };

      if (!isOnline) {
        await enqueueOfflineInspection(inspection);
        const queue = await getOfflineInspectionsQueue<Inspection>();
        setPendingOfflineCount(queue.length);
        setInspections((prev) => [inspection, ...prev]);
        return { synced: false };
      }

      setInspections((prev) => [inspection, ...prev]);
      void apiRequest('/api/inspections', { method: 'POST', body: JSON.stringify(inspection) });
      void apiRequest(`/api/infrastructures/${inspection.infrastructureId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          conservationState: inspection.severity,
          lastSurveyDate: inspection.inspectionDate.slice(0, 10),
          updatedAt: now,
        }),
      });
      // Update infrastructure conservation state
      setInfrastructures((prev) =>
        prev.map((inf) =>
          inf.id === inspection.infrastructureId
            ? {
                ...inf,
                conservationState: inspection.severity,
                lastSurveyDate: inspection.inspectionDate.slice(0, 10),
                updatedAt: now,
              }
            : inf
        )
      );
      recordAudit(
        'CREATE',
        'Inspecção Digital',
        `Inspecção registada para ${inspection.infrastructureCode} (${inspection.severity}).`,
        inspection.id
      );
      if (inspection.severity === 'Estado crítico') {
        addNotification({
          title: 'Alerta de Inspecção Crítica',
          message: `${inspection.infrastructureCode} classificada como Estado crítico por ${inspection.technicianName}.`,
          category: 'Inspecção',
          severity: 'critical',
          linkPath: '/app/inspections',
        });
      }
      return { synced: true };
    },
    [isOnline, recordAudit, addNotification]
  );

  const syncOfflineInspections = useCallback(async () => {
    if (!isOnline) return 0;
    const queue = await getOfflineInspectionsQueue<Inspection>();
    if (queue.length === 0) return 0;

    let syncedCount = 0;
    for (const item of queue) {
      const syncedItem = { ...item, syncStatus: 'synced' as const };
      await apiRequest('/api/inspections', { method: 'POST', body: JSON.stringify(syncedItem) });
      // Deduplicate by clientSyncId
      setInspections((prev) => {
        const exists = prev.some((p) => p.clientSyncId === item.clientSyncId);
        if (exists) {
          return prev.map((p) =>
            p.clientSyncId === item.clientSyncId ? syncedItem : p
          );
        }
        return [syncedItem, ...prev];
      });
      await clearOfflineInspection(item.clientSyncId);
      syncedCount++;
    }
    setPendingOfflineCount(0);
    recordAudit('SYNC', 'Inspecções Offline', `Sincronizadas ${syncedCount} inspecções guardadas offline.`);
    addNotification({
      title: 'Sincronização Offline Concluída',
      message: `${syncedCount} ficha(s) de inspecção sincronizada(s) sem duplicações.`,
      category: 'Sistema',
      severity: 'success',
      linkPath: '/app/inspections',
    });
    return syncedCount;
  }, [isOnline, recordAudit, addNotification]);

  // Auto-sync when connection returns
  useEffect(() => {
    if (isOnline && pendingOfflineCount > 0) {
      syncOfflineInspections();
    }
  }, [isOnline, pendingOfflineCount, syncOfflineInspections]);

  // Occurrences
  const addOccurrence = useCallback(
    (item: Omit<Occurrence, 'id' | 'createdAt'>) => {
      const created: Occurrence = {
        ...item,
        id: `occ-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setOccurrences((prev) => [created, ...prev]);
      void apiRequest('/api/occurrences', { method: 'POST', body: JSON.stringify(created) });
      recordAudit('CREATE', 'Ocorrência', `Registou ${created.code} (${created.neighborhoodName}).`, created.id);
      addNotification({
        title: `Nova Ocorrência: ${created.code}`,
        message: `${created.occurrenceType} em ${created.neighborhoodName} (Gravidade: ${created.severity}).`,
        category: 'Ocorrência',
        severity: created.severity === 'Crítica' || created.severity === 'Alta' ? 'critical' : 'warning',
        linkPath: '/app/occurrences',
      });
    },
    [recordAudit, addNotification]
  );

  const updateOccurrenceStatus = useCallback(
    (id: string, status: Occurrence['status']) => {
      const resolvedAtPatch =
        status === 'Resolvida' || status === 'Encerrada' ? new Date().toISOString() : undefined;
      setOccurrences((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status,
                resolvedAt: resolvedAtPatch ? o.resolvedAt ?? resolvedAtPatch : o.resolvedAt,
              }
            : o
        )
      );
      void apiRequest(`/api/occurrences/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(resolvedAtPatch ? { status, resolvedAt: resolvedAtPatch } : { status }),
      });
      recordAudit('UPDATE', 'Ocorrência', `Alterou estado da ocorrência ${id} para ${status}.`, id);
    },
    [recordAudit]
  );

  // Risk zones & GeoJSON import
  const addRiskZone = useCallback(
    (zone: Omit<RiskZone, 'id'>) => {
      const created: RiskZone = { ...zone, id: `rz-${Date.now()}` };
      setRiskZones((prev) => [created, ...prev]);
      recordAudit('CREATE', 'Zona de Risco', `Criou zona ${created.code} (${created.name}).`, created.id);
    },
    [recordAudit]
  );

  const importGeoJsonFeatures = useCallback(
    (geojson: GeoJSON.FeatureCollection) => {
      let imported = 0;
      const newInfras: Infrastructure[] = [];
      const newZones: RiskZone[] = [];
      const now = new Date().toISOString();

      for (const feat of geojson.features) {
        if (!feat.geometry) continue;
        const props = (feat.properties ?? {}) as Record<string, string>;
        if (feat.geometry.type === 'Point') {
          const [lng, lat] = feat.geometry.coordinates;
          const code = props.code || `IMP-${Date.now().toString().slice(-4)}-${imported + 1}`;
          if (!infrastructures.some((i) => i.code === code)) {
            newInfras.push({
              id: `inf-imp-${Date.now()}-${imported}`,
              code,
              name: props.name || `Infra-estrutura Importada ${imported + 1}`,
              type: (props.type as Infrastructure['type']) || 'Vala de drenagem',
              province: 'Maputo',
              municipality: 'Matola',
              administrativePost: 'Matola Sede',
              neighborhoodId: 'nb-1',
              neighborhoodName: props.neighborhood || 'Matola Sede',
              locationDescription: props.location || 'Importado via GeoJSON',
              latitude: lat,
              longitude: lng,
              material: props.material || 'Betão',
              conservationState: (props.conservationState as Infrastructure['conservationState']) || 'Estado aceitável',
              riskLevel: (props.riskLevel as Infrastructure['riskLevel']) || 'Moderado',
              lastSurveyDate: now.slice(0, 10),
              responsibleTechnician: currentUser?.fullName ?? 'Técnico GIS',
              isDemo: false,
              createdAt: now,
              updatedAt: now,
            });
            imported++;
          }
        } else if (feat.geometry.type === 'Polygon') {
          const ring = feat.geometry.coordinates[0] || [];
          const coords: [number, number][] = ring.map(([lng, lat]) => [lat, lng]);
          if (coords.length >= 3) {
            newZones.push({
              id: `rz-imp-${Date.now()}-${imported}`,
              code: props.code || `ZR-IMP-${imported + 1}`,
              name: props.name || `Zona Importada ${imported + 1}`,
              neighborhoodId: 'nb-1',
              neighborhoodName: props.neighborhood || 'Matola Sede',
              riskLevel: (props.riskLevel as RiskZone['riskLevel']) || 'Alto',
              coordinates: coords,
              estimatedAffectedPopulation: Number(props.population) || 500,
              description: props.description || 'Importada via GeoJSON',
              isDemo: false,
            });
            imported++;
          }
        }
      }

      if (newInfras.length) setInfrastructures((prev) => [...newInfras, ...prev]);
      if (newZones.length) setRiskZones((prev) => [...newZones, ...prev]);
      if (imported > 0) {
        recordAudit('CREATE', 'Importação GeoJSON', `Importadas ${imported} geometrias para o mapa GIS.`);
      }
      return imported;
    },
    [infrastructures, currentUser, recordAudit]
  );

  // Maintenance
  const addMaintenancePlan = useCallback(
    (plan: Omit<MaintenancePlan, 'id'>) => {
      setMaintenancePlans((prev) => [{ ...plan, id: `mp-${Date.now()}` }, ...prev]);
      recordAudit('CREATE', 'Plano de Manutenção', `Criou plano ${plan.code}.`);
    },
    [recordAudit]
  );

  const addWorkOrder = useCallback(
    (wo: Omit<WorkOrder, 'id' | 'createdAt' | 'history'>) => {
      const now = new Date().toISOString();
      const created: WorkOrder = {
        ...wo,
        id: `wo-${Date.now()}`,
        createdAt: now,
        history: [
          {
            id: `h-${Date.now()}`,
            newStatus: wo.status,
            notes: 'Ordem de trabalho criada.',
            changedBy: currentUser?.fullName ?? 'Sistema',
            changedAt: now,
          },
        ],
      };
      setWorkOrders((prev) => [created, ...prev]);
      recordAudit('CREATE', 'Ordem de Trabalho', `Criou ${created.code}: ${created.title}.`, created.id);
    },
    [currentUser, recordAudit]
  );

  const updateWorkOrder = useCallback(
    (id: string, patch: Partial<WorkOrder>, statusNote?: string) => {
      const now = new Date().toISOString();
      setWorkOrders((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const statusChanged = patch.status && patch.status !== w.status;
          const nextHistory = statusChanged
            ? [
                ...w.history,
                {
                  id: `h-${Date.now()}`,
                  previousStatus: w.status,
                  newStatus: patch.status as WorkOrderStatus,
                  notes: statusNote || `Estado alterado para ${patch.status}.`,
                  changedBy: currentUser?.fullName ?? 'Sistema',
                  changedAt: now,
                },
              ]
            : w.history;
          return {
            ...w,
            ...patch,
            completedDate: patch.status === 'Concluída' ? now.slice(0, 10) : w.completedDate,
            progressPct: patch.status === 'Concluída' ? 100 : patch.progressPct ?? w.progressPct,
            history: nextHistory,
          };
        })
      );
      recordAudit('UPDATE', 'Ordem de Trabalho', `Actualizou ordem ${id}.`, id);
    },
    [currentUser, recordAudit]
  );

  // Auto-compute live MEAL indicators from current state
  const indicators = useMemo(() => {
    const totalInf = infrastructures.length || 1;
    const validGps = infrastructures.filter(
      (i) => i.latitude >= -26.2 && i.latitude <= -25.7 && i.longitude >= 32.2 && i.longitude <= 32.7
    ).length;
    const goodState = infrastructures.filter(
      (i) => i.conservationState === 'Bom estado' || i.conservationState === 'Estado aceitável'
    ).length;
    const criticalCount = infrastructures.filter(
      (i) => i.riskLevel === 'Crítico' || i.conservationState === 'Estado crítico'
    ).length;
    const totalOcc = occurrences.length;
    const resolvedOcc = occurrences.filter(
      (o) => o.status === 'Resolvida' || o.status === 'Encerrada'
    ).length;
    const completedWos = workOrders.filter((w) => w.status === 'Concluída');
    const onTimeWos = completedWos.filter((w) => !w.completedDate || w.completedDate <= w.dueDate);
    const completeHistoryWos = workOrders.filter(
      (w) => w.assignedTeam && w.materialsUsed && w.costMzn >= 0
    );

    return baseIndicators.map((ind) => {
      if (!ind.autoComputed) return ind;
      let val = ind.currentValue;
      switch (ind.code) {
        case 'MEAL-02':
          val = Math.round((validGps / totalInf) * 100);
          break;
        case 'MEAL-03':
          val = Math.round((goodState / totalInf) * 100);
          break;
        case 'MEAL-04':
          val = criticalCount;
          break;
        case 'MEAL-05':
          val = totalOcc;
          break;
        case 'MEAL-06':
          val = totalOcc > 0 ? Math.round((resolvedOcc / totalOcc) * 100) : 100;
          break;
        case 'MEAL-08':
          val = completedWos.length > 0 ? Math.round((onTimeWos.length / completedWos.length) * 100) : 100;
          break;
        case 'MEAL-09':
          val = workOrders.length > 0 ? Math.round((completeHistoryWos.length / workOrders.length) * 100) : 100;
          break;
      }
      return { ...ind, currentValue: val };
    });
  }, [baseIndicators, infrastructures, occurrences, workOrders]);

  const recordIndicatorResult = useCallback(
    (indicatorId: string, period: string, value: number, notes?: string) => {
      setBaseIndicators((prev) =>
        prev.map((ind) =>
          ind.id === indicatorId
            ? {
                ...ind,
                currentValue: value,
                history: [
                  ...ind.history,
                  {
                    id: `ir-${Date.now()}`,
                    referencePeriod: period,
                    measuredValue: value,
                    notes,
                    recordedBy: currentUser?.fullName ?? 'Analista MEAL',
                    recordedAt: new Date().toISOString().slice(0, 10),
                  },
                ],
              }
            : ind
        )
      );
      recordAudit('UPDATE', 'Indicador MEAL', `Registou medição (${period}: ${value}) para ${indicatorId}.`);
    },
    [currentUser, recordAudit]
  );

  const addIndicator = useCallback(
    (ind: Omit<MealIndicator, 'id' | 'history'>) => {
      setBaseIndicators((prev) => [...prev, { ...ind, id: `ind-${Date.now()}`, history: [] }]);
      recordAudit('CREATE', 'Indicador MEAL', `Criou indicador ${ind.code}: ${ind.name}.`);
    },
    [recordAudit]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    void apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void apiRequest('/api/notifications/read-all', { method: 'PATCH' });
  }, []);

  const addUser = useCallback(
    (user: Omit<User, 'id' | 'createdAt'>) => {
      if (users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
        return { ok: false, error: 'Já existe um utilizador com este e-mail.' };
      }
      const created: User = { ...user, id: `usr-${Date.now()}`, createdAt: new Date().toISOString() };
      setUsers((prev) => [created, ...prev]);
      void apiRequest('/api/users', { method: 'POST', body: JSON.stringify(created) });
      recordAudit('CREATE', 'Utilizador', `Criou conta ${created.email} (${ROLES[created.role].name}).`, created.id);
      return { ok: true };
    },
    [users, recordAudit]
  );

  const updateUser = useCallback(
    (id: string, patch: Partial<User>) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
      void apiRequest(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      recordAudit('UPDATE', 'Utilizador', `Actualizou permissões/estado do utilizador ${id}.`, id);
    },
    [recordAudit]
  );

  const exportFullBackup = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      institution: 'EMSAAM - Matola',
      system: 'SIG-DREN MATOLA',
      data: {
        users,
        neighborhoods,
        infrastructures,
        inspections,
        occurrences,
        riskZones,
        maintenancePlans,
        workOrders,
        indicators: baseIndicators,
        auditLogs,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sig-dren-matola-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordAudit('EXPORT', 'Backup Completo', 'Exportou cópia de segurança JSON da base de dados.');
  }, [users, neighborhoods, infrastructures, inspections, occurrences, riskZones, maintenancePlans, workOrders, baseIndicators, auditLogs, recordAudit]);

  const importFullBackup = useCallback(
    async (payload: { data?: Record<string, unknown[]> }) => {
      const d = payload?.data;
      if (!d || typeof d !== 'object') {
        return { ok: false, error: 'Ficheiro de backup inválido.' };
      }
      if (Array.isArray(d.infrastructures)) setInfrastructures(d.infrastructures as Infrastructure[]);
      if (Array.isArray(d.inspections)) setInspections(d.inspections as Inspection[]);
      if (Array.isArray(d.occurrences)) setOccurrences(d.occurrences as Occurrence[]);
      if (Array.isArray(d.riskZones)) setRiskZones(d.riskZones as RiskZone[]);
      if (Array.isArray(d.maintenancePlans)) setMaintenancePlans(d.maintenancePlans as MaintenancePlan[]);
      if (Array.isArray(d.workOrders)) setWorkOrders(d.workOrders as WorkOrder[]);
      if (Array.isArray(d.indicators)) setBaseIndicators(d.indicators as MealIndicator[]);
      if (Array.isArray(d.auditLogs)) setAuditLogs(d.auditLogs as AuditLog[]);
      await apiRequest('/api/restore-backup', {
        method: 'POST',
        body: JSON.stringify({ data: d }),
      });
      recordAudit('SYNC', 'Restauro de Backup', 'Restaurou cópia de segurança JSON da base de dados.');
      return { ok: true };
    },
    [recordAudit]
  );

  const resetDemoData = useCallback(async () => {
    await clearAllState();
    await apiRequest('/api/reset-demo', {
      method: 'POST',
      body: JSON.stringify({
        seed: {
          users: DEMO_USERS,
          infrastructures: DEMO_INFRASTRUCTURES,
          inspections: DEMO_INSPECTIONS,
          occurrences: DEMO_OCCURRENCES,
          riskZones: DEMO_RISK_ZONES,
          maintenancePlans: DEMO_MAINTENANCE_PLANS,
          workOrders: DEMO_WORK_ORDERS,
          indicators: DEMO_MEAL_INDICATORS,
          notifications: DEMO_NOTIFICATIONS,
          auditLogs: DEMO_AUDIT_LOGS,
        },
      }),
    });
    setUsers(DEMO_USERS);
    setInfrastructures(DEMO_INFRASTRUCTURES);
    setInspections(DEMO_INSPECTIONS);
    setOccurrences(DEMO_OCCURRENCES);
    setRiskZones(DEMO_RISK_ZONES);
    setMaintenancePlans(DEMO_MAINTENANCE_PLANS);
    setWorkOrders(DEMO_WORK_ORDERS);
    setBaseIndicators(DEMO_MEAL_INDICATORS);
    setNotifications(DEMO_NOTIFICATIONS);
    setAuditLogs(DEMO_AUDIT_LOGS);
    setPendingOfflineCount(0);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isHydrated,
        dbConnected,
        currentUser,
        can,
        login,
        loginAsRole,
        logout,
        isOnline,
        simulatedOffline,
        toggleSimulatedOffline: () => setSimulatedOffline((v) => !v),
        pendingOfflineCount,
        syncOfflineInspections,
        neighborhoods,
        users,
        infrastructures,
        inspections,
        occurrences,
        riskZones,
        maintenancePlans,
        workOrders,
        indicators,
        notifications,
        auditLogs,
        addInfrastructure,
        updateInfrastructure,
        deleteInfrastructure,
        addInspection,
        addOccurrence,
        updateOccurrenceStatus,
        addRiskZone,
        importGeoJsonFeatures,
        addMaintenancePlan,
        addWorkOrder,
        updateWorkOrder,
        recordIndicatorResult,
        addIndicator,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification,
        addUser,
        updateUser,
        recordAudit,
        exportFullBackup,
        importFullBackup,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
