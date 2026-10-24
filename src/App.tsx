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
import { StoreInfoView } from './components/store/StoreInfoView';
import { LoginView } from './components/auth/LoginView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Order, Client } from './types/database';
import { supabase } from './api/supabase';
import { SAMPLE_PRODUCTS, SAMPLE_CLIENTS, SAMPLE_PROSPECTS, SAMPLE_WORKERS } from './data/sampleData';
import { DEFAULT_21_DOORS } from './data/defaultDoors';
import { calculateOrderSummary } from './utils/pricing';

const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
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

  // Seed sample data to Supabase
  const handleSeedData = async () => {
    if (!confirm('Voulez-vous initialiser la base de données Supabase avec les données d\'exemple NASAQ (Portes, Clients, Prospects, RH, et 1 Commande test) ?')) {
      return;
    }

    setIsSeeding(true);
    try {
      // 1. Products
      const { data: existingProds } = await supabase.from('door_products').select('id').limit(1);
      if (!existingProds || existingProds.length === 0) {
        await supabase.from('door_products').insert(SAMPLE_PRODUCTS);
      }

      // 2. Clients
      const { data: existingClients } = await supabase.from('clients').select('id').limit(1);
      let insertedClients = existingClients;
      if (!existingClients || existingClients.length === 0) {
        const { data: cData } = await supabase.from('clients').insert(SAMPLE_CLIENTS).select();
        insertedClients = cData;
      }

      // 3. Prospects
      const { data: existingProspects } = await supabase.from('prospects').select('id').limit(1);
      if (!existingProspects || existingProspects.length === 0) {
        await supabase.from('prospects').insert(SAMPLE_PROSPECTS);
      }

      // 4. Workers
      const { data: existingWorkers } = await supabase.from('workers').select('id').limit(1);
      if (!existingWorkers || existingWorkers.length === 0) {
        await supabase.from('workers').insert(SAMPLE_WORKERS);
      }

      // 5. Seed a test order with first client and product if no orders exist
      const { data: existingOrders } = await supabase.from('orders').select('id').limit(1);
      if (!existingOrders || existingOrders.length === 0) {
        const targetClient = insertedClients && insertedClients.length > 0 ? insertedClients[0] : null;
        const { data: prods } = await supabase.from('door_products').select('id').limit(1);
        const targetProd = prods && prods.length > 0 ? prods[0] : null;

        if (targetClient && targetProd) {
          const summary = calculateOrderSummary(DEFAULT_21_DOORS.slice(0, 5), true, true, true, 80000);
          
          const { data: newOrder, error: oErr } = await supabase
            .from('orders')
            .insert({
              client_id: targetClient.id,
              status: 'manufacturing',
              total_amount: summary.grandTotalPromo,
              paid_amount: 80000,
              is_promo_enabled: true,
              notes: 'Commande test showroom générée par initialisation démo.'
            })
            .select()
            .single();

          if (!oErr && newOrder) {
            // Insert 5 items
            const items = DEFAULT_21_DOORS.slice(0, 5).map(d => ({
              order_id: newOrder.id,
              product_id: targetProd.id,
              quantity: 1,
              unit_price: d.pricePromo,
              total_price: d.pricePromo,
              height: d.heightCm,
              width: d.widthCm,
              thickness: 4,
              color: d.colorId,
              configuration: {
                doorStructure: d.doorStructure,
                leftLeafPercent: d.leftLeafPercent,
                hasRevetment: d.hasRevetment,
                revetmentHeightCm: d.revetmentHeightCm,
                glassPanes: d.glassPanes,
                patternId: d.patternId,
                hardwareColor: d.hardwareColor,
                priceNormal: d.priceNormal,
                pricePromo: d.pricePromo,
              }
            }));
            await supabase.from('order_items').insert(items);

            // Insert initial payment of 80,000 DA
            await supabase.from('order_payments').insert({
              order_id: newOrder.id,
              amount: 80000,
              payment_date: new Date().toISOString().split('T')[0],
              notes: 'Acompte initial versé en espèces lors de la commande.',
              status: 'successful'
            });
          }
        }
      }

      alert('Base de données Supabase initialisée avec succès !');
      if (currentView === 'dashboard') {
        window.location.reload();
      }
    } catch (err: any) {
      console.error('Error seeding data:', err);
      alert(`Erreur d'initialisation : ${err.message || 'Vérifiez la connexion Supabase.'}`);
    } finally {
      setIsSeeding(false);
    }
  };

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
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={setCurrentView}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
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
              onSeedData={handleSeedData}
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

          {currentView === 'store' && (
            <StoreInfoView onNavigate={setCurrentView} />
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
