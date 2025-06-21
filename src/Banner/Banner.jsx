import "./Banner.css"
import logo from "../assets/logo-gaonwala-noback.png"
import { BsCart3 } from "react-icons/bs";

const Banner = () => {
  return (
  
    <header className="store-header">
      
      <div className="input-box">
        <input type="text" name="search-form" className="search-input" placeholder="Search Products" />
      </div>
    
      <img className="nav-img" src={logo} alt="Main-Logo" />
      
      <BsCart3 className="icon-cart" />
    </header>
  )
}

export default Banner;