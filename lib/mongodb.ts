import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is not set");

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
};

export function getMongoClient(): MongoClient {
  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri!, {
      maxPoolSize: 10,
      maxIdleTimeMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
  }
  return globalWithMongo._mongoClient;
}

export const client = getMongoClient();
export const db = client.db(
  process.env.DATABASE_NAME || "gm-lead-generator",
);
