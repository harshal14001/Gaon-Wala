import { useState } from "react";
import axios from "axios";
import "./CartPopup.css";

const EMPTY_CUSTOMER = { name: "", phone: "", address: "" };

const CartPopup = ({ cart, onClose, onRemoveFromCart, onOrderPlaced, onUpdateQty }) => {
  const [step, setStep] = useState("cart");
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [formError, setFormError] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");

  const total = cart.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.qty) || 1);
  }, 0);

  const handleCustomerChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handlePlaceOrder = async () => {
    if (!customer.name.trim())    return setFormError("Please enter your name.");
    if (!customer.phone.trim())   return setFormError("Please enter your phone number.");
    if (!/^\d{10}$/.test(customer.phone.trim()))
                                  return setFormError("Enter a valid 10-digit phone number.");
    if (!customer.address.trim()) return setFormError("Please enter your delivery address.");

    setOrdering(true);
    setOrderError("");
    try {
      await axios.post("http://localhost:5000/api/orders", {
        customer: {
          name:    customer.name.trim(),
          phone:   customer.phone.trim(),
          address: customer.address.trim(),
        },
        items: cart.map((item) => ({
          productId: item._id,
          title:     item.title,
          price:     Number(item.price) || 0,
          image:     item.image || "",
          qty:       Number(item.qty) || 1,
        })),
        total: parseFloat(total.toFixed(2)),
      });
      setStep("success");
      onOrderPlaced();
    } catch (err) {
      setOrderError(err.response?.data?.message || "Failed to place order. Try again.");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="cart-modal">
      <div className="cart-modal-content">
        <button className="close-btn" onClick={onClose}>✕</button>

        {/* ── STEP 1: Cart ── */}
        {step === "cart" && (
          <>
            <h2>Your Cart 🛒</h2>
            {cart.length === 0 ? (
              <p className="empty-cart-msg">Your cart is empty.</p>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item._id} className="cart-item-card">
                      <img src={item.image} alt={item.title} className="cart-item-img" />
                      <div className="cart-item-details">
                        <h4>{item.title}</h4>
                        <p className="cart-item-unit-price">₹{Number(item.price).toFixed(2)} each</p>

                        {/* Qty stepper inside cart */}
                        <div className="cart-qty-stepper">
                          <button
                            className="cart-qty-btn"
                            onClick={() => onUpdateQty(item._id, (item.qty || 1) - 1)}
                          >−</button>
                          <span className="cart-qty-display">{item.qty || 1}</span>
                          <button
                            className={`cart-qty-btn ${item.qty >= item.stock ? "cart-qty-disabled" : ""}`}
                            onClick={() => onUpdateQty(item._id, (item.qty || 1) + 1)}
                            disabled={item.qty >= item.stock}
                            title={item.qty >= item.stock ? `Max ${item.stock} available` : ""}
                          >+</button>
                        </div>

                        <p className="cart-line-total">
                          ₹{(Number(item.price) * (item.qty || 1)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-total">
                    Total: <strong>₹{total.toFixed(2)}</strong>
                  </div>
                  <button className="place-order-btn" onClick={() => setStep("details")}>
                    Proceed to Order →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── STEP 2: Customer details ── */}
        {step === "details" && (
          <>
            <h2>Delivery Details 📦</h2>
            <p className="details-subtitle">Tell us where to deliver your order.</p>

            <div className="customer-form">
              <div className="customer-field">
                <label>Full Name</label>
                <input name="name" placeholder="e.g. Ramesh Patil"
                  value={customer.name} onChange={handleCustomerChange} />
              </div>
              <div className="customer-field">
                <label>Phone Number</label>
                <input name="phone" placeholder="10-digit mobile number"
                  value={customer.phone} onChange={handleCustomerChange}
                  maxLength={10} type="tel" />
              </div>
              <div className="customer-field">
                <label>Delivery Address</label>
                <textarea name="address" placeholder="House no., Street, Village/City, PIN code"
                  value={customer.address} onChange={handleCustomerChange} rows={3} />
              </div>

              {formError  && <p className="order-error">{formError}</p>}
              {orderError && <p className="order-error">{orderError}</p>}

              <div className="details-actions">
                <button className="back-btn" onClick={() => setStep("cart")}>← Back</button>
                <button className="place-order-btn" onClick={handlePlaceOrder} disabled={ordering}>
                  {ordering ? "Placing..." : "Place Order 🛍️"}
                </button>
              </div>

              <div className="order-summary-mini">
                <span>{cart.length} item{cart.length > 1 ? "s" : ""}</span>
                <strong>₹{total.toFixed(2)}</strong>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: Success ── */}
        {step === "success" && (
          <div className="order-success">
            <div className="order-success-icon">✅</div>
            <h3>Order Placed!</h3>
            <p>Thank you, <strong>{customer.name}</strong>!</p>
            <p className="success-sub">We'll deliver to your address soon.</p>
            <button className="close-after-order-btn" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPopup;
