/*Matitaviola   WEB APP I  A.A. 2022/23 */
import { React, useState, useEffect, useContext, useRef} from 'react';
import { Form, Button, ButtonGroup, Alert, Container, Row, Col} from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Page, Content } from '../models.js';
import {ContentForm, AddContentForm} from './PageFormComponents.jsx';
import API from '../API.js';
import UserContext from '../userContext.js';
import HandlerMessageContext from '../messageContext.js';
import dayjs from 'dayjs';

/** Title management layout **/
function TitleLayout (props) {
    const [newTitle, setNewTitle] = useState('');

    const {handleErrors} = useContext(HandlerMessageContext);

    const ctx = useContext(UserContext);
    const user = ctx.user;
    const loggedIn = ctx.loggedIn;

    const handleFormSubmit = async (event) => {
      event.preventDefault();
      try{
        await API.saveTitle({title: newTitle, author:user.name}); //again, we're using 'username' instead of the email for passport coherence
        props.setTitle(newTitle);
      }catch(err){
        handleErrors("Error while setting the title. Try again later");
      }
    };
  
    return (
      <Row className="vh-100 ">
        <Col className="log-below-nav">
          <Container className="justify-content-md-center my-title-form">
            <Row className="justify-content-md-center">
              <Col className="pt-3 pb-3" md={5} >
                <h1 className="pt-2 pb-3">WebApp Title Setter</h1>
                <Form onSubmit={handleFormSubmit}>
                  <Form.Group>
                    <Form.Control type="text" required={true} placeholder="Insert here the new title" value={newTitle} onChange={(ev) => setNewTitle(ev.target.value)} />
                  </Form.Group>
                  <Button type="submit">Set Title</Button>
                  <Link to="/backoffice" style={{ textDecoration: 'none' }}><Button variant="danger">Back</Button></Link>
                </Form>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    );
};


