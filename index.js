const log = require('debug')('rest-flat');
const koa = require('koa');
const to = require('koa-path-match')();

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
    get: flat.get.bind(flat)
  };

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
      const exists = await db.has(ctx.params.key);
      switch (ctx.method) {
        case 'GET':
          ctx.body = await db.get(ctx.params.key);
          ctx.status = exists === true ? 200 : 404;
          break;

        case 'POST':
          if (exists) {
            ctx.status = 409;
          } else {
            ctx.throw(500);
          }
          break;

        default:
          return next();
      }
    })
  );

  return app;
};
