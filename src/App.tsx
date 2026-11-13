import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { InstitutionalSite } from '@/pages/InstitutionalSite';
import { LoginPage } from '@/pages/LoginPage';
import { BackofficeLayout } from '@/components/BackofficeLayout';
import { DashboardPage } from '@/pages/app/DashboardPage';
import { GisMapPage } from '@/pages/app/GisMapPage';
import { InfrastructuresPage } from '@/pages/app/InfrastructuresPage';
import { InspectionsPage } from '@/pages/app/InspectionsPage';
import { OccurrencesPage } from '@/pages/app/OccurrencesPage';
import { RiskZonesPage } from '@/pages/app/RiskZonesPage';
import { MaintenancePage } from '@/pages/app/MaintenancePage';
import { MealPage } from '@/pages/app/MealPage';
import { ReportsPage } from '@/pages/app/ReportsPage';
import { UsersPage } from '@/pages/app/UsersPage';
import { SettingsPage } from '@/pages/app/SettingsPage';
import { DocumentationPage } from '@/pages/DocumentationPage';
import { Permission } from '@/types';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isHydrated } = useApp();
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-xs text-[#777777]">
        A carregar SIG-DREN Matola...
      </div>
    );
  }
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PermissionGuard: React.FC<{ permission: Permission; children: React.ReactNode }> = ({
  permission,
  children,
}) => {
  const { can } = useApp();
  if (!can(permission)) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-[#777777]">
        O seu perfil não possui autorização para aceder a este módulo.
      </div>
    );
  }
  return <>{children}</>;
};

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<InstitutionalSite />} />
          <Route path="/documentacao" element={<DocumentationPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <BackofficeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route
              path="gis"
              element={
                <PermissionGuard permission="view_gis">
                  <GisMapPage />
                </PermissionGuard>
              }
            />
            <Route
              path="infrastructures"
              element={
                <PermissionGuard permission="view_infrastructures">
                  <InfrastructuresPage />
                </PermissionGuard>
              }
            />
            <Route
              path="inspections"
              element={
                <PermissionGuard permission="view_inspections">
                  <InspectionsPage />
                </PermissionGuard>
              }
            />
            <Route
              path="occurrences"
              element={
                <PermissionGuard permission="view_occurrences">
                  <OccurrencesPage />
                </PermissionGuard>
              }
            />
            <Route
              path="risk-zones"
              element={
                <PermissionGuard permission="view_gis">
                  <RiskZonesPage />
                </PermissionGuard>
              }
            />
            <Route
              path="maintenance"
              element={
                <PermissionGuard permission="view_maintenance">
                  <MaintenancePage />
                </PermissionGuard>
              }
            />
            <Route
              path="meal"
              element={
                <PermissionGuard permission="view_meal">
                  <MealPage />
                </PermissionGuard>
              }
            />
            <Route
              path="reports"
              element={
                <PermissionGuard permission="view_reports">
                  <ReportsPage />
                </PermissionGuard>
              }
            />
            <Route
              path="users"
              element={
                <PermissionGuard permission="manage_users">
                  <UsersPage />
                </PermissionGuard>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="docs" element={<DocumentationPage embedded />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;

