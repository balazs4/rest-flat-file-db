const path = require('path');
const os = require('os');

const got = require('got');
const flat = require('flat-file-db');

const app = require('.');

let db;
beforeAll(() => {
  const tmp = path.join(
    os.tmpdir(),
    'rest-flat',
    `${process.pid}-${Date.now()}.db`
  );
  db = flat.sync(tmp);
  console.log(tmp);
  return new Promise(resolve => db.put('foo', { bar: 42 }, resolve));
});

test('smokes', async () => {
  const url = await new Promise(resolve => {
    const srv = app(db).listen(() => {
      resolve(`http://localhost:${srv.address().port}`);
    });
  });
  const response = await got(url, { json: true });
  expect(response.body).toEqual({
    foo: { bar: 42 }
  });
});
