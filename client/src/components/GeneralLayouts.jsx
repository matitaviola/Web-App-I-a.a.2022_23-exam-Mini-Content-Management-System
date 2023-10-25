/*Matitaviola   WEB APP I  A.A. 2022/23 */

import dayjs from 'dayjs';
import { React, useContext} from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { LoginForm } from './AuthComponents';
import API from '../API';
import UserContext from '../userContext';
import HandlerMessageContext from '../messageContext.js';

/** used when the page is still getting the informations (perhaps due to something slowing down the server)**/
function LoadingLayout(props) {
    return (
      <Row className="vh-100">
        <Col md={8} className="below-nav">
        <Button variant="primary" disabled>
          <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
          <h1>The page list is loading...</h1>
        </Button>
        <h2>If this loading screen persists, either the server is down or your connection is :p</h2>
        </Col>
      </Row>
    )
}

/** page list: logged and unlogged **/
function FrontOfficeLayout(props) {

  return (
    <Col className="below-nav">
      <Row>
        <h1>Page list</h1>
      </Row>
      {
        props.dirty?
        <Button variant="primary" disabled>
          <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
          Loading...
        </Button>
        :
        <PageList pages={props.pages} loggedIn={false}/>
      }
      {
        !props.pages || props.pages.length==0?
        <Alert
          dismissible={false}
          show={true}
          variant="danger">
          {"If you're seeing these words it means that the server is down. Or maybe you just need to add the first page :)"}
        </Alert>
        :
        <></>
      }
    </Col>
  );
}

function BackOfficeLayout(props) {
  const {handleErrors} = useContext(HandlerMessageContext);

  const ctx = useContext(UserContext);
  const user = ctx.user;
  const loggedIn = ctx.loggedIn;

  const deletePage = (pageId) => {
    API.deletePage(pageId)
      .then(() => { props.setDirty(true); })
      .catch(e => handleErrors({error:"Page delete error: " + e})); 
  }

  return (
    <Col className="below-nav">
        {
          (loggedIn && user.role === "admin")? 
          <Row>
            <Button as={Link} to="/backoffice/title" variant="primary">
              Set the title
            </Button>
          </Row>
          :
          <></>
        }
      <Row className='pt-2'>
        <Button as={Link} to="/backoffice/pages/add" className="my-add">
                ADD a new page
        </Button>
      </Row>
      <Row className='pt-2'>
        <h1>Page list</h1>
      </Row>
      {
        props.dirty?
        <Button variant="primary" disabled>
          <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
          Loading...
        </Button>
        :
        <PageList pages={props.pages} user={user} loggedIn={loggedIn} deletePage={deletePage}/>
      }
    </Col>
  );
}

function PageList(props){
  
  const pages = props.loggedIn? props.pages : props.pages.filter((p) => (p.publicationDate && !dayjs(p.publicationDate).isAfter(dayjs())));

  return(
    <>
      {
        /*non logged users can only see published pages */
        pages.map((p) => <div key={p.id} style={{ padding: '5px' }}>
          <PageRow
            page={p}
            user={props.user}
            loggedIn={props.loggedIn}
            deletePage={props.deletePage}
          />
        </div>)
      }
    </>
  )
}

function PageRow(props) {

  let status;
    if(props.page.status === "draft")
      status = <div style={{color:"red"}}>Status: {props.page.status}</div>
    else if(props.page.status === "published")
      status = <div style={{color:"green"}}>Status: {props.page.status}</div>
    else
      status = <div style={{color:"blue"}}>Status: {props.page.status}</div>

      return (
        <Container fluid className="my-list-element">
          <Row className="d-flex align-items-center">
            <Col className="pt-2">
              <dt className="nowrap-text">
                <Link to={`/pages/${props.page.id}`}>{props.page.title}</Link>
              </dt>
              <dd>
                <i>
                  Created by {`${props.page.author} `} 
                  on {`${props.page.creationDate.format('YYYY-MM-DD')} `}
                  and published {props.page.publicationDate? `on ${props.page.publicationDate.format('YYYY-MM-DD')}` : " when it'll be finished, it's still a draft"}
                </i>
              </dd>
            </Col>
      
            <Col className="d-flex justify-content-center align-items-center">
              {props.user ? status : <></>}
            </Col>
      
            {(props.loggedIn && (props.user.role === "admin" || props.user.name === props.page.author)) ? (
              <Col align="end" className="mt-2 mb-1">
                <Link className="btn btn-primary my-edit" to={"pages/" + props.page.id + "/edit"}>
                  <i className="bi bi-pencil-square"/>
                </Link>
                &nbsp;
                <Button className="my-danger" onClick={() => props.deletePage(props.page.id)}>
                  <i className="bi bi-trash"/>
                </Button>
              </Col>
            ) : (
              <Col></Col>
            )}
          </Row>
        </Container>
      );
      
}

/** login page **/
function LoginLayout(props) {
  return (
    <Row className="vh-100">
      <Col md={12} className="log-below-nav">
        <LoginForm login={props.login} />
      </Col>
    </Row>
  );
}


export {FrontOfficeLayout, BackOfficeLayout, LoadingLayout, LoginLayout};