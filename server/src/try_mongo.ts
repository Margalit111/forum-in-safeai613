const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://<username>:<password>@autodidact-cluster.dbyvpmf.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    logger.info("Connected successfully to Atlas");
  } catch (err) {
    logger.error("Connection error:", { error: err.message, stack: err.stack });
  } finally {
    await client.close();
  }
}
run();