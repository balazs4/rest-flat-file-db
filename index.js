const log = require('debug')('rest-flat');
const koa = require('koa');
const to = require('koa-path-match')();
const bodyparser = require('koa-bodyparser');

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
      })
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
            ctx.status = 409;
          } else {
            const { body } = ctx.request;
            console.log(JSON.stringify(body));
            await db.put(key, body);
            ctx.headers['location'] = `/${key}`;
            ctx.status = 201;
          }
          break;

        default:
          return next();
      }
    })
  );

  return app;
};
