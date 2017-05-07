const log = require('debug')('rest-flat');
const koa = require('koa');
const route = require('koa-path-match')();
module.exports = flat => {
  const app = new koa();

  const db = {
    index: () => {
      return flat.keys().reduce((obj, key) => {
        obj[key] = flat.get(key);
        return obj;
      }, {});
    }
  };
  app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    log(ctx.method, ctx.path, ctx.status, `${Date.now() - start}ms`);
  });

  app.use(
    route('/').get(async ctx => {
      ctx.body = await db.index();
    })
  );
  return app;
};
