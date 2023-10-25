/*Matitaviola   WEB APP I  A.A. 2022/23 */
import {useState, useEffect, useContext} from 'react';
import {Form, Button, Dropdown, DropdownButton, Row, Col, Image} from 'react-bootstrap';
import imageIndex from '../imageIndex.js';


const ContentForm = (props) => {

    const [value, setValue] = useState(props.content.value);
    const [imgName, setImgName] = useState((props.content.type === "image") ? imageIndex[parseInt(props.content.value)].name : '');
    const [selectedImage, setSelectedImage] = useState('');
    
    const handleImageChange = (event) => {
      const selectedValue = imageIndex.findIndex(img => img.name === event.target.value);
      setValue(selectedValue);
      setImgName(event.target.value);
    
      const selectedImageObj = imageIndex.find((image) => image.name === event.target.value);
      setSelectedImage(selectedImageObj ? selectedImageObj.src : '');
    
      props.content.value = selectedValue;
      props.setContentChanged(true);
    };
    
    useEffect(() => {
      const selectedImageObj = imageIndex.find((image) => image.name === imgName);
      setSelectedImage(selectedImageObj ? selectedImageObj.src : '');
    }, [imgName]);

    useEffect(()=>{
        props.content.value = value; 
        props.setContentChanged(true)
    }, [value]);

  return (
    <>
        <Form.Group className="mb-1 pt-3">
            <Form.Label>Edit {props.content.type}:</Form.Label>
            {
                props.content.type === 'image' ? 
                <Row>
                    <Form.Select value={imgName} onChange={handleImageChange}>
                          <option value="" disabled>{imgName}</option>
                          {imageIndex.map((image, index) => (
                            <option key={index} value={image.name}>
                              {image.name}
                            </option>
                          ))}
                    </Form.Select>
                    {selectedImage && 
                    <Col align="center">
                        <Image
                        fluid
                        src={selectedImage}
                        alt={imgName}
                        width="auto"
                    />
                    </Col>}
                </Row>
                : 
                <Form.Control
                    type="text"
                    required={true}
                    value={value}
                    onChange={(event) => {setValue(event.target.value)}}
                />
            }
            
        </Form.Group>
        <Button  className="my-up" onClick={() => props.moveUp(props.content)}>
            <i className="bi bi-arrow-up"></i>
        </Button>
            &#32;
        <Button  className="my-down" onClick={() => props.moveDown(props.content)}>
                <i className="bi bi-arrow-down"></i>
        </Button>
            &#32;
        <Button  className="my-danger" onClick={() => props.deleteContent(props.content)}>
                <i className="bi bi-trash"/>
        </Button>
    </>
  );
};

const AddContentForm = (props) => {

    const handleOptionSelect = (option, event) => {
        event.target.blur(); //closes the dropdown menu
        props.addContent(option);
    };

    return (
        <>
            <Row>
                <Col xs="auto">
                <h4>Add new content:</h4>
                </Col>
                <Col align="start" xs={10}>
                    <Col sl="auto">
                        <DropdownButton title="Add Content" onSelect={handleOptionSelect}>
                        <Dropdown.Item eventKey="header">Add a Header</Dropdown.Item>
                        <Dropdown.Item eventKey="paragraph">Add a Paragraph</Dropdown.Item>
                        <Dropdown.Item eventKey="image">Add an Image</Dropdown.Item>
                        </DropdownButton>
                    </Col>
                </Col>
            </Row>
        </>
    );
};

export  {ContentForm, AddContentForm};