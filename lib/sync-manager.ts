import localDB, { type SyncItem } from './db-local';
import { toast } from 'sonner';

export class SyncManager {
  private static isSyncing = false;

  /**
   * Adds an action to the sync queue and tries to process it if online.
   */
  static async enqueue(type: SyncItem['type'], action: SyncItem['action'], payload: any) {
    const syncItem: SyncItem = {
      type,
      action,
      payload,
      createdAt: Date.now(),
      status: 'PENDING'
    };

    await localDB.syncQueue.add(syncItem);

    if (navigator.onLine) {
      this.processQueue().catch(console.error);
    } else {
      toast.info('Guardado localmente. Se sincronizará automáticamente cuando vuelva la conexión.');
    }
  }

  /**
   * Processes the pending sync items.
   */
  static async processQueue() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    const items = await localDB.syncQueue
      .where('status')
      .anyOf(['PENDING', 'FAILED'])
      .toArray();

    if (items.length === 0) {
      this.isSyncing = false;
      return;
    }

    const toastId = toast.loading(`Sincronizando ${items.length} registro(s) pendiente(s)...`);
    let successCount = 0;
    let failCount = 0;

    const token = typeof window !== 'undefined' ? localStorage.getItem('gestion-poblacional-token') : null;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    for (const item of items) {
      if (!item.id) continue;
      
      try {
        await localDB.syncQueue.update(item.id, { status: 'SYNCING' });

        let url = '';
        let method = 'POST';

        if (item.type === 'FICHA_HOGAR') {
          url = '/api/identificaciones';
        } else if (item.type === 'ATENCION') {
          url = '/api/atenciones';
        } else if (item.type === 'DERIVACION') {
          url = '/api/derivaciones';
        }

        const response = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(item.payload)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Error HTTP ${response.status}`);
        }

        // Successfully synced! Delete from offline sync queue and local DB
        await localDB.syncQueue.delete(item.id);
        
        // Remove from local tables if successfully synced
        if (item.type === 'FICHA_HOGAR' && item.payload.id) {
          await localDB.fichas.delete(item.payload.id);
        } else if (item.type === 'ATENCION' && item.payload.id) {
          await localDB.atenciones.delete(item.payload.id);
        } else if (item.type === 'DERIVACION' && item.payload.id) {
          await localDB.derivaciones.delete(item.payload.id);
        }

        successCount++;
      } catch (err: any) {
        console.error(`Error syncing item ${item.id}:`, err);
        await localDB.syncQueue.update(item.id, {
          status: 'FAILED',
          error: err.message || 'Error desconocido'
        });
        failCount++;
      }
    }

    this.isSyncing = false;

    if (successCount > 0 && failCount === 0) {
      toast.success(`¡Sincronización exitosa! ${successCount} registros subidos al servidor.`, { id: toastId });
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`Sincronización parcial: ${successCount} completados, ${failCount} fallaron. Revisa el estado de la cola.`, { id: toastId });
    } else if (failCount > 0) {
      toast.error(`Error al sincronizar. ${failCount} registros no pudieron subirse.`, { id: toastId });
    } else {
      toast.dismiss(toastId);
    }
  }
}
export default SyncManager;
