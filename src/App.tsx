import React, { useState } from 'react';
import { Sidebar, NavView } from './components/layout/Sidebar';
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
import { UserRole, Order, Client } from './types/database';
import { supabase } from './api/supabase';
import { SAMPLE_PRODUCTS, SAMPLE_CLIENTS, SAMPLE_PROSPECTS, SAMPLE_WORKERS } from './data/sampleData';
import { DEFAULT_21_DOORS } from './data/defaultDoors';
import { calculateOrderSummary } from './utils/pricing';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin');

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Toggle user role between admin and worker
  const handleToggleRole = () => {
    setUserRole(prev => (prev === 'admin' ? 'worker' : 'admin'));
  };

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
              configuration: d
            }));

            await supabase.from('order_items').insert(items);

            // Insert payment deposit
            await supabase.from('order_payments').insert({
              order_id: newOrder.id,
              amount: 80000,
              payment_date: new Date().toISOString().split('T')[0],
              notes: 'Versement acompte initial',
              status: 'successful'
            });
          }
        }
      }

      alert('Base de données Supabase initialisée avec succès !');
      // Refresh current view
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
    try {
      const savedInfo = localStorage.getItem('nasaq_dashboard_info_state');
      let current = savedInfo ? JSON.parse(savedInfo) : {};
      current.clientName = client.name;
      current.clientId = client.id;
      localStorage.setItem('nasaq_dashboard_info_state', JSON.stringify(current));
    } catch {}
    setCurrentView('configurator');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={userRole}
        onToggleRole={handleToggleRole}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <Header
          currentView={currentView}
          onNavigate={setCurrentView}
          userRole={userRole}
        />

        {/* WORKSPACE VIEW CONTAINER */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentView}
              onSelectOrder={setSelectedOrder}
              onRecordPayment={setPaymentModalOrder}
              onSeedData={handleSeedData}
            />
          )}

          {currentView === 'configurator' && (
            <ConfiguratorView onOrderSaved={() => setCurrentView('orders')} />
          )}

          {currentView === 'orders' && (
            <OrdersListView
              onOpenConfigurator={() => setCurrentView('configurator')}
              onSelectOrder={setSelectedOrder}
              onRecordPayment={setPaymentModalOrder}
            />
          )}

          {currentView === 'clients' && (
            <ClientsListView onStartOrderForClient={handleStartOrderForClient} />
          )}

          {currentView === 'prospects' && (
            <ProspectsPipelineView />
          )}

          {currentView === 'products' && (
            <ProductsCatalogView 
              onOpenStudioWithProduct={(prod) => {
                setCurrentView('configurator');
              }} 
            />
          )}

          {currentView === 'workers' && (
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
            // refresh
          }}
          onRecordPayment={(ord) => setPaymentModalOrder(ord)}
        />
      )}

      {paymentModalOrder && (
        <RecordPaymentModal
          order={paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          onSuccess={() => {
            alert('Paiement enregistré avec succès dans Supabase !');
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
