# MongoDB Vector Search

[MongoDB Vector Search tutorial](https://www.mongodb.com/developer/products/atlas/semantic-search-mongodb-atlas-vector-search/)

## Install dependencies

`npm i`

## Configure connection string

1. Copy or rename `sample.env` to `.env`
2. Change the value of the connection string to point to your cluster using the following format: `mongodb+srv://<username>:<password>@<hostname>`
3. Add OpenAI Api key

## Files
1. `1_createEmbeddings.js` - creates embeddings for sample_airbnb from the sample data set
2. `2_maintainEmbeddings.js` - change stream to maintain the embeddings updated as new documents come in (currently insert operations only)
3. `3_vectorSearch.js` - perform a vector search using natual language (handles vectorization of input query and vector search returning top 10 results)

To run each file, execute `node <filename>`