import { Link } from "react-router-dom";
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

      {/* Logo → always navigates back to home (all products) */}
      <Link to="/" className="logo-container" aria-label="Go to home">
        <img
          className="nav-img"
          src={logo}
          alt="Gaon Wala"
          fetchPriority="high"
          decoding="sync"
          width="160"
          height="60"
        />
      </Link>

      <div className="icon-wrapper-group">
        <div
          className="cart-icon-wrapper"
          onClick={onCartClick}
          role="button"
          tabIndex={0}
          aria-label="Open cart"
          onKeyDown={(e) => e.key === "Enter" && onCartClick()}
        >
          <BsCart3 className="icon-cart" />
          {cart.length > 0 && (
            <span className="cart-count" aria-label={`${cart.length} items in cart`}>
              {cart.length}
            </span>
          )}
        </div>

        <div
          className="admin-icon-wrapper"
          onClick={onAdminClick}
          role="button"
          tabIndex={0}
          aria-label="Admin panel"
          onKeyDown={(e) => e.key === "Enter" && onAdminClick()}
        >
          <MdOutlineAdminPanelSettings className="icon-admin" />
        </div>
      </div>
    </header>
  );
};

export default Banner;
