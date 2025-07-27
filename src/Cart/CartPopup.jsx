
import "./CartPopup.css";

const CartPopup = ({ cart, onClose, onRemoveFromCart }) => {
  return (
    <div className="cart-modal">
      <div className="cart-modal-content">
        <button className="close-btn" onClick={onClose}>X</button>
        <h2>Your Cart 🛒</h2>

        {cart.length === 0 ? (
          <p>No items in cart.</p>
        ) : (
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item._id} className="cart-item-card">
                <img src={item.image} alt={item.title} className="cart-item-img" />
                <div className="cart-item-details">
                  <h4>{item.title}</h4>
                  <p>{item.price}</p>
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveFromCart(item._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPopup;
