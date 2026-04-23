import { useState } from "react";
import axios from "axios";
import { API_URL } from "../config.js";
import "./CartPopup.css";

const EMPTY_CUSTOMER = { name: "", phone: "", address: "" };

const CartPopup = ({ cart, onClose, onRemoveFromCart, onOrderPlaced, onUpdateQty }) => {
  const [step, setStep] = useState("cart");
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [paymentMethod, setPaymentMethod] = useState(null);
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

  const validateCustomer = () => {
    if (!customer.name.trim())    { setFormError("Please enter your name."); return false; }
    if (!customer.phone.trim())   { setFormError("Please enter your phone number."); return false; }
    if (!/^\d{10}$/.test(customer.phone.trim()))
                                  { setFormError("Enter a valid 10-digit phone number."); return false; }
    if (!customer.address.trim()) { setFormError("Please enter your delivery address."); return false; }
    return true;
  };

  const handleCODOrder = async () => {
    setOrdering(true);
    setOrderError("");
    try {
      await axios.post(`${API_URL}/api/orders`, {
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

  const handleRazorpayPayment = async () => {
    setOrdering(true);
    setOrderError("");

    try {
      const razorpayRes = await axios.post(`${API_URL}/api/razorpay/create-order`, {
        amount: parseFloat(total.toFixed(2)),
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
        },
        items: cart.map((item) => ({
          productId: item._id,
          title:     item.title,
          price:     Number(item.price) || 0,
          image:     item.image || "",
          qty:       Number(item.qty) || 1,
        })),
      });

      const { orderId, key_id } = razorpayRes.data;

      const options = {
        key: key_id,
        amount: Math.round(parseFloat(total.toFixed(2)) * 100),
        currency: "INR",
        name: "Gaon Wala",
        description: `Order of ₹${total.toFixed(2)}`,
        order_id: orderId,
        prefill: {
          name: customer.name.trim(),
          contact: customer.phone.trim(),
        },
        handler: async function (response) {
          try {
            await axios.post(`${API_URL}/api/razorpay/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
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
            setOrderError(err.response?.data?.message || "Payment verification failed. Please contact support.");
          } finally {
            setOrdering(false);
          }
        },
        modal: {
          ondismiss: function () {
            setOrdering(false);
            setOrderError("Payment cancelled. Please try again.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setOrderError(err.response?.data?.message || "Failed to initiate payment. Try again.");
      setOrdering(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!validateCustomer()) return;
    setFormError("");
    setStep("payment");
  };

  const handlePaymentSubmit = () => {
    if (!paymentMethod) {
      setOrderError("Please select a payment method.");
      return;
    }

    if (paymentMethod === "cod") {
      handleCODOrder();
    } else if (paymentMethod === "razorpay") {
      handleRazorpayPayment();
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
                        <p className="cart-item-unit-price">₹{Number(item.price).toFixed(2)} </p>

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

        {/* ── STEP 2: Customer Details ── */}
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

              {formError && <p className="order-error">{formError}</p>}

              <div className="details-actions">
                <button className="back-btn" onClick={() => setStep("cart")}>← Back</button>
                <button className="place-order-btn" onClick={handleProceedToPayment}>
                  Continue to Payment →
                </button>
              </div>

              <div className="order-summary-mini">
                <span>{cart.length} item{cart.length > 1 ? "s" : ""}</span>
                <strong>₹{total.toFixed(2)}</strong>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: Payment Method ── */}
        {step === "payment" && (
          <>
            <h3>Choose Payment Method</h3>
            <p className="details-subtitle">Select how you'd like to pay.</p>

            <div className="payment-methods">
              {/* Cash on Delivery */}
              <div
                className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("cod")}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod("cod")}
              >
                <div className="payment-icon">💵</div>
                <div className="payment-info">
                  <h3>Cash on Delivery</h3>
                  <p>Pay when your order arrives</p>
                </div>
                <div className={`payment-radio ${paymentMethod === "cod" ? "checked" : ""}`}></div>
              </div>

              {/* Razorpay */}
              <div
                className={`payment-option ${paymentMethod === "razorpay" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("razorpay")}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod("razorpay")}
              >
                <div className="payment-icon">🔒</div>
                <div className="payment-info">
                  <h3>Pay Online (Razorpay)</h3>
                  <p>Card, UPI, Wallet — secure payment</p>
                </div>
                <div className={`payment-radio ${paymentMethod === "razorpay" ? "checked" : ""}`}></div>
              </div>
            </div>

            {orderError && <p className="order-error">{orderError}</p>}

            <div className="payment-actions">
              <button className="back-btn" onClick={() => setStep("details")}>← Back</button>
              
              {/* Different button text based on payment method */}
              {paymentMethod === "cod" ? (
                <button 
                  className="place-order-btn cod-btn" 
                  onClick={handlePaymentSubmit} 
                  disabled={ordering}
                >
                  {ordering ? "Placing Order..." : "Place Order (COD)"}
                </button>
              ) : (
                <button 
                  className="place-order-btn razorpay-btn" 
                  onClick={handlePaymentSubmit} 
                  disabled={ordering || !paymentMethod}
                >
                  {ordering ? "Opening Payment..." : `Pay Securely ₹${total.toFixed(2)}`}
                </button>
              )}
            </div>

            <div className="order-summary-mini">
              <span>{cart.length} item{cart.length > 1 ? "s" : ""}</span>
              <strong>₹{total.toFixed(2)}</strong>
            </div>
          </>
        )}

        {/* ── STEP 4: Success ── */}
        {step === "success" && (
          <div className="order-success">
            <div className="order-success-icon">✅</div>
            <h3>Order Placed!</h3>
            <p>Thank you, <strong>{customer.name}</strong>!</p>
            <p className="success-sub">
              {paymentMethod === "razorpay"
                ? "💳 Payment confirmed. Your order is confirmed."
                : "💵 We'll contact you soon. Pay when order arrives."}
            </p>
            <button className="close-after-order-btn" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPopup;
