import React, { useState, useEffect } from 'react';
import { Sidebar, NavView } from './components/layout/Sidebar';
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
import { Order, Client } from './types/database';

const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

  // Auto-redirect if worker lands on or attempts to view a restricted tab
  useEffect(() => {
    if (!user) return;

    if (currentView === 'workers' && !hasPermission('canAccessPayroll')) {
      setCurrentView(hasPermission('canViewOrders') ? 'orders' : 'dashboard');
    } else if (currentView === 'prospects' && !hasPermission('canManageProspects')) {
      setCurrentView('orders');
    } else if (currentView === 'configurator' && !hasPermission('canCreateOrders')) {
      setCurrentView('orders');
    } else if (currentView === 'dashboard' && !hasPermission('canViewDashboard')) {
      setCurrentView('orders');
    }
  }, [user, currentView, hasPermission]);

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
    setCurrentView('configurator');
  };

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans print:!h-auto print:!overflow-visible print:!bg-white print:!w-full">
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden print:!h-auto print:!overflow-visible">
        {/* HEADER */}
        <Header
          currentView={currentView}
          onNavigate={setCurrentView}
        />

        {/* WORKSPACE VIEW CONTAINER */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 print:!h-auto print:!overflow-visible print:!p-0 print:!pb-0">
          {currentView === 'dashboard' && hasPermission('canViewDashboard') && (
            <DashboardView
              key={ordersRefreshKey}
              onNavigate={setCurrentView}
              onSelectOrder={setSelectedOrder}
              onRecordPayment={setPaymentModalOrder}
            />
          )}

          {currentView === 'configurator' && hasPermission('canCreateOrders') && (
            <ConfiguratorView 
              onOrderSaved={() => {
                setOrderToEdit(null);
                setOrdersRefreshKey(k => k + 1);
                setCurrentView('orders');
              }}
              orderToEdit={orderToEdit}
              onClearOrderToEdit={() => setOrderToEdit(null)}
            />
          )}

          {currentView === 'orders' && hasPermission('canViewOrders') && (
            <OrdersListView
              key={ordersRefreshKey}
              onOpenConfigurator={() => {
                setOrderToEdit(null);
                try {
                  localStorage.removeItem('nasaq_dashboard_info_state');
                  localStorage.removeItem('nasaq_dashboard_doors_state');
                } catch {}
                setCurrentView('configurator');
              }}
              onEditOrderInStudio={(order) => {
                setOrderToEdit(order);
                setCurrentView('configurator');
              }}
              onSelectOrder={setSelectedOrder}
              onRecordPayment={setPaymentModalOrder}
            />
          )}

          {currentView === 'clients' && hasPermission('canManageClients') && (
            <ClientsListView onStartOrderForClient={handleStartOrderForClient} />
          )}

          {currentView === 'prospects' && hasPermission('canManageProspects') && (
            <ProspectsPipelineView />
          )}

          {currentView === 'products' && (
            <ProductsCatalogView 
              onOpenStudioWithProduct={() => {
                if (hasPermission('canCreateOrders')) {
                  setCurrentView('configurator');
                }
              }} 
            />
          )}

          {currentView === 'workers' && hasPermission('canAccessPayroll') && (
            <WorkersPayrollView />
          )}
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
            setCurrentView('configurator');
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
    <LanguageProvider>
      <AuthProvider>
        <DashboardLayout />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
