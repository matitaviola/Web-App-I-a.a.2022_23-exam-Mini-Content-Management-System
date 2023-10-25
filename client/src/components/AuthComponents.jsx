/*Matitaviola   WEB APP I  A.A. 2022/23 */

import { useState } from 'react';
import {Form, Button, ButtonGroup, Alert, Col, Row, Container} from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';

function LoginForm(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };

    props.login(credentials)
      .then( () => navigate( "/" ) )
      .catch((err) => {
        err.error? setErrorMessage(err.error) : setErrorMessage("Server error, please do report what happened"); 
        setShow(true); 
      });
  };

  return (
   <Container className="my-login-form">
  <Row className=" justify-content-md-center">
    <Col className="pt-3 pb-3" md={5} >
      <h1 className="pb-3">Login</h1>
      <Form  onSubmit={handleSubmit}>
          <Alert
            dismissible
            show={show}
            onClose={() => setShow(false)}
            variant="danger">
            {errorMessage}
          </Alert>
          <Form.Group className="mb-3" controlId="username">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={username} placeholder="Example: matita.viola@posta.it"
              onChange={(ev) => setUsername(ev.target.value)}
              required={true}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password} placeholder="Enter the password."
              onChange={(ev) => setPassword(ev.target.value)}
              required={true} minLength={8}
            />
          </Form.Group>
          <Container fluid className="pt-2">
          <Row>
            <Col>
            <ButtonGroup className="d-flex"><Button variant="primary" type="submit">Login</Button></ButtonGroup>
            </Col>
            <Col>
            <Link to="/" style={{ textDecoration: 'none' }}><ButtonGroup className="d-flex"><Button variant="danger">Back</Button></ButtonGroup></Link>
            </Col>
          </Row>
        </Container>
      </Form>
    </Col>
    </Row>
    </Container>
  )
};

function LogoutButton(props) {
  return(
    <Button variant='outline-light' onClick={props.logout}>Logout</Button>
  )
}

function LoginButton(props) {
  const navigate = useNavigate();
  return (
    <Button variant="outline-light" onClick={()=> navigate('/login')}>Login</Button>
  )
}

export { LoginForm, LogoutButton, LoginButton };