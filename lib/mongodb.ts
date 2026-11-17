import { MongoClient } from "mongodb";

const { MONGO_URI, DB_USERNAME, DB_PASSWORD } = process.env;

function getConnectionString(): string {
  let uri =
    MONGO_URI ||
    "mongodb+srv://gmitsolution3_db_user:RCqvfiwMcAZ3hVc5@gm-lead-generator-clust.inyzidt.mongodb.net/gm-lead-generator";

  if (DB_USERNAME && DB_PASSWORD) {
    uri = uri
      .replace("<username>", encodeURIComponent(DB_USERNAME))
      .replace("<password>", encodeURIComponent(DB_PASSWORD));
  }

  return uri;
}

const mongoUri = getConnectionString();

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
};

export function getMongoClient(): MongoClient {
  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(mongoUri);
  }
  return globalWithMongo._mongoClient;
}

export const client = getMongoClient();
export const db = client.db();
