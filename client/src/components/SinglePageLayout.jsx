/*Matitaviola   WEB APP I  A.A. 2022/23 */
import { useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Container, Image} from 'react-bootstrap';
import imageIndex from '../imageIndex.js';
import API from '../API';

/** show the contents of  a single page **/
function SinglePageLayout(props) {
  //gets the pageId from the URL to retrieve the right page and its contents
  const {pageId} = useParams();
  const page = props.pages.find(p => p.id == pageId); //instead of direclty accessing we find(), taking into account the removal of pages
  const [contents, setContents] = useState([]);
  
  const getContents = async () => {
    const contents = await API.getContents(pageId);
    setContents(contents);
  }

  useEffect(()=> {
    //gets all the contents of this page from API
    getContents();
  }, []);

  return (
    <>
    {/*Checks on "page"to intercept errors due to invalid URLs (e.g. /pages/3 when you have two pages only)*/}
    {(page)? 
        <>
            <h1 className="below-nav">{page.title}</h1>
            <Contents contents={contents}/>
        </> :
      <p className='below-nav lead'>The selected page does not exist!</p>
    } 
    </>
  );
}

function Contents(props) {
  return (
    <Container fluid className="below-nav pb-3">
    {
        props.contents.sort((a,b) => a.position-b.position).map(cont => <SingleContent key={cont.id} content={cont}/>)
    }
    </Container>
  );
}

function SingleContent(props){
    let renderValue = <></>;
    if(props.content.type === "header"){
        renderValue =
            <Row>
                <header>
                    <h2>
                        {props.content.value}
                    </h2>
                </header>
            </Row>

    }else if(props.content.type === "paragraph"){
       renderValue =
        <Row>
            <p>
                {props.content.value}
            </p>
        </Row>
    
    }else if(props.content.type === "image"){
      const image = imageIndex[parseInt(props.content.value)];
      renderValue = 
      <Row>
        <Col align="center">
          <Image
              fluid
              src={image.src}
              alt={image.name}
              width="auto"
          />
          </Col>
      </Row>
    }

    return(
        <>
        {
            renderValue
        }
        </>
    );
}

export {SinglePageLayout};