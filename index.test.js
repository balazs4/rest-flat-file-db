const path = require('path');
const os = require('os');
const request = require('request-promise-native');
const flat = require('flat-file-db');
const app = require('.');

// Util methods

const tmpDB = () =>
  new Promise(resolve => {
    const tmp = path.join(os.tmpdir(), `rest-flat.${Date.now()}.db`);
    const db = flat.sync(tmp);
    resolve(db);
  });

const listen = app =>
  new Promise(resolve => {
    const srv = app.listen(() => {
      resolve({
        url: `http://localhost:${srv.address().port}`,
        close: srv.close.bind(srv)
      });
    });
  });

const client = url => (endpoint = '/', options = {}) =>
  request(
    Object.assign(
      {},
      {
        json: true,
        method: 'GET',
        simple: false,
        resolveWithFullResponse: true
      },
      options,
      {
        uri: `${url}${endpoint}`
      }
    )
  );

const verify = (code, body) => response => {
  expect(response.statusCode).toBe(code);
  expect(response.body).toEqual(body);
  return response;
};

// ############### TESTCASES ###################

let hit, cleanup;
beforeAll(async () => {
  const db = await tmpDB();
  await new Promise(resolve => db.put('foo', { bar: 42 }, resolve));
  const { url, close } = await listen(app(db));
  hit = client(url);
  cleanup = close;
  return;
});

afterAll(() => {
  if (cleanup && typeof cleanup === 'function') {
    cleanup();
  }
});

test('GET / should response 200 and a single object contains all key-value pairs', () =>
  hit('/').then(verify(200, { foo: { bar: 42 } })));

test('GET /doesnotexist should response 404 and "Not Found"', () =>
  hit('/doestnotexists').then(verify(404, 'Not Found')));

test('GET /foo should response 200 and only the value of "foo"', () =>
  hit('/foo').then(verify(200, { bar: 42 })));

test('POST /foo should response 409 and the conflicting item', () =>
  hit('/foo', { method: 'POST', body: { new: 'content' } }).then(
    verify(409, { bar: 42 })
  ));

test('POST /foo2 should response 201 and the location header should the url', () =>
  hit('/foo2', { method: 'POST', body: { bar: 16, bazz: true, note: 'yay' } })
    .then(verify(201, 'Created'))
    .then(response => {
      expect(response.headers['location']).toBe('/foo2');
    }));

test('PUT /foo2 should response 200 and the updated item', () =>
  hit('/foo2', { method: 'PUT', body: { new: 'content' } }).then(
    verify(200, { new: 'content' })
  ));

test('DELETE /foo2 should response 200 and the deleted item', () =>
  hit('/foo2', { method: 'DELETE' }).then(verify(200, { new: 'content' })));

test('POST / should respone 201 and the location header should be the url (incl. auto-generated key)', () =>
  hit('/', { method: 'POST', body: { yay: 'works' } })
    .then(verify(201, 'Created'))
    .then(response => {
      expect(response.headers['location']).toMatch(/\/[\w\d\-]+/);
    }));
