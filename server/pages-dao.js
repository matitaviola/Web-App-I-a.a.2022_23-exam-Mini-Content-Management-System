/*Matitaviola   WEB APP I  A.A. 2022/23 */
'use strict';

const dayjs = require('dayjs');
const { db } = require('./db');
const {Page, Content} = require('./models.js');

//return the newest title
exports.getTitle = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM title WHERE id=(SELECT MAX(id) FROM title)';
        db.get(sql, [], (err, row) => {
            if (err)
                reject(err);
            else if (row === undefined){
                resolve({id:-1, title:"Default Title - CMS"}); //if no titles in the db, return a default one
            }
            else {
                const title = { title:row.title}
                resolve(title);
            }
        });
    });
}

exports.saveTitle = (title) => {
    return new Promise((resolve, reject) => {
        const date = dayjs().format("YYYY-MM-DD");
        const sql = 'INSERT INTO title(title, author, date) VALUES(?,?,?)';
        db.run(sql, [title.title, title.author, date], function(err) {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(exports.getTitle());
            }
        });
    });
}

//adds a new page
exports.addPage = (page) => {
  const pubDate = page.publicationDate? dayjs(page.publicationDate).format("YYYY-MM-DD") : page.publicationDate;
  return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO page(title, author, creationDate, publicationDate) VALUES(?,?,?,?)';
      db.run(sql, [page.title, page.author, dayjs(page.creationDate).format("YYYY-MM-DD"), pubDate], function(err) {
          if (err) {
              reject({error: err});
          } else {
              resolve(this.lastID);
          }
      });
  });
}

//updates an existing page
exports.updatePage = (page) => {
  const pubDate = page.publicationDate? dayjs(page.publicationDate).format("YYYY-MM-DD") : page.publicationDate;
  return new Promise((resolve, reject) => {
      const sql = 'UPDATE page SET title=?, author=?, publicationDate=? WHERE id=?';
      db.run(sql, [page.title, page.author, pubDate , page.id], function(err) {
          if (err) {
              reject({error: err});
          } else {
              resolve(this.changes);
          }
      });
  });
}

//retrieves page by id
exports.getPageById = (pageId) => {
  return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM page WHERE id=?';
      db.get(sql, [pageId], (err, row) => {
          if (err)
              reject(err);
          else if (row === undefined){
              resolve(null); //no such page
          }
          else {
              const page = new Page(row.id, row.title, row.author, row.creationDate, row.publicationDate)
              resolve(page);
          }
      });
  });
}

//return list of pages in the db but only the published ones
exports.listPages = () => {
    return new Promise((resolve, reject) => {
      const today = dayjs().format("YYYY-MM-DD");
      const sql = "SELECT * FROM page WHERE publicationDate <= ?";
      db.all(sql, [today], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        if (rows === undefined || rows.length === 0) {
          reject({ error: "No published pages yet" });
          return;
        }
        const pages = rows.map(
          (p) => new Page(p.id, p.title, p.author, p.creationDate, p.publicationDate)
        );
        resolve(pages);
      });
    });
};

//return list of pages in the db
exports.listPagesAuth = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM page';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            const pages = rows.map((p) => new Page(p.id, p.title, p.author, p.creationDate, p.publicationDate));
            resolve(pages);
        });
    });
}

//deletes a certain page from the db
exports.deletePage = (pageId) =>{
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM page WHERE id=?';
    db.run(sql, [pageId], function (err) {
      if (err) {
        reject(err);
      }
      if (this.changes !== 1)
        resolve({ error: 'No page deleted.' });
      else
        resolve(null);
    });
  });
}

//retrieves the contents of a certain page
exports.listContentsOf = (pageId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM content WHERE pageId = ?';
        db.all(sql, [pageId], (err, rows) => {
          if (err) {
            reject(err);
          }
          if(rows === undefined){
            resolve(null);
          }
          const contents = rows.map((c) => new Content(c.id, pageId, c.type, c.value, c.position));
          resolve(contents);
        });
    });
}

//adds new contents to the page
exports.addContents = (contents) =>{
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO content(pageId, type, value, position) values (?,?,?,?)`;
    contents.forEach((c) => {
      db.run(sql, [c.pageId, c.type, c.value, c.position], function (err) {
        if (err) {
          reject(err.message);
        }
      });
    });
    resolve(null);
  });
}

//updates existing contents 
exports.updateContents = (contents) =>{
  return new Promise((resolve, reject) => {
    const sql = `UPDATE content SET value=?, position=? WHERE id=?`;
    contents.forEach((c) => {
      db.run(sql, [c.value, c.position, c.id], function (err) {
        if (err) {
          reject(err.message);
        }
        if(this.changes != 1){
          reject("Something went wrong: each contents in the parameters should appear once in the db");
        }
      });
    });
    resolve(null);
  });
}

//deletes some contents whose ids are passed by an array
exports.deleteContents = (ids) =>{
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM content WHERE id = ?`;
    ids.forEach((id) => {
      db.run(sql, [id], function (err) {
        if (err) {
          reject(err.message);
        }
      });
    });
    resolve(null);
  });
}

//deletes contents of a certain page from the db
exports.deleteContentsByPage = (pageId) =>{
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM content WHERE pageId=?';
    db.run(sql, [pageId], function (err) {
      if (err) {
        reject(err);
      }
        resolve(null);
    });
  });
}
