import 'dotenv/config';
import dns from 'node:dns';
import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI nao definida no .env');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync('@Admin123@', salt, 64).toString('hex');

const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db('sigdrendb');

await db.collection('users').updateOne(
  { id: 'usr-1' },
  {
    $set: {
      id: 'usr-1',
      fullName: 'Eng. Afonso Domingos',
      email: 'admin@sigdren.co.mz',
      phone: '+258 84 301 1001',
      role: 'admin',
      department: 'Direcção de Tecnologias e SIG',
      active: true,
      passwordHash: `${salt}:${hash}`,
      createdAt: new Date().toISOString(),
    },
  },
  { upsert: true }
);

const admin = await db.collection('users').findOne({ email: 'admin@sigdren.co.mz' });
console.log('Admin criado/actualizado no MongoDB:', admin.email, '-', admin.fullName, '-', admin.role);
await client.close();
