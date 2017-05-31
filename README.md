# rest-flat-file-db

[![Build Status](https://travis-ci.org/balazs4/rest-flat-file-db.svg?branch=master)](https://travis-ci.org/balazs4/rest-flat-file-db)
[![dependencies](https://david-dm.org/balazs4/rest-flat-file-db/status.svg)](https://david-dm.org/balazs4/rest-flat-file-db)
[![devDependencies](https://david-dm.org/balazs4/rest-flat-file-db/dev-status.svg)](https://david-dm.org/balazs4/rest-flat-file-db?type=dev)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

> REST API for [flat-file-db](https://github.com/mafintosh/flat-file-db) powered by [koa2](https://github.com/koajs/koa)

## About

This is a tiny module which extends the lightweight `flat-file-db` key-value based `to-go` datastorage.
It might be useful for small projects (e.g. hackathon).

## Installation

## Usage

### As standalone instance

```
# install the module globally
$ npm install -g rest-flat-file-db

# start the module with default parameters
$ rest-flat

# OR start it with custom parameters
$ PORT=3333 DB=/tmp/mydatabase rest-flat
```

### As module

`$ npm install rest-flat-file-db --save`


```javascript

// index.js

const restflat = require('rest-flat-file-db');
const flatdb = require('flat-file-db');

const app = restflat(flatdb.sync('/tmp/mydatabase'));

// this is just a normal koa2 app and it is ready to launch.

app.listen();

```

**Hint**: You can pass your own `koa` app as well if you want to make some setup on it before the rest-flat endpoints will be initialized. (e.g. Authentication)
This second parameter is optional. In default case the `koa` instance  will be created by the `rest-flat-file-db` itself.


## REST API

#### GET /

200 and a single object contains all key-value pairs of the database

#### GET /:key

200 (if the `key` could be found, otherwise 404) and the value of :key

#### POST /:key

409 if `key` already exists in the database otherwise 201 and the body of the post will be stored with the `key` in the db (response.headers['location'] contains the url to the item)

#### PUT /:key

200 (if the `key` could be found, otherwise 404) and the **updated** item with its new content

#### PATCH /:key

200 (if the `key` could be found, otherwise 404) and the **merged** (with `Object.assign` call) item with its new content

#### DELETE /:key

200 (if the `key` could be found, otherwise 404) and the **deleted** item from the db (it acts like a `pop` call on a stack)

#### POST /

201 and the body of the post will be stored with a **generated** key in the db (response.headers['location'] contains the url to the item)
