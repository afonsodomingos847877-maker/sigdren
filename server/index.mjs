import 'dotenv/config';
import dns from 'node:dns';
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI nao definida no ficheiro .env');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
let db;

function withGeoPoint(doc) {
  if (typeof doc.longitude === 'number' && typeof doc.latitude === 'number') {
    return {
      ...doc,
      location: { type: 'Point', coordinates: [doc.longitude, doc.latitude] },
    };
  }
  return doc;
}

function stripMongoId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

async function ensureIndexes(database) {
  await Promise.all([
    database.collection('users').createIndex({ id: 1 }, { unique: true }),
    database.collection('users').createIndex({ email: 1 }, { unique: true }),
    database.collection('infrastructures').createIndex({ id: 1 }, { unique: true }),
    database.collection('infrastructures').createIndex({ code: 1 }, { unique: true }),
    database.collection('infrastructures').createIndex({ location: '2dsphere' }),
    database.collection('inspections').createIndex({ id: 1 }, { unique: true }),
    database.collection('inspections').createIndex({ clientSyncId: 1 }, { unique: true }),
    database.collection('inspections').createIndex({ location: '2dsphere' }),
    database.collection('occurrences').createIndex({ id: 1 }, { unique: true }),
    database.collection('occurrences').createIndex({ location: '2dsphere' }),
    database.collection('risk_zones').createIndex({ id: 1 }, { unique: true }),
    database.collection('maintenance_plans').createIndex({ id: 1 }, { unique: true }),
    database.collection('work_orders').createIndex({ id: 1 }, { unique: true }),
    database.collection('indicators').createIndex({ id: 1 }, { unique: true }),
    database.collection('notifications').createIndex({ id: 1 }, { unique: true }),
    database.collection('audit_logs').createIndex({ id: 1 }, { unique: true }),
  ]);
}

