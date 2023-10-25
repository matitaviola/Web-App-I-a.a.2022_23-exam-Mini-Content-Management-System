/*Matitaviola   WEB APP I  A.A. 2022/23 */
'use strict';

const express = require('express');
const {check, validationResult} = require('express-validator'); //to validate the queries
const cors = require('cors'); //cross origins resource sharing
const userDao = require('./users-dao.js'); 
const dao = require('./pages-dao.js')
const morgan = require('morgan');  //for logs

//utility function taken by this course's lab. All rights to the original writer
// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};


// Passport-related imports
const passport = require('passport'); //auth middleware
const LocalStrategy = require('passport-local'); //a.k.a. uses username (actually the email) and password
const session = require('express-session');

// init express
const app = new express();
const port = 3001;

/** setting up the middlewares **/
app.use(express.json());
 //vite might use localhost or 127, and w/ just one the cors refuses the other
const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  credentials: true
}
app.use(cors(corsOptions));

app.use(morgan('dev'));

/**************** passport and session ****************/

//sets up auth startegy: search db for user with matching password (hashed)
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password);

  if(!user)
    return callback(null, false, 'Incorrect username or password');  

  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, username, name)
}));

//serializes in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) {
  callback(null, user);
});

//extracts the current (logged-in) user starting from the session's data
passport.deserializeUser(function (user, callback) { //this user is id + email + name + role
  return callback(null, user);//it will be available in req.user
});

//Creating the session
app.use(session({
  secret: "Three may keep a secret, if two of them are dead",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

//auth middleware
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

//POST /api/sessions, used to perform the login
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => { 
    if (err)
      return next(err);
    if (!user) {
      //displays wrong login messages
      return res.status(401).json({ error: info});
    }
    //in case of success, performs login and establishes the session
    req.login(user, (err) => {
      if (err)
        return next(err);
      // this is coming from userDao.getUser() from 'verify' passed to LocalStrategy
      return res.json(req.user);
    });
  })(req, res, next);
});

//GET /api/sessions/current, checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);}
  else
    res.status(401).json({error: 'Not authenticated'});
});

//DELETE /api/session/current, used for log out
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});

/********** title management ***********/
//GET /api/title
app.get('/api/title', (req, res) => {
  dao.getTitle()
  .then(title => res.json(title))
  .catch(() => res.status(500).end());
});

//POST /api/title
app.post('/api/title', 
isLoggedIn,
(req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(401).json({ error: 'Not authorized' });
  }
  next();
},
[
  check('title').not().isEmpty(),
  check('author').not().isEmpty()
],
async (req, res) => {
   //If there any validation errors
   const errors = validationResult(req).formatWith(errorFormatter); // format error message
   if (!errors.isEmpty()) {
     return res.status(422).json({ error: errors.array().join(", ") });
   }
  dao.saveTitle(req.body)
  .then(title => res.json(title))
  .catch(() => res.status(500).end());
});

/********** page management ***********/

//GET /api/pages
app.get('/api/pages', (req, res) => {
  if(req.isAuthenticated()){
    dao.listPagesAuth()
      .then(pages => res.json({pagelist:pages}))
      .catch(()=> res.status(500).end())
  }
  else{ //not auth => just published pages
    dao.listPages()
      .then(pages => res.json({pagelist:pages}))
      .catch(()=> res.status(500).end())
  }
});

//POST /api/pages
app.post('/api/pages',
  isLoggedIn,
  [
   check('title').not().isEmpty(),
   check('author').not().isEmpty(),
   check('creationDate').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    try {
      const result = await dao.addPage(req.body);
      if (result.error == null)
        return res.status(200).json({newId:result}); 
      else
        return res.status(404).json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the insertion of page ${req.params.pageId}: ${err} ` });
    }
  }
);

//PUT /api/pages/:pageID
app.put('/api/pages/:pageId',
  isLoggedIn,
  [
   check('pageId').isInt(),
   check('id').isInt(),
   check('title').not().isEmpty(),
   check('author').not().isEmpty(),
   check('creationDate').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    try {
      const result = await dao.updatePage(req.body);
      if (result.error == null)
        return res.status(200).json(); 
      else
        return res.status(404).json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the updating of page ${req.params.pageId}: ${err} ` });
    }
  }
);

//DELETE /api/pages/:pageId
app.delete('/api/pages/:pageId',
  isLoggedIn,
  [ check('pageId').isInt() ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    try {
      //if there is no page with the specified id is still considered a successful deletion
      const result = await dao.deletePage(req.params.pageId);
      if (result == null){
        const pageResult = await dao.deleteContentsByPage(req.params.pageId);
        if(pageResult == null)
          return res.status(200).json(); 
        else 
        return res.status(404).json(pageResult);
      }
      else
        return res.status(404).json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the deletion of page ${req.params.pageId}: ${err} ` });
    }
  }
);

//GET /api/pages/:pageId/contents
app.get('/api/pages/:pageId/contents', 
  [ check('pageId').isInt() ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    try {
      const contents = await dao.listContentsOf(req.params.pageId);
      res.json(contents);
    } catch {
      res.status(500).end();
  }
});

//POST /api/pages/:pageId/contents
app.post('/api/pages/:pageId/contents',
  isLoggedIn,
  [ 
    check('pageId').isInt(),
    check("contents").not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    try {
      const doPage = await dao.getPageById(req.params.pageId);
      if ( doPage == null )
        return res.status(404).json({error:"No such page"});

      const result = await dao.addContents(req.body.contents);
      if (result == null)
        return res.status(200).json(); 
      else
        return res.status(404).json(result);

    } catch (err) {
      res.status(503).json({ error: `Database error during the insertion of contents of page ${req.params.pageId}: ${err} ` });
    }
  }
);

//PUT /api/pages/:pageId/contents
app.put('/api/pages/:pageId/contents',
  isLoggedIn,
  [ 
    check('pageId').isInt(),
    check("contents").not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    try {
      const doPage = await dao.getPageById(req.params.pageId);
      if ( doPage == null )
        return res.status(404).json({error:"No such page"});

      const result = await dao.updateContents(req.body.contents);
      if (result == null)
        return res.status(200).json(); 
      else
        return res.status(404).json(result);

    } catch (err) {
      res.status(503).json({ error: `Database error during the updating of contents of page ${req.params.pageId}: ${err} ` });
    }
  }
);

//DELETE /api/pages/:pageId/contents
app.delete('/api/pages/:pageId/contents',
  isLoggedIn,
  [ 
    check('pageId').isInt(),
    check("ids").not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    try {

      const doPage = await dao.getPageById(req.params.pageId);
      if ( doPage == null )
        return res.status(404).json({error:"No such page"});
      
      //if there is no contents with the specified id is still considered a successful deletion
      const result = await dao.deleteContents(req.body.ids);
      if (result == null)
        return res.status(200).json(); 
      else
        return res.status(404).json(result);
    } catch (err) {
      res.status(503).json({ error: `Database error during the deletion of contents of page ${req.params.pageId}: ${err} ` });
    }
  }
);

/************ users management **************/
app.get('/api/users/names', 
isLoggedIn,
(req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(401).json({ error: 'Not authorized' });
  }
  next();
},
(req, res) => {
    userDao.listUsers()
      .then(users => res.json({authors:users.map(u => u.name)}))
      .catch(()=> res.status(500).end())
});

/********** activate the server **********/
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});