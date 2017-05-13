const flat = require('flat-file-db');
const rest = require('./');

const app = rest(flat(process.env.DB || 'flat.db')).listen(
  process.env.PORT,
  () => {
    console.log(
      `rest-flat-file-db is listening on http://localhost:${app.address().port}/`
    );
  }
);
