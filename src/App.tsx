import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, NavView, VIEW_TO_PATH } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { ConfiguratorView } from './components/configurator/ConfiguratorView';
import { OrdersListView } from './components/orders/OrdersListView';
import { ClientsListView } from './components/clients/ClientsListView';
import { ProspectsPipelineView } from './components/prospects/ProspectsPipelineView';
import { ProductsCatalogView } from './components/products/ProductsCatalogView';
import { WorkersPayrollView } from './components/workers/WorkersPayrollView';
import { OrderDetailsModal } from './components/orders/OrderDetailsModal';
import { RecordPaymentModal } from './components/orders/RecordPaymentModal';
import { LoginView } from './components/auth/LoginView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Order, Client, DoorProduct } from './types/database';

const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [initialStudioProduct, setInitialStudioProduct] = useState<DoorProduct | null>(null);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

  // Derive currentView from the URL path for sidebar & header state
  const currentView: NavView = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/order-management') || path.startsWith('/orders')) return 'orders';
    if (path.startsWith('/configurator') || path.startsWith('/studio')) return 'configurator';
    if (path.startsWith('/clients')) return 'clients';
    if (path.startsWith('/prospects')) return 'prospects';
    if (path.startsWith('/products') || path.startsWith('/catalog')) return 'products';
    if (path.startsWith('/workers') || path.startsWith('/payroll')) return 'workers';
    return 'dashboard';
  }, [location.pathname]);

  const handleNavigate = (view: NavView) => {
    const targetPath = VIEW_TO_PATH[view] || '/dashboard';
    navigate(targetPath);
  };

  // Auto-redirect if worker lands on or attempts to view a restricted path
  useEffect(() => {
    if (!user) return;

    if (currentView === 'workers' && !hasPermission('canAccessPayroll')) {
      navigate(hasPermission('canViewOrders') ? '/order-management' : '/dashboard', { replace: true });
    } else if (currentView === 'prospects' && !hasPermission('canManageProspects')) {
      navigate('/order-management', { replace: true });
    } else if (currentView === 'configurator' && !hasPermission('canCreateOrders')) {
      navigate('/order-management', { replace: true });
    } else if (currentView === 'dashboard' && !hasPermission('canViewDashboard')) {
      navigate('/order-management', { replace: true });
    }
  }, [user, currentView, hasPermission, navigate]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleStartOrderForClient = (client: Client) => {
    setOrderToEdit(null);
    try {
      localStorage.setItem('nasaq_dashboard_info_state', JSON.stringify({
        clientName: client.name,
        clientId: client.id,
        clientPhone: client.phone || '',
        clientAddress: client.address || '',
        docRef: '',
        docDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        paidAmount: 0,
        isPromoEnabled: false,
        isPoseEnabled: true,
        isTransportEnabled: true,
        scale: 0.60,
        gridGap: 20
      }));
      localStorage.setItem('nasaq_dashboard_doors_state', JSON.stringify([]));
    } catch {}
    navigate('/configurator');
  };

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans print:!h-auto print:!overflow-visible print:!bg-white print:!w-full">
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden print:!h-auto print:!overflow-visible">
        {/* HEADER */}
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
        />

        {/* WORKSPACE VIEW CONTAINER WITH REACT ROUTER */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 print:!h-auto print:!overflow-visible print:!p-0 print:!pb-0">
          <Routes>
            {/* 1. Dashboard Route */}
            <Route 
              path="/dashboard" 
              element={
                hasPermission('canViewDashboard') ? (
                  <DashboardView
                    key={ordersRefreshKey}
                    onNavigate={handleNavigate}
                    onSelectOrder={setSelectedOrder}
                    onRecordPayment={setPaymentModalOrder}
                  />
                ) : (
                  <Navigate to="/order-management" replace />
                )
              } 
            />

            {/* 2. Order Management Route */}
            <Route 
              path="/order-management" 
              element={
                hasPermission('canViewOrders') ? (
                  <OrdersListView
                    key={ordersRefreshKey}
                    onOpenConfigurator={() => {
                      setOrderToEdit(null);
                      setInitialStudioProduct(null);
                      try {
                        localStorage.removeItem('nasaq_dashboard_info_state');
                        localStorage.removeItem('nasaq_dashboard_doors_state');
                      } catch {}
                      navigate('/configurator');
                    }}
                    onEditOrderInStudio={(order) => {
                      setOrderToEdit(order);
                      setInitialStudioProduct(null);
                      navigate('/configurator');
                    }}
                    onSelectOrder={setSelectedOrder}
                    onRecordPayment={setPaymentModalOrder}
                  />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            {/* Alias /orders -> /order-management */}
            <Route path="/orders" element={<Navigate to="/order-management" replace />} />

            {/* 3. 2D Configurator Studio Route */}
            <Route 
              path="/configurator" 
              element={
                hasPermission('canCreateOrders') ? (
                  <ConfiguratorView 
                    onOrderSaved={() => {
                      setOrderToEdit(null);
                      setInitialStudioProduct(null);
                      setOrdersRefreshKey(k => k + 1);
                      navigate('/order-management');
                    }}
                    orderToEdit={orderToEdit}
                    initialProduct={initialStudioProduct}
                    onClearOrderToEdit={() => setOrderToEdit(null)}
                    onClearInitialProduct={() => setInitialStudioProduct(null)}
                  />
                ) : (
                  <Navigate to="/order-management" replace />
                )
              } 
            />
            {/* Alias /studio -> /configurator */}
            <Route path="/studio" element={<Navigate to="/configurator" replace />} />

            {/* 4. Clients CRM Route */}
            <Route 
              path="/clients" 
              element={
                hasPermission('canManageClients') ? (
                  <ClientsListView onStartOrderForClient={handleStartOrderForClient} />
                ) : (
                  <Navigate to="/order-management" replace />
                )
              } 
            />

            {/* 5. Prospects Pipeline Route */}
            <Route 
              path="/prospects" 
              element={
                hasPermission('canManageProspects') ? (
                  <ProspectsPipelineView />
                ) : (
                  <Navigate to="/order-management" replace />
                )
              } 
            />

            {/* 6. WPC Doors Catalog Route */}
            <Route 
              path="/products" 
              element={
                <ProductsCatalogView 
                  onOpenStudioWithProduct={(prod) => {
                    if (hasPermission('canCreateOrders')) {
                      setOrderToEdit(null);
                      setInitialStudioProduct(prod);
                      navigate('/configurator');
                    }
                  }} 
                />
              } 
            />
            {/* Alias /catalog -> /products */}
            <Route path="/catalog" element={<Navigate to="/products" replace />} />

            {/* 7. Workers & Payroll (RH) Route */}
            <Route 
              path="/workers" 
              element={
                hasPermission('canAccessPayroll') ? (
                  <WorkersPayrollView />
                ) : (
                  <Navigate to="/order-management" replace />
                )
              } 
            />
            {/* Alias /payroll -> /workers */}
            <Route path="/payroll" element={<Navigate to="/workers" replace />} />

            {/* Default Landing / Catch-all Redirect */}
            <Route 
              path="/" 
              element={
                <Navigate 
                  to={hasPermission('canViewDashboard') ? "/dashboard" : "/order-management"} 
                  replace 
                />
              } 
            />
            <Route 
              path="*" 
              element={
                <Navigate 
                  to={hasPermission('canViewDashboard') ? "/dashboard" : "/order-management"} 
                  replace 
                />
              } 
            />
          </Routes>
        </main>
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefreshOrder={() => {
            setOrdersRefreshKey(k => k + 1);
          }}
          onDeleteOrder={() => {
            setSelectedOrder(null);
            setOrdersRefreshKey(k => k + 1);
          }}
          onRecordPayment={(ord) => setPaymentModalOrder(ord)}
          onEditInStudio={(order) => {
            setOrderToEdit(order);
            navigate('/configurator');
          }}
        />
      )}

      {paymentModalOrder && (
        <RecordPaymentModal
          order={paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          onSuccess={() => {
            setSelectedOrder(null);
            setOrdersRefreshKey(k => k + 1);
          }}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <DashboardLayout />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
