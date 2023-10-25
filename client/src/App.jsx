/*Matitaviola   WEB APP I  A.A. 2022/23 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Container, Toast} from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate} from 'react-router-dom';
/*custom modules import: */
import './App.css';
import NavHeader from './components/NavBarComponent';
import WrongPath from './components/WrongPathComponent';
import API from './API.js';
import { FrontOfficeLayout, LoadingLayout, LoginLayout, BackOfficeLayout} from './components/GeneralLayouts';
import {PageEditLayout, TitleLayout, PageAddLayout } from './components/EditLayouts';
import { SinglePageLayout } from './components/SinglePageLayout';
import HandlerMessageContext from './messageContext';
import UserContext from './userContext';

function App() {
  const [loggedIn, setLoggedIn] = useState(false); 
  const [user, setUser] = useState(null); //the fetched user
  const [loading, setLoading] = useState(false); //load page
  const [title, setTitle] = useState('CMS - WA1'); //the title state, used when an admin changes title (has a default one in case of no entries in the db)
  const [dirty, setDirty] = useState(true); //for changes to the pagelist
 

  //Shows the error message in a toast.
  const [message, setMessage] = useState('');
  const handleErrors = (err) => {
    let msg = '';
    if (err.error) 
      msg = err.error;
    else if(String(err) === "string") 
      msg = String(err);
    else 
      msg = "Unknown Error: try again later";
    setMessage(msg); 
  }

  /*** title useEffects **/
  //this gets the title on the load
  useEffect(() => {
    const retrieveTitle = async () => {
      try{
        const retrievedTitle = await API.getTitle();
        if(retrieveTitle)
          setTitle(retrievedTitle);
      }catch(err){
        handleErrors("App titleError: "+JSON.stringify(err));
      }
    }
    retrieveTitle();
  }, []);

  /** pages useEffects **/
  //pages useEffect, refreshes when a page is deleted or when you log/delog because you can see different pages
  const [pages, setPages] = useState([]);
  useEffect(()=> {
    if(dirty){
      // get all the questions from API
      const getPages = async () => {
        try{
            setLoading(true);
            const retrievedPages = await API.getPages();
            setPages(retrievedPages);
            setDirty(false); //clears the value
            setLoading(false);
        }catch(err){
          handleErrors("err");
          setDirty(false);
          setLoading(false);
        }
      }
      getPages();
    }
  }, [dirty]);
  
  //auth useEffect
  useEffect(() => {
    const checkAuth = async () => {
      try{
        setLoading(true);
        const user = await API.getUserInfo(); //we have the user info here
        setLoggedIn(true);
        setUser(user);
        setLoading(false);
      }catch(err){
        //don't show the first unauth
        setLoading(false);
        setLoggedIn(false);
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setLoggedIn(true);
      setUser(user);
      setDirty(true);
    }catch(err) {
      throw err;
    }
  };

  const handleLogout = async () => {
    await API.logOut();
    //cleans up everything
    setLoggedIn(false);
    setUser(null);
    setDirty(true);
  };


  return (
    <BrowserRouter>
      <HandlerMessageContext.Provider value={{ handleErrors }}>
      <UserContext.Provider value={{user, loggedIn}}>
        <Routes>
          <Route element={
            <>
            <NavHeader loggedIn={loggedIn} title={title} handleLogout={handleLogout}/>
            <Container fluid className="mt-3">
              <Outlet/>
            </Container>
            </>
          }>
            <Route index 
              element={loading? <LoadingLayout /> : <FrontOfficeLayout pages={pages}/>} />
            <Route path="/login" element={!loggedIn ? <LoginLayout login={handleLogin}/> : <Navigate replace to='/backoffice' />} />
            <Route path="/backoffice" 
              element={loggedIn? <BackOfficeLayout pages={pages} setDirty={setDirty} dirty={dirty}/> : <Navigate replace to='/login'/>} />
            <Route path="/backoffice/title" 
              element={loggedIn? <TitleLayout  setTitle={setTitle} title={title} />: <Navigate replace to='/login'/>} />
            <Route path="/pages/:pageId" 
              element={<SinglePageLayout  pages={pages} setDirty={setDirty}/>} />
            <Route path="/backoffice/pages/:pageId/edit" 
              element={loggedIn? <PageEditLayout  pages={pages} setDirty={setDirty}/> : <Navigate replace to='/login'/>} />
            <Route path="/backoffice/pages/add" 
              element={loggedIn? <PageAddLayout  setDirty={setDirty}/> : <Navigate replace to='/login'/>} />
            <Route path="*" 
              element={<WrongPath />} />
          </Route>
        </Routes>
        <Toast className="fixed-bottom" show={message !== ''} onClose={() => setMessage('')} delay={5000} autohide bg="danger">
          <Toast.Body>{message}</Toast.Body>
        </Toast>
      </UserContext.Provider>
      </HandlerMessageContext.Provider>
    </BrowserRouter>
    
  )
}

export default App;