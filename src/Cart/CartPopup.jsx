import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase.js";
import { API_URL } from "../config.js";
import "./CartPopup.css";

const EMPTY_CUSTOMER = { name: "", phone: "", address: "" };

const CartPopup = ({ cart, onClose, onRemoveFromCart, onOrderPlaced, onUpdateQty }) => {
  const [step, setStep]               = useState("cart");
  const [customer, setCustomer]       = useState(EMPTY_CUSTOMER);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [formError, setFormError]     = useState("");
  const [ordering, setOrdering]       = useState(false);
  const [orderError, setOrderError]   = useState("");

  // OTP state
  const [otp, setOtp]                         = useState("");
  const [otpSending, setOtpSending]           = useState(false);
  const [otpSent, setOtpSent]                 = useState(false);
  const [otpVerifying, setOtpVerifying]       = useState(false);
  const [otpError, setOtpError]               = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resendCooldown, setResendCooldown]   = useState(0);
  const recaptchaRef = useRef(null);

  const total = cart.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.qty) || 1);
  }, 0);

  // ── Cooldown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  // ── Cleanup reCAPTCHA on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch (_) {}
        recaptchaRef.current = null;
      }
    };
  }, []);

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

  // ── Send OTP via Firebase ──────────────────────────────────────────────────
  const handleSendOTP = async () => {
    setOtpError("");
    setOtpSending(true);

    try {
      // Create invisible reCAPTCHA — Firebase requires this to prevent abuse
      // 'otp-recaptcha' is the id of the hidden div below
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "otp-recaptcha", {
          size: "invisible",
          callback: () => {},
        });
      }

      const phoneE164 = `+91${customer.phone.trim()}`;
      const result    = await signInWithPhoneNumber(auth, phoneE164, recaptchaRef.current);

      setConfirmationResult(result);
      setOtpSent(true);
      setResendCooldown(30);             // 30-second cooldown before resend
    } catch (err) {
      console.error("OTP send error:", err);

      // Reset reCAPTCHA on error so it can be reused
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch (_) {}
        recaptchaRef.current = null;
      }

      if (err.code === "auth/too-many-requests") {
        setOtpError("Too many attempts. Please try again after some time.");
      } else if (err.code === "auth/invalid-phone-number") {
        setOtpError("Invalid phone number. Please check and try again.");
      } else {
        setOtpError("Failed to send OTP. Please try again.");
      }
    } finally {
      setOtpSending(false);
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError("Enter the 6-digit OTP sent to your phone.");
      return;
    }
    setOtpVerifying(true);
    setOtpError("");

    try {
      await confirmationResult.confirm(otp);
      // OTP verified ✅ — move to payment step
      setStep("payment");
    } catch (err) {
      console.error("OTP verify error:", err);
      if (err.code === "auth/invalid-verification-code") {
        setOtpError("Incorrect OTP. Please check and try again.");
      } else if (err.code === "auth/code-expired") {
        setOtpError("OTP has expired. Please request a new one.");
        setOtpSent(false);
      } else {
        setOtpError("Verification failed. Please try again.");
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  // ── Proceed from details → OTP ─────────────────────────────────────────────
  const handleProceedToOTP = () => {
    if (!validateCustomer()) return;
    setFormError("");
    setOtpSent(false);
    setOtp("");
    setOtpError("");
    setStep("otp");
  };

  // ── COD order ──────────────────────────────────────────────────────────────
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

  // ── Razorpay payment ───────────────────────────────────────────────────────
  const handleRazorpayPayment = async () => {
    setOrdering(true);
    setOrderError("");
    try {
      const razorpayRes = await axios.post(`${API_URL}/api/razorpay/create-order`, {
        amount: parseFloat(total.toFixed(2)),
        customer: { name: customer.name.trim(), phone: customer.phone.trim() },
        items: cart.map((item) => ({
          productId: item._id, title: item.title,
          price: Number(item.price) || 0, image: item.image || "", qty: Number(item.qty) || 1,
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
        prefill: { name: customer.name.trim(), contact: customer.phone.trim() },
        handler: async function (response) {
          try {
            await axios.post(`${API_URL}/api/razorpay/verify-payment`, {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              customer: {
                name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim(),
              },
              items: cart.map((item) => ({
                productId: item._id, title: item.title,
                price: Number(item.price) || 0, image: item.image || "", qty: Number(item.qty) || 1,
              })),
              total: parseFloat(total.toFixed(2)),
            });
            setStep("success");
            onOrderPlaced();
          } catch (err) {
            setOrderError(err.response?.data?.message || "Payment verification failed.");
          } finally {
            setOrdering(false);
          }
        },
        modal: {
          ondismiss: () => {
            setOrdering(false);
            setOrderError("Payment cancelled. Please try again.");
          },
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      setOrderError(err.response?.data?.message || "Failed to initiate payment.");
      setOrdering(false);
    }
  };

  const handlePaymentSubmit = () => {
    if (!paymentMethod) { setOrderError("Please select a payment method."); return; }
    if (paymentMethod === "cod")      handleCODOrder();
    if (paymentMethod === "razorpay") handleRazorpayPayment();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="cart-modal">
      <div className="cart-modal-content">
        <button className="close-btn" onClick={onClose}>✕</button>

        {/* ── Hidden reCAPTCHA anchor — required by Firebase, invisible to user ── */}
        <div id="otp-recaptcha" style={{ display: "none" }} />

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
                        <p className="cart-item-unit-price">₹{Number(item.price).toFixed(2)}</p>
                        <div className="cart-qty-stepper">
                          <button className="cart-qty-btn"
                            onClick={() => onUpdateQty(item._id, (item.qty || 1) - 1)}>−</button>
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
                  <div className="cart-total">Total: <strong>₹{total.toFixed(2)}</strong></div>
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
                <button className="place-order-btn" onClick={handleProceedToOTP}>
                  Verify Phone →
                </button>
              </div>
              <div className="order-summary-mini">
                <span>{cart.length} item{cart.length > 1 ? "s" : ""}</span>
                <strong>₹{total.toFixed(2)}</strong>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: OTP Verification ── */}
        {step === "otp" && (
          <>
            <h2>Verify Phone 📱</h2>
            <p className="details-subtitle">
              We'll send a 6-digit OTP to <strong>+91 {customer.phone}</strong>
            </p>

            <div className="otp-section">
              {!otpSent ? (
                /* Send OTP button */
                <button
                  className="place-order-btn"
                  onClick={handleSendOTP}
                  disabled={otpSending}
                >
                  {otpSending ? "Sending OTP..." : "Send OTP →"}
                </button>
              ) : (
                /* OTP input + verify */
                <>
                  <div className="otp-sent-msg">
                    ✅ OTP sent to +91 {customer.phone}
                  </div>

                  <div className="customer-field">
                    <label>Enter 6-digit OTP</label>
                    <input
                      type="number"
                      className="otp-input"
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => {
                        if (e.target.value.length <= 6) setOtp(e.target.value);
                      }}
                      maxLength={6}
                      autoFocus
                    />
                  </div>

                  <button
                    className="place-order-btn"
                    onClick={handleVerifyOTP}
                    disabled={otpVerifying || otp.length !== 6}
                  >
                    {otpVerifying ? "Verifying..." : "Verify & Continue →"}
                  </button>

                  {/* Resend with cooldown */}
                  <button
                    className="otp-resend-btn"
                    onClick={() => { setOtpSent(false); setOtp(""); handleSendOTP(); }}
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0
                      ? `Resend OTP in ${resendCooldown}s`
                      : "Resend OTP"}
                  </button>
                </>
              )}

              {otpError && <p className="order-error" style={{ marginTop: "10px" }}>{otpError}</p>}
            </div>

            <div className="details-actions" style={{ marginTop: "16px" }}>
              <button className="back-btn" onClick={() => setStep("details")}>← Back</button>
            </div>

            <div className="order-summary-mini" style={{ marginTop: "12px" }}>
              <span>{cart.length} item{cart.length > 1 ? "s" : ""}</span>
              <strong>₹{total.toFixed(2)}</strong>
            </div>
          </>
        )}

        {/* ── STEP 4: Payment Method ── */}
        {step === "payment" && (
          <>
            <h2>Choose Payment 💳</h2>
            <p className="details-subtitle">Phone verified ✅ — select how you'd like to pay.</p>
            <div className="payment-methods">
              <div
                className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("cod")}
                role="button" tabIndex="0"
                onKeyDown={(e) => e.key === "Enter" && setPaymentMethod("cod")}
              >
                <div className="payment-icon">💵</div>
                <div className="payment-info">
                  <h3>Cash on Delivery</h3>
                  <p>Pay when your order arrives</p>
                </div>
                <div className={`payment-radio ${paymentMethod === "cod" ? "checked" : ""}`} />
              </div>
              <div
                className={`payment-option ${paymentMethod === "razorpay" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("razorpay")}
                role="button" tabIndex="0"
                onKeyDown={(e) => e.key === "Enter" && setPaymentMethod("razorpay")}
              >
                <div className="payment-icon">🔒</div>
                <div className="payment-info">
                  <h3>Pay Online (Razorpay)</h3>
                  <p>Card, UPI, Wallet — secure payment</p>
                </div>
                <div className={`payment-radio ${paymentMethod === "razorpay" ? "checked" : ""}`} />
              </div>
            </div>
            {orderError && <p className="order-error">{orderError}</p>}
            <div className="payment-actions">
              <button className="back-btn" onClick={() => setStep("otp")}>← Back</button>
              {paymentMethod === "cod" ? (
                <button className="place-order-btn cod-btn" onClick={handlePaymentSubmit} disabled={ordering}>
                  {ordering ? "Placing Order..." : "Place Order (COD)"}
                </button>
              ) : (
                <button className="place-order-btn razorpay-btn" onClick={handlePaymentSubmit}
                  disabled={ordering || !paymentMethod}>
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

        {/* ── STEP 5: Success ── */}
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