function PageEditLayout(props){

  const contentFormsRef = useRef(null); //to scroll to the bottom of the component

  const {handleErrors} = useContext(HandlerMessageContext);

  const ctx = useContext(UserContext)
  
  const { pageId } = useParams();
 
  // update a page into the list
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const [user, setUser] = useState(ctx.user);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(props.page? props.page : props.pages.find(p=> p.id == pageId));
  
  const [title, setTitle] = useState(page.title);
  const [contents, setContents] = useState(props.page? props.contents : []);
  const [cntSize, setCntSize] = useState(contents.length);
  const [contentChanged, setContentChanged] = useState(true);
  const [author, setAuthor] = useState(page.author);
  const [publicationDate, setPublicationDate] = useState(page.publicationDate);
  //list of removed contents
  const [removedContents, setRemovedContents] = useState([]);

  useEffect(() => {
    if(user.role === "admin"){
      API.getUsersNames().then(names => setUsers(names)).catch(e => handleErrors(e))
    }
  }, [user]);

  useEffect(() => {
    if(!props.page){
      API.getContents(pageId)
      .then(contents => {
        setContents(contents.sort((c1,c2) => c1.position - c2.position));
        setContentChanged(false);
      })
      .catch(e => {
        handleErrors({error:"Page Edit contents errors: " + e});
        setContentChanged(false);
      });
    }
  }, []); //loaded only the first time, on submit we go back to the old page

  useEffect(() => {
    let updateP = new Page(page.id, title, author, page.creationDate, publicationDate);
    setPage(updateP);
    setContentChanged(true);
  }, [title, author, publicationDate]); //updates the page when something changes

  //scrolls to bottom
  const scrollToBottom = () => {
    if (contentFormsRef.current) {
      contentFormsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  };
  useEffect(()=>{
    if(cntSize<contents.length){
      setCntSize(contents.length);
      scrollToBottom();
    }else{
      setCntSize(contents.length);
    }
  }, [contents]);

  //save and exit
  const handleSubmit = (event) => {
      event.preventDefault();
      if(!pageId || contentChanged){//i avoid calling apis if no changes were made
        if(publicationDate && dayjs(publicationDate).isBefore(dayjs(), 'day')){
            setMessage("The page can't be published back in time. Set today or a future date");
            setShow(true);
        }  
        if(contents.length<2){
            setMessage("The page needs at least 2 blocks of content");
            setShow(true);
        }else{
            //needs an header in first position
            if(contents[0].type!=="header"){
                setMessage("The page needs an header in first position");
                setShow(true);
            }else if(!contents.find(c => c.type!=="header")){ //la pagina deve contenere almeno un altro tipo di blocco
                setMessage("The page needs an header and at least a block of another type");
                setShow(true);
            }else{
              if(!props.page){ //when updating an existing page

                const changedContents = contents.filter(c => c.id>=0); //only those pre-existing that are still in the contents
                    const addedContents = contents.filter(c => c.id<0); //the newly added had a temporary id, negative

                    API.updatePage(page) //updates the page
                    .then(() =>
                      API.removeContents(page.id, removedContents) //removes deleted contents
                      .then(() => {
                        API.updateContents(page.id, changedContents) //updates pre-existing ones
                        .then( () => {
                          if(addedContents.length>0){
                            API.addContents(page.id, addedContents) //adds the new ones
                            .catch(e => handleErrors({error:`Content creation error on page ${page.title}: ` + e}))
                          }
                        })
                        .catch(e => handleErrors({error:`Content update error on page ${page.title}: ` + e}))
                      })
                      .catch(e => handleErrors({error:`Content delete error on page ${page.title}: ` + e}))
                    ).catch(e => handleErrors({error:`Page ${page.id} updating error: ` + e}));
                    
                  props.setDirty(true);

              }else{//when creating a new page

                API.addPage(page).then((pId) =>{
                  let temp = [...contents];
                  temp.forEach(c => c.pageId = pId)
                  API.addContents(pId, contents)
                    .catch(e => handleErrors({error:`Content creation error on page ${page.title}: ` + e}))
                }
                ).catch(e => handleErrors({error:`Error creating page ${page.title}: ` + e}))

                props.setDirty(true);

              }

                navigate('/backoffice');
            }
        }
      }
      else
        navigate('/backoffice');
  };

  //used to edit
  const deleteContent = (content) => {
      //finds the content
      if(content.id){ //if it has an id (so it's already in the db), add to those to remove after 
          setRemovedContents(alrRem => {
            alrRem.push(content.id); 
            return alrRem;
          })
      }

      //removes the content from the content list and updates the positions
      setContents(oldContents => {
          let temp = oldContents.
            filter(c => c.position!=content.position);
          temp.forEach(c => {if(c.position>content.position) c.position-=1});
          return temp;
      });

      setContentChanged(true);
  };

  const moveUp = (content) => {
    let oldIndex = content.position;
    let newIndex = oldIndex-1;
    //updates the positions
    if(oldIndex==0){
        setMessage("Can't get any higher");
        setShow(true);
    }else{
      setContents((oldContents) => {
        let temp = oldContents.slice();
        let element = temp[oldIndex];
        temp.splice(oldIndex, 1);
        temp.splice(newIndex, 0, element);
        temp[oldIndex].position = oldIndex;
        temp[newIndex].position = newIndex;
        return temp;
      });
      setContentChanged(true);
    }
  };

  const moveDown = (content) => {
    //updates the positions
    let oldIndex = content.position;
    let newIndex = oldIndex+1;
    //updates the positions
    if(oldIndex==contents.length-1){
        setMessage("Can't get any lower");
        setShow(true);
    }else{
      setContents((oldContents) => {
        let temp = oldContents.slice();
        let element = temp[oldIndex];
        temp.splice(oldIndex, 1);
        temp.splice(newIndex, 0, element);
        temp[oldIndex].position = oldIndex;
        temp[newIndex].position = newIndex;
        return temp;
      });
      setContentChanged(true);
    }
  };

  const addContent = (option) => {
    let newContent;
    if(option === "header")
      newContent = new Content(-1*contents.length, page.id, option, "", contents.length);
    else if(option === "paragraph")
      newContent = new Content(-1*contents.length, page.id, option, "", contents.length);
    else
      newContent = new Content(-1*contents.length, page.id, option, "0", contents.length);
    
    setContents(oldContents => {
      let temp = [...oldContents];
      temp.push(newContent);
      return temp;
    })

    setContentChanged(true);
  }

  return (
      <Form className="below-nav pb-3" onSubmit={handleSubmit}>
          <Alert
          dismissible
          show={show}
          onClose={() => setShow(false)}
          variant="danger">
          {message}
          </Alert>

          <Container fluid className="pt-2">
          <Row>
              <Col>
              <ButtonGroup className="d-flex"><Button variant="primary" type="submit">Save & Exit</Button></ButtonGroup>
              </Col>
              <Col>
              <Link to="/backoffice" style={{ textDecoration: 'none' }}><ButtonGroup className="d-flex"><Button className="my-danger">Back</Button></ButtonGroup></Link>
              </Col>
          </Row>
          </Container>

          <Form.Check className='pt-3 pb-2' type="checkbox"
            id="default-checkbox"
            checked={publicationDate? false:true}
            label="Mark as Draft" onChange={(event) =>setPublicationDate(publicationDate => publicationDate ? null : dayjs().format("YYYY-MM-DD"))}/>
          {
            publicationDate?
            <Form.Group className="pt-3">
              <Form.Label><h3>Set Publication Date</h3></Form.Label>
              <Form.Control type="date" min={dayjs().format("YYYY-MM-DD")} value={publicationDate? dayjs(publicationDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")} onChange={event => setPublicationDate(event.target.value)}/>
            </Form.Group>
            :
            <></>
          }

          {
            user.role==="admin"?
            <Form.Group className="pt-2" controlId="username">
                <Form.Label><h3>Select another author:</h3></Form.Label>
                <Form.Select value={author} onChange={(ev) => setAuthor(ev.target.value)} required={true}>
                    <option value={author}>{author}</option>
                    {users.map((user, index) => (
                    <option key={index} value={user}>
                        {user}
                    </option>
                    ))}
                </Form.Select>
            </Form.Group>
            :
            <></>
          }

          <Form.Group className="pt-3">
              <Form.Label><h3>Edit page title:</h3></Form.Label>
              <Form.Control
                      type="text"
                      required={true}
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
              />
          </Form.Group>

          <Row className="pt-3"><h3>Edit contents:</h3></Row>
          <Container className="pt-2" fluid ref={contentFormsRef}>
            <AddContentForm addContent={addContent} />
            {contents.map((cont) => (
              <ContentForm
                key={cont.id}
                content={cont}
                deleteContent={deleteContent}
                setContentChanged={setContentChanged}
                moveUp={moveUp}
                moveDown={moveDown}
              />
            ))}
          </Container>
      </Form>
  )
}

function PageAddLayout(props){

  const ctx = useContext(UserContext)

  //creates the first two contents, sets the creation date
  const firstCont = new Content(0, -1, "header", "", 0);
  const secondCont = new Content(1, -1, "paragraph", "", 1);
  const page = new Page(-1, "", ctx.user.name, dayjs().format("YYYY-MM-DD"), null);


  return(
    <PageEditLayout page={page} contents={[firstCont,secondCont]} setDirty={props.setDirty}/>
  )

}


export {TitleLayout, PageEditLayout, PageAddLayout};