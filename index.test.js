const path = require('path');
const os = require('os');
const got = require('got');
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
      resolve(`http://localhost:${srv.address().port}`);
    });
  });

const hit = (url, options) =>
  new Promise(async resolve => {
    return got(url, options).then(resolve).catch(resolve);
  });

// ############### TESTCASES ###################

let url;
beforeAll(async () => {
  const db = await tmpDB();
  await new Promise(resolve => db.put('foo', { bar: 42 }, resolve));
  url = await listen(app(db));
});

test('GET / should response with all keys and values from the DB', async () => {
  const response = await hit(`${url}/`, { json: true });
  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({
    foo: { bar: 42 }
  });
});

test('GET /foo should response with 200 and the value of "foo"', async () => {
  const response = await hit(`${url}/foo`, { json: true });
  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({ bar: 42 });
});

test('POST /foo should response 409 Conflict ', async () => {
  const response = await hit(`${url}/foo`, {
    json: true,
    method: 'POST',
    body: 'newcontent'
  });
  expect(response.statusCode).toBe(409);
  expect(response.body).toBeUndefined();
});

test('GET /doesnotexist should response with 404 and undefined body', async () => {
  const response = await hit(`${url}/doesnotexist`, { json: true });
  expect(response.statusCode).toBe(404);
  expect(response.body).toBeUndefined();
});
