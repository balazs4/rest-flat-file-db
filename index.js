const koa = require('koa');

module.exports = db => {
  const app = new koa();

  app.use(async (ctx, next) => {
    if (ctx.method === 'GET' && ctx.path === '/') {
      ctx.body = await db.keys().reduce((obj, key) => {
        obj[key] = db.get(key);
        return obj;
      }, {});
      return;
    }
    await next();
  });

  app.use(ctx => {
    ctx.throw(405);
  });

  return app;
};
