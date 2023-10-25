/*Matitaviola   WEB APP I  A.A. 2022/23 */

import logo from '../assets/Cms_icon.png'
import login from '../assets/Login_icon.png'
import { useContext } from 'react';
import {Navbar, Nav, Form} from 'react-bootstrap';
import { LogoutButton, LoginButton } from './AuthComponents';
import { Link } from 'react-router-dom';
import UserContext from '../userContext';

function NavHeader(props) {
  const ctx = useContext(UserContext);
  const user = ctx.user;
  const loggedIn = ctx.loggedIn;
  
  return (
    <Navbar expand="sm" variant="dark" fixed="top" className="navbar-padding my-navbar-color d-flex justify-content-lg-between">
      <Nav>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Navbar.Brand>
            <i><img src={logo} width="60" height="30" className="d-inline-block align-middle" alt="" /></i>
          </Navbar.Brand>
          <Navbar.Brand>{props.title}</Navbar.Brand>
        </Link>
      </Nav>
      
      <Nav fill>
        <Navbar.Brand>
          {user && user.name && `Welcome, ${user.name}!`}
        </Navbar.Brand>
        <i>
        <Form>
          {loggedIn ? <LogoutButton logout={props.handleLogout} /> : <LoginButton login={props.login}/>}
          <Link to="/backoffice" style={{ textDecoration: 'none' }}>
            <img src={login} width="90" height="30" className="d-inline-block align-top m-1" alt=""/>
          </Link>
        </Form>
        </i>
      </Nav>
    </Navbar>
  );
}

export default NavHeader;