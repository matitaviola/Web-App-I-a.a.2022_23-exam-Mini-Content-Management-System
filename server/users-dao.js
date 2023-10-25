/*Matitaviola   WEB APP I  A.A. 2022/23 */
'use strict';

const { db } = require('./db');
const crypto = require('crypto');

//veirfies username (email) and password at log-in time
exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user WHERE email=?';
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      }
      else {
        //by default, the local strategy looks for "username". For semplicity, we create an object with that property (using the email)
        const user = { id: row.id, username: row.email, name: row.name, role:row.role };

        //checks the hashes with an async call (hashing functions can be intensive and we want to avoid to lock the server)
        crypto.scrypt(password, row.salt, 64, function (err, hashedPassword) {
          if (err) reject(err);
          if (!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword))
            resolve(false);
          else
            resolve(user);
        });
      }
    });
  });
};

//returns user's information given its id.
exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user WHERE id=?';
    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'User not found.' });
      else {
        //by default, the local strategy looks for "username". For semplicity, we create an object with that property (using the email)
        const user = { id: row.id, username: row.email, name: row.name, role:row.role}
        resolve(user);
      }
    });
  });
};

//returns all users
exports.listUsers = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user';
    db.all(sql, [], (err, rows) => {
      if (err)
        reject(err);
      else if (rows === undefined)
        resolve({ error: 'No registered users.' });
      else {
        //by default, the local strategy looks for "username". For semplicity, we create an object with that property (using the email)
        const users = rows.map(row => {return { id: row.id, username: row.email, name: row.name, role:row.role}});
        resolve(users);
      }
    });
  });
};