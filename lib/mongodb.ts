import { MongoClient, MongoClientOptions, Db } from "mongodb";

const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error("MONGO_URI is not set in environment variables");
}

const MONGO_OPTIONS: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
};

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
};

/**
 * Checks if the cached MongoClient instance is still alive and has an open topology.
 * In serverless environments (Vercel / AWS Lambda / Netlify), when containers are frozen
 * and thawed, TCP sockets can be terminated by the host or MongoDB Atlas, leaving the
 * driver's topology in a 'closed' state.
 */
function isClientHealthy(clientInstance: MongoClient | null | undefined): boolean {
  if (!clientInstance) return false;
  try {
    const topology = (clientInstance as any).topology;
    if (!topology) {
      // Client instantiated but not yet connected — safe for lazy connect
      return true;
    }
    const state = topology.s?.state;
    if (state === "closed" || state === "closing" || state === "destroyed") {
      return false;
    }
    if (typeof topology.isClosed === "function" && topology.isClosed()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getMongoClient(): MongoClient {
  if (!globalWithMongo._mongoClient || !isClientHealthy(globalWithMongo._mongoClient)) {
    if (globalWithMongo._mongoClient) {
      try {
        globalWithMongo._mongoClient.close().catch(() => {});
      } catch {
        // ignore
      }
    }
    globalWithMongo._mongoClient = new MongoClient(uri!, MONGO_OPTIONS);
  }
  return globalWithMongo._mongoClient;
}

export function getMongoDb(): Db {
  const dbName = process.env.DATABASE_NAME || "gm-lead-generator";
  return getMongoClient().db(dbName);
}

/**
 * Dynamic Proxy for MongoClient:
 * Transparently re-routes calls to the active, healthy MongoClient instance so that
 * libraries (like Better Auth's mongo-adapter) that store module-level client references
 * never get stuck on a closed topology across serverless container freezes/thaws.
 */
export const client: MongoClient = new Proxy({} as MongoClient, {
  get(_target, prop, receiver) {
    const realClient = getMongoClient();
    const value = Reflect.get(realClient, prop, receiver);
    if (typeof value === "function") {
      return value.bind(realClient);
    }
    return value;
  },
});

/**
 * Dynamic Proxy for Db:
 * Transparently re-routes calls to the active Db instance.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const realDb = getMongoDb();
    const value = Reflect.get(realDb, prop, receiver);
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});
