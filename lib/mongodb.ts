import { MongoClient } from "mongodb";

const { MONGO_URI, DB_USERNAME, DB_PASSWORD } = process.env;

const mongoUri =
  MONGO_URI ||
  "mongodb+srv://<username>:<password>@gm-lead-generator-clust.inyzidt.mongodb.net/gm-lead-generator";

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
};

export function getMongoClient(): MongoClient {
  if (!globalWithMongo._mongoClient) {
    if (DB_USERNAME && DB_PASSWORD) {
      globalWithMongo._mongoClient = new MongoClient(mongoUri, {
        auth: {
          username: DB_USERNAME,
          password: DB_PASSWORD,
        },
      });
    } else {
      globalWithMongo._mongoClient = new MongoClient(mongoUri);
    }
  }
  return globalWithMongo._mongoClient;
}

export const client = getMongoClient();
export const db = client.db();
