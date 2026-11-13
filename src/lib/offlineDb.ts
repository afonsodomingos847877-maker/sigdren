import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'sig-dren-matola-db';
const DB_VERSION = 1;
const STORE_STATE = 'app_state';
const STORE_OFFLINE_QUEUE = 'offline_inspections_queue';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_STATE)) {
          db.createObjectStore(STORE_STATE);
        }
        if (!db.objectStoreNames.contains(STORE_OFFLINE_QUEUE)) {
          db.createObjectStore(STORE_OFFLINE_QUEUE, { keyPath: 'clientSyncId' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveStateKey<T>(key: string, value: T): Promise<void> {
  const db = await getDb();
  await db.put(STORE_STATE, value, key);
}

export async function loadStateKey<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  return db.get(STORE_STATE, key);
}

export async function enqueueOfflineInspection<T extends { clientSyncId: string }>(
  inspection: T
): Promise<void> {
  const db = await getDb();
  await db.put(STORE_OFFLINE_QUEUE, inspection);
}

export async function getOfflineInspectionsQueue<T>(): Promise<T[]> {
  const db = await getDb();
  return db.getAll(STORE_OFFLINE_QUEUE);
}

export async function clearOfflineInspection(clientSyncId: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_OFFLINE_QUEUE, clientSyncId);
}

export async function clearAllState(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_STATE);
  await db.clear(STORE_OFFLINE_QUEUE);
}

