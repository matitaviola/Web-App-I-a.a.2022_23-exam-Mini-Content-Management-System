/*Matitaviola   WEB APP I  A.A. 2022/23 */
'use strict';

const sqlite = require('sqlite3');

// open the database
exports.db = new sqlite.Database('cms.sqlite', (err) => {
  if (err) throw err;
});