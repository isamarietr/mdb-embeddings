require('dotenv').config()

const { MongoClient } = require('mongodb');
const axios = require('axios')

/**
 * CREATE SEARCH MAPPINGS
 * 
 {
  "mappings": {
    "dynamic": true,
    "fields": {
      "desc_embedding": {
        "dimensions": 1536,
        "similarity": "cosine",
        "type": "knnVector"
      }
    }
  }
}
 */
async function main() {

  const uri = process.env.MONGODB_URI
  const openai_key = process.env.OPENAI_APIKEY
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB cluster
    await client.connect();
    const db = client.db("sample_airbnb")
    const collection = db.collection('listingsAndReviews')
    const searchQuery = "luxurious apartment"
    const result = await findEmbed(openai_key, collection, searchQuery)
    console.log(result);
  } finally {
    // Close the connection to the MongoDB cluster
    await client.close();
  }
}

main().catch(console.error);

async function findEmbed(openai_key, collection, searchQuery) {

  // Define the OpenAI API url and key.
  const url = 'https://api.openai.com/v1/embeddings';

  try {

    const data = {
      // The field inside your document that contains the data to embed, here it is the "description" field from the sample listing.
      input: searchQuery,
      model: "text-embedding-ada-002"
    }
    const headers = {
      'Authorization': [`Bearer ${openai_key}`],
      'Content-Type': ['application/json']
    }
    let response = await axios.post(url, data, { headers })

    // console.log(response);
    // Parse the JSON response
    let responseData = response.data;

    // // Call OpenAI API to get the embeddings.
    // let response = await context.http.post({
    //     url: url,
    //      headers: {
    //         'Authorization': [`Bearer ${openai_key}`],
    //         'Content-Type': ['application/json']
    //     },
    //     body: JSON.stringify({
    //         // The field inside your document that contains the data to embed, here it is the "description" field from the sample listing.
    //         input: query,
    //         model: "text-embedding-ada-002"
    //     })
    // });

    // // Parse the JSON response
    // let responseData = EJSON.parse(response.body.text());

    // Check the response status.
    if (response.status === 200) {
      console.log("Successfully received embedding.");
      const currentEmbed = responseData.data[0].embedding;

      // Query for similar documents.
      let documents = await collection.aggregate([
        {
          "$search": {
            "index": "defaultVector",
            "knnBeta": {
              "vector": currentEmbed,
              "path": "desc_embedding",
              "k": 10
            }
          }
        },
        {
          "$project": {
            "_id": 1,
            "description": 1
          }
        }
      ]).toArray();

      return documents;


    } else {
      console.log(`Failed to receive embedding. Status code: ${response.statusCode}`);
    }

  } catch (err) {
    console.error(err);
  }
}