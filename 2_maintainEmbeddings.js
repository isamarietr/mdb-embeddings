require('dotenv').config()

const { MongoClient } = require('mongodb');
const axios = require('axios')

async function main() {

  const uri = process.env.MONGODB_URI
  const openai_key = process.env.OPENAI_APIKEY
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB cluster
    await client.connect();
    const db = client.db("sample_airbnb")
    const collection = db.collection('listingsAndReviews')
    const changeStream = collection.watch([{
      $match: { operationType: 'insert' } 
    }], { fullDocument: "updateLookup"})
    changeStream.on("change", (changeEvent) => createEmbeddings(openai_key, collection, changeEvent))
  } finally {
    // Close the connection to the MongoDB cluster
    // await client.close();
  }
}

main().catch(console.error);

const createEmbeddings = async (openai_key, collection, changeEvent) => {

  const doc = changeEvent.fullDocument;

  // Define the OpenAI API url and key.
  const url = 'https://api.openai.com/v1/embeddings';

  let processedDocs = 0
  try {
    // Loop through docs
      console.log(`Processing document with id: ${doc._id}`);
      // Call OpenAI API to get the embeddings.
      const data = {
        // The field inside your document that contains the data to embed, here it is the "description" field from the sample listing.
        input: doc.description,
        model: "text-embedding-ada-002"
      }
      const headers= {
        'Authorization': [`Bearer ${openai_key}`],
        'Content-Type': ['application/json']
      }
      let response = await axios.post(url, data, { headers })

      // console.log(response);
      // Parse the JSON response
      let responseData = response.data;

      // Check the response status.
      if (response.status === 200) {
        console.log("Successfully received embedding.");

        const embedding = responseData.data[0].embedding;

        // Update the document in MongoDB.
        const result = await collection.updateOne(
          { _id: doc._id },
          // The name of the new field you'd like to contain your embeddings.
          { $set: { desc_embedding: embedding } }
        );

        if (result.modifiedCount === 1) {
          console.log("Successfully updated the document.");
          processedDocs++;
        } else {
          console.log("Failed to update the document.");
        }
      } else {
        console.log(`Failed to receive embedding. Status code: ${response.statusCode}`);
      }

  } catch (err) {
    console.error(err);
  }
  return { processedDocs }
}