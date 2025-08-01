import "./Banner.css";
import logo from "../assets/logo-gaonwala-noback.png";
import { BsCart3 } from "react-icons/bs";
import { MdOutlineAdminPanelSettings } from "react-icons/md";

const Banner = ({ cart = [], onCartClick, onSearch, onAdminClick }) => {
  return (
    <header className="store-header">
      <div className="search-wrapper">
        <input
          type="text"
          name="search-form"
          className="search-input"
          placeholder="Search Products"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="logo-container">
        <img className="nav-img" src={logo} alt="Main logo" />
      </div>

      <div className="icon-wrapper-group">
        <div className="cart-icon-wrapper" onClick={onCartClick} role="button" tabIndex={0} aria-label="Cart">
          <BsCart3 className="icon-cart" />
          {cart.length > 0 && (
            <span className="cart-count">{cart.length}</span>
          )}
        </div>

        <div className="admin-icon-wrapper" onClick={onAdminClick} role="button" tabIndex={0} aria-label="Admin Panel">
          <MdOutlineAdminPanelSettings className="icon-admin" />
        </div>
      </div>
    </header>
  );
};

export default Banner;