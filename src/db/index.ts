import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

function isValidPostgresConnectionString(str?: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim().toLowerCase();
  return trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://');
}

export const createPool = () => {
  if (!global._postgresPool) {
    const rawConnectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.SUPABASE_DATABASE_URL;

    const connectionString = isValidPostgresConnectionString(rawConnectionString)
      ? rawConnectionString!.trim()
      : null;

    if (connectionString) {
      const isLocal =
        connectionString.includes('localhost') ||
        connectionString.includes('127.0.0.1');
      const requiresSsl =
        connectionString.includes('sslmode=require') ||
        (!isLocal && !connectionString.includes('sslmode=disable'));

      global._postgresPool = new Pool({
        connectionString,
        ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else {
      const host = process.env.SQL_HOST || 'localhost';
      const isUnixSocket = host.startsWith('/');
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

      let sslConfig: boolean | { rejectUnauthorized: boolean } | undefined =
        undefined;
      if (isUnixSocket || isLocal || process.env.SQL_SSL === 'false') {
        sslConfig = undefined;
      } else if (process.env.SQL_SSL === 'true' || (host && !isLocal && !isUnixSocket)) {
        sslConfig = { rejectUnauthorized: false };
      }

      global._postgresPool = new Pool({
        host,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432,
        ssl: sslConfig,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
export { pool };

export function getDbOrThrow() {
  const hasSqlConfig = Boolean(
    process.env.SQL_HOST ||
      process.env.SQL_DB_NAME ||
      process.env.SQL_USER ||
      process.env.SQL_PASSWORD ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.SUPABASE_DATABASE_URL
  );

  if (!hasSqlConfig) {
    throw new Error('No SQL database is configured for this deployment.');
  }

  return db;
}

export function requireSqlDbForWrite(operation: string) {
  const hasSqlConfig = Boolean(
    process.env.SQL_HOST ||
      process.env.SQL_DB_NAME ||
      process.env.SQL_USER ||
      process.env.SQL_PASSWORD ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.SUPABASE_DATABASE_URL
  );

  if (!hasSqlConfig) {
    throw new Error(`No SQL database is configured for ${operation}.`);
  }

  return db;
}
