/*Matitaviola   WEB APP I  A.A. 2022/23 */
'use strict';

import { Page, Content} from './models';
const SERVER_URL = 'http://localhost:3001';

/****************************** User's session APIs *****************************/
//api call to login route, passes the inserted credentials an returns a user if one with such credentials is registered
const logIn = async (credentials) => {
    const response = await fetch(SERVER_URL + '/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });
    if(response.ok) {
      const user = await response.json();
      return user;
    }
    else {
      const errDetails = await response.text();
      throw JSON.parse(errDetails);
    }
};

//used to check if the user is still logged in. Returns a user json object (or an error) 
const getUserInfo = async () => {
    const response = await fetch(SERVER_URL + '/api/sessions/current', {
      credentials: 'include',
    });
    const user = await response.json();
    if (response.ok) {
      return user;
    } else {
      throw user;  //an object with the error coming from the server
    }
};

//logs the user out, destroying the session
const logOut = async() => {
    const response = await fetch(SERVER_URL + '/api/sessions/current', {
      method: 'DELETE',
      credentials: 'include'
    });
    if (response.ok){ //this could be avoided and just return the result, but it's always useful to handle unexpected errors
      return null;
    }else{
        throw "Something that should not happen at logout just happened: "+JSON.stringify(response);
    }
};

/****************************** Title APIs *****************************/
const getTitle = async () => {
  //the dates could be null (actually only publishDate, but better safe than sorry) or a string in the format DD-MM-YYYY
    const response = await fetch(SERVER_URL + '/api/title');
    if(response.ok) {
      const responseJson = await response.json();
      return responseJson.title;
    }
    else
      throw new Error('Internal server error');
}

const saveTitle = async (title) => {
  //the dates could be null (actually only publishDate, but better safe than sorry) or a string in the format DD-MM-YYYY
    const response = await fetch(SERVER_URL + '/api/title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(title) // dayjs date is serialized correctly by the .toJSON method override
    });
    if(response.ok) {
      const responseJson = await response.json();
      return responseJson.title;
    }
    else
      throw new Error('Internal server error');
}

/****************************** Pages APIs *****************************/
const addPage = async (page) =>{
    const response = await fetch(SERVER_URL + '/api/pages/',{
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include', //they're included: only authorized users can wirte/delete from the db
      body: JSON.stringify(page)
    });
    const result = await response.json();
    if(!response.ok)
      throw new Error('Internal server error');
    else
      return result.newId;
}

const updatePage = async (page) =>{
  const response = await fetch(SERVER_URL + '/api/pages/'+page.id,{
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
    credentials: 'include', //they're included: only authorized users can wirte/delete from the db
    body: JSON.stringify(page)
  });
  
  if(!response.ok)
    throw new Error('Internal server error');
}

const getPages = async () => {
  //the dates could be null (actually only publishDate, but better safe than sorry) or a string in the format DD-MM-YYYY
    const response = await fetch(SERVER_URL + '/api/pages',{
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' //they're included because i filter the published pages directly on the server to avoid sending sensitive informations
    });
    if(response.ok) {
      const responseJson = await response.json();
      return responseJson.pagelist
      .map((page) => new Page(page.id, page.title, page.author, page.creationDate, page.publicationDate))
      .sort((a,b) => {
        if(a.publicationDate && b.publicationDate) return a.publicationDate.isBefore(b.publicationDate)? -1:1;
        if (!a.publicationDate) return -1;
        if (!b.publicationDate) return 1;
      });
    }
    else
      throw new Error('Internal server error');
}

const deletePage = async (pageId) => {
  //the dates could be null (actually only publishDate, but better safe than sorry) or a string in the format DD-MM-YYYY
    const response = await fetch(SERVER_URL + '/api/pages/'+pageId,{
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      credentials: 'include' //they're included because i filter the published pages directly on the server to avoid sending sensitive informations
    });
    if(!response.ok)
      throw new Error('Internal server error');
}

const getContents = async (pageId) =>{
  const response = await fetch(SERVER_URL + `/api/pages/${pageId}/contents`);
  const componentsJson = await response.json();
  if(response.ok) {
    return componentsJson.map(cmp => new Content(cmp.id, cmp.pageId, cmp.type, cmp.value, cmp.position));
  }
  else
    throw componentsJson;
}

const removeContents = async (pageId, removedIds) => {
    const response = await fetch(SERVER_URL + '/api/pages/'+pageId+'/contents/',{
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      credentials: 'include', //they're included: only authorized users can wirte/delete from the db
      body: JSON.stringify({ids:removedIds})
    });
    if(!response.ok)
      throw new Error('Internal server error');
}

const updateContents = async (pageId, changedContents) => {
  const response = await fetch(SERVER_URL + '/api/pages/'+pageId+'/contents/',{
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
    credentials: 'include', //they're included: only authorized users can wirte/delete from the db
    body: JSON.stringify({contents:changedContents})
  });
  if(!response.ok)
    throw new Error('Internal server error');
}

const addContents = async (pageId, addedContents) =>{
    const response = await fetch(SERVER_URL + '/api/pages/'+pageId+'/contents/',{
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credentials: 'include', //they're included: only authorized users can wirte/delete from the db
      body: JSON.stringify({contents:addedContents})
    });
    if(!response.ok)
      throw new Error('Internal server error');
}

/****************************** Users API ******************************/
const getUsersNames = async () =>{ //just the nicks, we don't want to pass too much informations, even if it's an admin
  const response = await fetch(SERVER_URL + `/api/users/names/`,{
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include' //they're included because i filter the published pages directly on the server to avoid sending sensitive informations
  });
  const componentsJson = await response.json();
  if(response.ok) {
    return componentsJson.authors;
  }
  else
    throw componentsJson;
}

const API = {logIn, getUserInfo, logOut, getTitle, saveTitle, addPage, updatePage, getPages, deletePage, getContents, removeContents, updateContents, addContents,  getUsersNames};
export default API;