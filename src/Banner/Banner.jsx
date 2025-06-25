import "./Banner.css";
import logo from "../assets/logo-gaonwala-noback.png";
import { BsCart3 } from "react-icons/bs";

const Banner = ({ cart, onCartClick, onSearch }) => {
  return (
    <header className="store-header">
      <div className="input-box">
        <input
          type="text"
          name="search-form"
          className="search-input"
          placeholder="Search Products"
          onChange={(e) => onSearch(e.target.value)} // 🟡 Update on type
        />
      </div>

      <img className="nav-img" src={logo} alt="Main-Logo" />

      <div className="cart-icon-wrapper" onClick={onCartClick}>
        <BsCart3 className="icon-cart" />
        {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
      </div>
    </header>
  );
};

export default Banner;
