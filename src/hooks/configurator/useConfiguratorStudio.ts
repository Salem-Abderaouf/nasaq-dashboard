import { useState, useEffect, useCallback, useRef } from 'react';
import { DoorConfigItem, StudioGeneralInfo } from '../../types/configurator';
import { Client, Order, DoorProduct } from '../../types/database';
import { supabase } from '../../api/supabase';
import { extractOrderCode, formatDoorId } from '../../utils/formatters';
import {
  STORAGE_KEY_DOORS,
  STORAGE_KEY_INFO,
  DEFAULT_STUDIO_INFO,
  calculateStudioTotals,
  buildDefaultDoor,
  reconstructDoorsFromDbItems,
  calculateNextOrderSequence
} from '../../helpers/configurator/configuratorHelpers';

interface UseConfiguratorStudioProps {
  orderToEdit?: Order | null;
  initialProduct?: DoorProduct | null;
  onClearOrderToEdit?: () => void;
  onClearInitialProduct?: () => void;
  onOrderSaved?: () => void;
}

export function useConfiguratorStudio({
  orderToEdit,
  initialProduct,
  onClearOrderToEdit,
  onClearInitialProduct,
  onOrderSaved
}: UseConfiguratorStudioProps = {}) {
  // Default to empty fresh canvas unless resuming an active editing order
  const [doors, setDoors] = useState<DoorConfigItem[]>(() => {
    try {
      if (orderToEdit && orderToEdit.id) return [];
      const savedInfo = localStorage.getItem(STORAGE_KEY_INFO);
      const parsedInfo = savedInfo ? JSON.parse(savedInfo) : null;
      if (parsedInfo && !parsedInfo.editingOrderId) {
        const saved = localStorage.getItem(STORAGE_KEY_DOORS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [info, setInfo] = useState<StudioGeneralInfo>(() => {
    try {
      if (orderToEdit && orderToEdit.id) return DEFAULT_STUDIO_INFO;
      const saved = localStorage.getItem(STORAGE_KEY_INFO);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.editingOrderId) return parsed;
      }
    } catch {}
    return DEFAULT_STUDIO_INFO;
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [productsList, setProductsList] = useState<DoorProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Fetch catalog door products
  const loadProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('door_products').select('*').order('reference');
      if (data && !error) setProductsList(data);
    } catch (err) {
      console.warn('Could not fetch products from Supabase:', err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle incoming initialProduct from catalog "Ouvrir dans Studio"
  useEffect(() => {
    if (initialProduct) {
      const code = extractOrderCode(info.orderNumber || info.docRef);
      const newDoor: DoorConfigItem = {
        id: formatDoorId(1, code),
        productId: initialProduct.id,
        productReference: initialProduct.reference,
        heightCm: Number(initialProduct.height) || 210,
        widthCm: Number(initialProduct.width) || 90,
        designation: initialProduct.name,
        priceNormal: 39800,
        pricePromo: 37000,
        colorId: "chene_bois",
        patternId: "none",
        doorStructure: "single",
        leftLeafPercent: 28,
        hardwareColor: "black",
        glassPanes: [],
        hasRevetment: false,
        revetmentHeightCm: 110
      };
      setDoors([newDoor]);
      if (onClearInitialProduct) onClearInitialProduct();
    }
  }, [initialProduct, info.orderNumber, info.docRef, onClearInitialProduct]);

  // Load next DB order sequence number
  const fetchNextOrderNumber = useCallback(async (): Promise<string> => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false });

      const currentYear = new Date().getFullYear();
      return calculateNextOrderSequence(data || [], currentYear);
    } catch (e) {
      console.warn('Could not fetch next order number from DB:', e);
      return `ORD-${new Date().getFullYear()}-0101`;
    }
  }, []);

  // Fetch clients from Supabase
  const loadClients = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (data && !error) setClients(data);
    } catch (err) {
      console.warn('Could not fetch clients from Supabase:', err);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Auto-sync next order number from DB if starting a new blank order
  useEffect(() => {
    if (!info.editingOrderId && (!info.docRef || !info.docRef.startsWith('ORD-'))) {
      fetchNextOrderNumber().then(num => {
        setInfo(prev => ({ ...prev, docRef: num }));
      });
    }
  }, [info.editingOrderId, info.docRef, fetchNextOrderNumber]);

  // Synchronize doors ID prefix with current order reference (e.g. P1-0101, P2-0101)
  useEffect(() => {
    const code = extractOrderCode(info.orderNumber || info.docRef);
    if (!code) return;
    setDoors(prev => {
      let changed = false;
      const updated = prev.map((d, i) => {
        const expectedId = `P${i + 1}-${code}`;
        if (d.id !== expectedId) {
          changed = true;
          return { ...d, id: expectedId };
        }
        return d;
      });
      return changed ? updated : prev;
    });
  }, [info.orderNumber, info.docRef]);

  // Fetch registered orders from Supabase for selector
  const fetchDbOrders = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          clients (name, phone, address),
          order_items (*)
        `)
        .order('created_at', { ascending: false });
      if (data) setDbOrders(data);
    } catch (err) {
      console.warn('Could not fetch registered orders:', err);
    }
  }, []);

  useEffect(() => {
    fetchDbOrders();
  }, [fetchDbOrders]);

  // Load registered order from Supabase into studio for editing
  const loadOrderForEditing = useCallback(async (orderId: string) => {
    try {
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          *,
          clients (name, phone, address),
          order_items (*, door_products (*))
        `)
        .eq('id', orderId)
        .single();

      if (error || !orderData) {
        throw (error || new Error('Commande introuvable dans la base de données.'));
      }

      const code = extractOrderCode(orderData.order_number);
      const loadedDoors = reconstructDoorsFromDbItems(orderData.order_items, code);

      setDoors(loadedDoors);
      setInfo({
        editingOrderId: orderData.id,
        orderNumber: orderData.order_number,
        clientName: orderData.clients?.name || '',
        clientId: orderData.client_id,
        clientPhone: orderData.clients?.phone || '',
        clientAddress: orderData.clients?.address || '',
        docRef: orderData.order_number || `ORD-${orderData.id.slice(0, 8)}`,
        docDate: orderData.created_at 
          ? new Date(orderData.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
          : new Date().toLocaleDateString('fr-FR'),
        paidAmount: Number(orderData.paid_amount) || 0,
        isPromoEnabled: orderData.is_promo_enabled ?? true,
        isPoseEnabled: orderData.notes ? !orderData.notes.includes('Pose: NON') : true,
        isTransportEnabled: orderData.notes ? !orderData.notes.includes('Transport: NON') : true,
        scale: 0.60,
        gridGap: 20
      });

      showToast(`Commande ${orderData.order_number} chargée (${loadedDoors.length} portes).`, 'success');
    } catch (err: any) {
      console.error('Error loading order for editing:', err);
      showToast(`Erreur lors du chargement : ${err.message || 'Impossible de charger la commande.'}`, 'error');
    }
  }, [showToast]);

  // Reset to clean fresh canvas
  const resetEmpty = useCallback(async () => {
    const nextNum = await fetchNextOrderNumber();
    setDoors([]);
    setInfo({
      clientName: '',
      clientId: undefined,
      clientPhone: undefined,
      clientAddress: undefined,
      editingOrderId: undefined,
      orderNumber: undefined,
      docRef: nextNum,
      docDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      paidAmount: 0,
      isPromoEnabled: false,
      isPoseEnabled: true,
      isTransportEnabled: true,
      scale: 0.60,
      gridGap: 20
    });
    try {
      localStorage.removeItem(STORAGE_KEY_DOORS);
      localStorage.removeItem(STORAGE_KEY_INFO);
    } catch {}
    if (onClearOrderToEdit) onClearOrderToEdit();
    showToast(`Nouveau projet vierge initialisé (${nextNum}).`, 'success');
  }, [fetchNextOrderNumber, onClearOrderToEdit, showToast]);

  // Sync if orderToEdit prop changed
  const prevOrderToEditRef = useRef<Order | null | undefined>(undefined);
  useEffect(() => {
    if (orderToEdit && orderToEdit.id) {
      loadOrderForEditing(orderToEdit.id);
    } else if (orderToEdit === null && prevOrderToEditRef.current !== undefined && prevOrderToEditRef.current !== null) {
      resetEmpty();
    }
    prevOrderToEditRef.current = orderToEdit;
  }, [orderToEdit, loadOrderForEditing, resetEmpty]);

  // Save to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DOORS, JSON.stringify(doors));
      localStorage.setItem(STORAGE_KEY_INFO, JSON.stringify(info));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [doors, info]);

  const updateInfo = useCallback((updates: Partial<StudioGeneralInfo>) => {
    setInfo(prev => ({ ...prev, ...updates }));
  }, []);

  const updateDoor = useCallback((index: number, updates: Partial<DoorConfigItem>) => {
    setDoors(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  }, []);

  const addDoor = useCallback(() => {
    const nextNum = doors.length + 1;
    const code = extractOrderCode(info.orderNumber || info.docRef);
    const defaultProd = productsList.length > 0 ? productsList[0] : null;
    const newDoor = buildDefaultDoor(nextNum, code, defaultProd);
    setDoors(prev => [...prev, newDoor]);
  }, [doors.length, info.orderNumber, info.docRef, productsList]);

  const deleteDoor = useCallback((index: number) => {
    const code = extractOrderCode(info.orderNumber || info.docRef);
    setDoors(prev => {
      const copy = prev.filter((_, i) => i !== index);
      return copy.map((d, i) => ({ ...d, id: formatDoorId(i + 1, code) }));
    });
  }, [info.orderNumber, info.docRef]);

  // Save to Supabase (creates new order or updates existing registered order)
  const handleSaveToSupabase = useCallback(async () => {
    if (doors.length === 0) {
      alert('Veuillez ajouter au moins une porte avant d\'enregistrer.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Resolve client_id or create client
      let clientId = info.clientId;
      const clientName = (info.clientName || 'Client Showroom').trim();

      if (!clientId) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .ilike('name', clientName)
          .limit(1);

        if (existing && existing.length > 0) {
          clientId = existing[0].id;
        } else {
          const { data: newClient, error: clientErr } = await supabase
            .from('clients')
            .insert({
              name: clientName,
              phone: '0550 00 00 00',
              address: 'Adresse client configurateur',
              notes: `Créé depuis le studio de configuration (${info.docRef})`
            })
            .select()
            .single();

          if (clientErr) throw clientErr;
          clientId = newClient.id;
        }
      }

      // 2. Ensure door_products reference exists or use default
      let defaultProductId: string | null = null;
      const { data: products } = await supabase.from('door_products').select('id, reference').limit(1);
      if (products && products.length > 0) {
        defaultProductId = products[0].id;
      } else {
        const { data: newProd, error: prodErr } = await supabase
          .from('door_products')
          .insert({
            reference: 'C1',
            name: "Porte d'intérieur WPC Standard",
            category: 'Bedroom',
            height: 210,
            width: 90,
            thickness: 4,
            description: 'Référence de base WPC'
          })
          .select()
          .single();

        if (!prodErr && newProd) {
          defaultProductId = newProd.id;
        }
      }

      // Calculate totals
      const totals = calculateStudioTotals(
        doors,
        info.isPromoEnabled ?? false,
        info.isPoseEnabled ?? true,
        info.isTransportEnabled ?? true
      );
      const grandTotal = totals.grandTotal;

      const orderNotes = `Généré via Studio Configuration. Réf: ${info.docRef}. Pose: ${info.isPoseEnabled ? 'OUI' : 'NON'}, Transport: ${info.isTransportEnabled ? 'OUI' : 'NON'}`;

      let targetOrderId = info.editingOrderId;
      let orderNumber = info.orderNumber;
      const depositAmount = Number(info.paidAmount) || 0;
      const todayIso = new Date().toISOString().split('T')[0];

      if (info.editingOrderId) {
        // UPDATE existing order in Supabase
        const { data: updatedOrder, error: updateErr } = await supabase
          .from('orders')
          .update({
            client_id: clientId,
            total_amount: grandTotal,
            paid_amount: depositAmount,
            is_promo_enabled: info.isPromoEnabled,
            notes: orderNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', info.editingOrderId)
          .select()
          .single();

        if (updateErr) throw updateErr;
        orderNumber = updatedOrder.order_number;

        // Delete old order_items and replace with updated doors
        await supabase.from('order_items').delete().eq('order_id', info.editingOrderId);

        // Record any difference in deposit if deposit was changed in the studio
        if (depositAmount > 0) {
          const { data: existingPayments } = await supabase
            .from('order_payments')
            .select('id, amount, status')
            .eq('order_id', info.editingOrderId)
            .neq('status', 'voided');

          const recordedTotal = (existingPayments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
          const diff = depositAmount - recordedTotal;

          if (diff > 0) {
            const { error: payErr } = await supabase.from('order_payments').insert({
              order_id: info.editingOrderId,
              amount: diff,
              payment_date: todayIso,
              notes: recordedTotal === 0 
                ? `Acompte initial versé à la commande (${orderNumber || 'Commande'})` 
                : `Versement complémentaire ajusté dans le studio (${orderNumber || 'Commande'})`,
              status: 'successful'
            });
            if (payErr) {
              console.error('Error recording payment adjustment on order update:', payErr);
            }
          }
        }
      } else {
        // INSERT new order in Supabase
        let orderNumToSave = info.docRef;
        if (!orderNumToSave || !orderNumToSave.startsWith('ORD-')) {
          orderNumToSave = await fetchNextOrderNumber();
        }

        const { data: newOrder, error: orderErr } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumToSave,
            client_id: clientId,
            status: 'confirmed',
            total_amount: grandTotal,
            paid_amount: depositAmount,
            is_promo_enabled: info.isPromoEnabled,
            notes: orderNotes
          })
          .select()
          .single();

        if (orderErr) throw orderErr;
        targetOrderId = newOrder.id;
        orderNumber = newOrder.order_number;

        // If deposit entered for new order, record payment transaction
        if (depositAmount > 0) {
          const { error: payErr } = await supabase.from('order_payments').insert({
            order_id: newOrder.id,
            amount: depositAmount,
            payment_date: todayIso,
            notes: `Acompte versé à la commande (${newOrder.order_number || orderNumToSave})`,
            status: 'successful'
          });
          if (payErr) {
            console.error('Error inserting initial deposit payment:', payErr);
          }
        }
      }

      // Ensure door IDs incorporate the confirmed order code (e.g. P1-0101, P2-0101)
      const finalCode = extractOrderCode(orderNumber || info.docRef);
      const finalizedDoors = doors.map((d, i) => ({
        ...d,
        id: formatDoorId(i + 1, finalCode)
      }));
      setDoors(finalizedDoors);

      // Insert updated door items
      if (targetOrderId) {
        const orderItemsPayload = finalizedDoors.map(d => ({
          order_id: targetOrderId,
          product_id: d.productId || defaultProductId,
          quantity: 1,
          unit_price: info.isPromoEnabled ? d.pricePromo : d.priceNormal,
          total_price: info.isPromoEnabled ? d.pricePromo : d.priceNormal,
          height: d.heightCm,
          width: d.widthCm,
          thickness: 4,
          color: d.colorId,
          configuration: d
        }));

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(orderItemsPayload);

        if (itemsErr) console.warn('Order items insert error:', itemsErr);
      }

      // Clear draft in localStorage so next order creation starts fresh
      try {
        localStorage.removeItem(STORAGE_KEY_DOORS);
        localStorage.removeItem(STORAGE_KEY_INFO);
      } catch {}

      showToast(`Commande ${orderNumber || info.docRef} ${info.editingOrderId ? 'mise à jour' : 'enregistrée'} avec succès dans Supabase !`, 'success');

      if (onOrderSaved) {
        onOrderSaved();
      }

      // Refresh registered orders list
      fetchDbOrders();
    } catch (err: any) {
      console.error('Error saving order to Supabase:', err);
      showToast(`Erreur d'enregistrement : ${err.message || 'Échec de la synchronisation'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [doors, info, fetchNextOrderNumber, showToast, onOrderSaved, fetchDbOrders]);

  return {
    doors,
    setDoors,
    info,
    setInfo,
    updateInfo,
    updateDoor,
    addDoor,
    deleteDoor,
    clients,
    dbOrders,
    productsList,
    isSaving,
    toastMessage,
    setToastMessage,
    showToast,
    loadOrderForEditing,
    resetEmpty,
    handleSaveToSupabase
  };
}
