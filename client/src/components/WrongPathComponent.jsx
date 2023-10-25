/*Matitaviola   WEB APP I  A.A. 2022/23 */
import error_page_img from '../assets/gandalf_the_groovie.webp'

export default function WrongPath() {
    return (
      <>
        <h1 className="below-nav">You shall not pass! Fly (on another route), you fools!</h1>
        <img src={error_page_img}  alt=""></img>
      </>
    );
}