app.get('/api/health', async (_req, res) => {
  try {
    await db.command({ ping: 1 });
    res.json({ ok: true, database: db.databaseName });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Bootstrap all collections (and seed initial demo data if empty)
app.post('/api/bootstrap', async (req, res) => {
  try {
    const seed = req.body?.seed || {};
    const existingUsers = await db.collection('users').countDocuments();

    if (existingUsers === 0 && Array.isArray(seed.users) && seed.users.length > 0) {
      await db.collection('users').insertMany(seed.users);
      if (seed.infrastructures?.length) {
        await db.collection('infrastructures').insertMany(seed.infrastructures.map(withGeoPoint));
      }
      if (seed.inspections?.length) {
        await db.collection('inspections').insertMany(seed.inspections.map(withGeoPoint));
      }
      if (seed.occurrences?.length) {
        await db.collection('occurrences').insertMany(seed.occurrences.map(withGeoPoint));
      }
      if (seed.riskZones?.length) {
        await db.collection('risk_zones').insertMany(seed.riskZones);
      }
      if (seed.maintenancePlans?.length) {
        await db.collection('maintenance_plans').insertMany(seed.maintenancePlans);
      }
      if (seed.workOrders?.length) {
        await db.collection('work_orders').insertMany(seed.workOrders);
      }
      if (seed.indicators?.length) {
        await db.collection('indicators').insertMany(seed.indicators);
      }
      if (seed.notifications?.length) {
        await db.collection('notifications').insertMany(seed.notifications);
      }
      if (seed.auditLogs?.length) {
        await db.collection('audit_logs').insertMany(seed.auditLogs);
      }
    }

    const [
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
    ] = await Promise.all([
      db.collection('users').find().toArray(),
      db.collection('infrastructures').find().sort({ createdAt: -1 }).toArray(),
      db.collection('inspections').find().sort({ createdAt: -1 }).toArray(),
      db.collection('occurrences').find().sort({ createdAt: -1 }).toArray(),
      db.collection('risk_zones').find().toArray(),
      db.collection('maintenance_plans').find().toArray(),
      db.collection('work_orders').find().sort({ createdAt: -1 }).toArray(),
      db.collection('indicators').find().toArray(),
      db.collection('notifications').find().sort({ createdAt: -1 }).toArray(),
      db.collection('audit_logs').find().sort({ createdAt: -1 }).limit(200).toArray(),
    ]);

    res.json({
      users: users.map(stripMongoId),
      infrastructures: infrastructures.map(stripMongoId),
      inspections: inspections.map(stripMongoId),
      occurrences: occurrences.map(stripMongoId),
      riskZones: riskZones.map(stripMongoId),
      maintenancePlans: maintenancePlans.map(stripMongoId),
      workOrders: workOrders.map(stripMongoId),
      indicators: indicators.map(stripMongoId),
      notifications: notifications.map(stripMongoId),
      auditLogs: auditLogs.map(stripMongoId),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Infrastructures
app.post('/api/infrastructures', async (req, res) => {
  try {
    const doc = withGeoPoint(req.body);
    await db.collection('infrastructures').insertOne(doc);
    res.status(201).json(stripMongoId(doc));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/infrastructures/:id', async (req, res) => {
  try {
    const patch = withGeoPoint(req.body);
    await db.collection('infrastructures').updateOne({ id: req.params.id }, { $set: patch });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/infrastructures/:id', async (req, res) => {
  try {
    await db.collection('infrastructures').deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Inspections (idempotent by clientSyncId for offline sync)
app.post('/api/inspections', async (req, res) => {
  try {
    const doc = withGeoPoint(req.body);
    await db
      .collection('inspections')
      .updateOne({ clientSyncId: doc.clientSyncId }, { $setOnInsert: doc }, { upsert: true });
    res.status(201).json(stripMongoId(doc));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Occurrences
app.post('/api/occurrences', async (req, res) => {
  try {
    const doc = withGeoPoint(req.body);
    await db.collection('occurrences').insertOne(doc);
    res.status(201).json(stripMongoId(doc));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/occurrences/:id', async (req, res) => {
  try {
    await db.collection('occurrences').updateOne({ id: req.params.id }, { $set: req.body });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Risk Zones
app.post('/api/risk-zones', async (req, res) => {
  try {
    await db.collection('risk_zones').insertOne(req.body);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Maintenance Plans & Work Orders
app.post('/api/maintenance-plans', async (req, res) => {
  try {
    await db.collection('maintenance_plans').insertOne(req.body);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/work-orders', async (req, res) => {
  try {
    await db.collection('work_orders').insertOne(req.body);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/work-orders/:id', async (req, res) => {
  try {
    await db.collection('work_orders').updateOne({ id: req.params.id }, { $set: req.body });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// MEAL Indicators
app.post('/api/indicators', async (req, res) => {
  try {
    await db.collection('indicators').insertOne(req.body);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/indicators/:id', async (req, res) => {
  try {
    await db.collection('indicators').updateOne({ id: req.params.id }, { $set: req.body });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Notifications
app.post('/api/notifications', async (req, res) => {
  try {
    await db.collection('notifications').insertOne(req.body);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/notifications/read-all', async (_req, res) => {
  try {
    await db.collection('notifications').updateMany({}, { $set: { read: true } });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    await db.collection('notifications').updateOne({ id: req.params.id }, { $set: { read: true } });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Users
app.post('/api/users', async (req, res) => {
  try {
    await db.collection('users').insertOne(req.body);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    await db.collection('users').updateOne({ id: req.params.id }, { $set: req.body });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Audit Logs
app.post('/api/audit-logs', async (req, res) => {
  try {
    await db.collection('audit_logs').insertOne(req.body);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reset Demo Data
app.post('/api/reset-demo', async (req, res) => {
  try {
    const seed = req.body?.seed || {};
    const collections = [
      'users',
      'infrastructures',
      'inspections',
      'occurrences',
      'risk_zones',
      'maintenance_plans',
      'work_orders',
      'indicators',
      'notifications',
      'audit_logs',
    ];
    await Promise.all(collections.map((c) => db.collection(c).deleteMany({})));

    if (seed.users?.length) await db.collection('users').insertMany(seed.users);
    if (seed.infrastructures?.length)
      await db.collection('infrastructures').insertMany(seed.infrastructures.map(withGeoPoint));
    if (seed.inspections?.length)
      await db.collection('inspections').insertMany(seed.inspections.map(withGeoPoint));
    if (seed.occurrences?.length)
      await db.collection('occurrences').insertMany(seed.occurrences.map(withGeoPoint));
    if (seed.riskZones?.length) await db.collection('risk_zones').insertMany(seed.riskZones);
    if (seed.maintenancePlans?.length)
      await db.collection('maintenance_plans').insertMany(seed.maintenancePlans);
    if (seed.workOrders?.length) await db.collection('work_orders').insertMany(seed.workOrders);
    if (seed.indicators?.length) await db.collection('indicators').insertMany(seed.indicators);
    if (seed.notifications?.length) await db.collection('notifications').insertMany(seed.notifications);
    if (seed.auditLogs?.length) await db.collection('audit_logs').insertMany(seed.auditLogs);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  await client.connect();
  db = client.db('sigdrendb');
  await ensureIndexes(db);
  console.log('Ligado ao MongoDB Atlas (sigdrendb) com indices geoespaciais 2dsphere.');
  app.listen(PORT, () => {
    console.log(`API SIG-DREN Matola a correr em http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Erro ao iniciar servidor MongoDB:', err);
  process.exit(1);
});
