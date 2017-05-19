const log = require('debug')('rest-flat');
const koa = require('koa');
const to = require('koa-path-match')();
const bodyparser = require('koa-bodyparser');
const { v4 } = require('uuid');

module.exports = flat => {
  const app = new koa();

  const db = {
    index: () => {
      return flat.keys().reduce((obj, key) => {
        obj[key] = flat.get(key);
        return obj;
      }, {});
    },
    has: flat.has.bind(flat),
    get: flat.get.bind(flat),
    put: (key, value) =>
      new Promise(resolve => {
        flat.put(key, value, resolve);
      }),
    del: key => new Promise(resolve => flat.del(key, resolve))
  };

  app.use(bodyparser());

  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    log(ctx.method, ctx.path, ctx.status, `${Date.now() - start}ms`);
  });

  app.use(
    to('/', async (ctx, next) => {
      switch (ctx.method) {
        case 'GET':
          ctx.body = await db.index();
          break;

        case 'POST':
          const key = v4();
          const { body } = ctx.request;
          await db.put(key, body);
          ctx.response.set('location', `/${key}`);
          ctx.status = 201;
          break;

        default:
          return next();
      }
    })
  );

  app.use(
    to('/:key', async (ctx, next) => {
      const { key } = ctx.params;
      const exists = await db.has(key);

      switch (ctx.method) {
        case 'GET':
          ctx.body = await db.get(key);
          ctx.status = exists === true ? 200 : 404;
          break;

        case 'POST':
          if (exists) {
            ctx.body = await db.get(key);
            ctx.status = 409;
          } else {
            const { body } = ctx.request;
            await db.put(key, body);
            ctx.response.set('location', `/${key}`);
            ctx.status = 201;
          }
          break;

        case 'PUT':
          if (exists) {
            const { body } = ctx.request;
            await db.put(key, body);
            ctx.body = body;
            ctx.status = 200;
          }
          break;

        case 'DELETE':
          if (exists) {
            ctx.body = await db.get(key);
            await db.del(key);
            ctx.status = 200;
          }
          break;

        default:
          return next();
      }
    })
  );

  return app;
};
