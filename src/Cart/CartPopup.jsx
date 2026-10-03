import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase.js";
import { API_URL } from "../config.js";
import "./CartPopup.css";

const EMPTY_CUSTOMER = { name: "", phone: "", address: "" };
const SAVED_CUSTOMER_KEY = "gw_checkout_customer";

// Progress shown at the top of the popup
const STEPS = [
  { id: "cart",    label: "Cart" },
  { id: "details", label: "Delivery" },
  { id: "otp",     label: "Verify" },
  { id: "payment", label: "Payment" },
];

const TITLES = {
  cart:    "Your Cart 🛒",
  details: "Delivery Details 📦",
  otp:     "Verify Phone 📱",
  payment: "Choose Payment 💳",
};

// ── Saved details (this device only) ─────────────────────────────────────────
const loadSavedCustomer = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_CUSTOMER_KEY));
    if (saved && typeof saved === "object") {
      return {
        name:    String(saved.name    || ""),
        phone:   String(saved.phone   || "").replace(/\D/g, "").slice(0, 10),
        address: String(saved.address || ""),
      };
    }
  } catch { /* corrupted / unavailable storage — start empty */ }
  return EMPTY_CUSTOMER;
};

// ── Per-field validation → error message ("" = valid) ────────────────────────
const validateField = (field, value) => {
  const v = (value || "").trim();
  if (field === "name") {
    if (!v)          return "Please enter your name.";
    if (v.length < 2) return "That name looks too short.";
  }
  if (field === "phone") {
    if (!v)                    return "Please enter your phone number.";
    if (!/^\d{10}$/.test(v))   return "Enter a valid 10-digit mobile number.";
  }
  if (field === "address") {
    if (!v)           return "Please enter your delivery address.";
    if (v.length < 10) return "Please add more detail — house no., street, village/city and PIN.";
  }
  return "";
};

const CartPopup = ({ cart, onClose, onRemoveFromCart, onOrderPlaced, onUpdateQty }) => {
  const [step, setStep] = useState("cart");

  // Returning customers get their details pre-filled
  const [initialSaved]  = useState(loadSavedCustomer);
  const hasSavedDetails = Boolean(initialSaved.name || initialSaved.phone || initialSaved.address);
  const [customer, setCustomer] = useState(initialSaved);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors]     = useState({});
  const formRef = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [ordering, setOrdering]     = useState(false);
  const [orderError, setOrderError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  // OTP state
  const [otp, setOtp]                   = useState("");
  const [otpSending, setOtpSending]     = useState(false);
  const [otpSent, setOtpSent]           = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError]         = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const recaptchaRef = useRef(null);
  const otpInputRef  = useRef(null);

  const total = cart.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.qty) || 1);
  }, 0);
  const itemCount = cart.reduce((n, item) => n + (Number(item.qty) || 1), 0);
  const itemsLabel = `${itemCount} item${itemCount === 1 ? "" : "s"}`;

  // Firebase keeps the phone user signed in after a successful OTP, so if the
  // number typed in is the one already verified on this device we can skip
  // the OTP step entirely.
  const phoneVerified =
    customer.phone.length === 10 &&
    auth.currentUser?.phoneNumber === `+91${customer.phone}`;

  // Esc / tapping the dimmed backdrop only closes the popup where nothing
  // would be lost (cart review + success screen), never mid-checkout.
  const canDismiss = (step === "cart" || step === "success") && !ordering;

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
        try { recaptchaRef.current.clear(); } catch { /* already cleared */ }
        recaptchaRef.current = null;
      }
    };
  }, []);

  // ── Lock background page scroll while the cart is open (matters on phones) ─
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Escape key ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && canDismiss) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canDismiss, onClose]);

  // ── Re-focus the OTP box after a failed verification (it is disabled while
  //    verifying, which drops focus) so the user can retype immediately ──────
  useEffect(() => {
    if (step === "otp" && otpSent && !otpVerifying) otpInputRef.current?.focus();
  }, [step, otpSent, otpVerifying]);

  // ── Form handlers ──────────────────────────────────────────────────────────
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    // phone: digits only, max 10
    const next = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setCustomer((c) => ({ ...c, [name]: next }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    setErrors((er) => ({ ...er, [name]: validateField(name, value) }));
  };

  const validateAll = () => {
    const next = {
      name:    validateField("name",    customer.name),
      phone:   validateField("phone",   customer.phone),
      address: validateField("address", customer.address),
    };
    setErrors(next);
    const firstBad = Object.keys(next).find((k) => next[k]);
    if (firstBad) {
      formRef.current?.querySelector(`[name="${firstBad}"]`)?.focus();
      return false;
    }
    return true;
  };

  const persistCustomer = () => {
    try {
      if (remember) {
        localStorage.setItem(SAVED_CUSTOMER_KEY, JSON.stringify({
          name:    customer.name.trim(),
          phone:   customer.phone.trim(),
          address: customer.address.trim(),
        }));
      } else {
        localStorage.removeItem(SAVED_CUSTOMER_KEY);
      }
    } catch { /* storage unavailable — not critical */ }
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
        try { recaptchaRef.current.clear(); } catch { /* already cleared */ }
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
  // `code` is passed explicitly so it can auto-run the moment the 6th digit
  // is typed (state would still be one keystroke behind at that point).
  const handleVerifyOTP = async (code = otp) => {
    if (otpVerifying) return;
    if (!code || code.length !== 6) {
      setOtpError("Enter the 6-digit OTP sent to your phone.");
      return;
    }
    if (!confirmationResult) {
      setOtpError("Please request a new OTP.");
      return;
    }
    setOtpVerifying(true);
    setOtpError("");

    try {
      await confirmationResult.confirm(code);
      // OTP verified ✅ — move to payment step
      setStep("payment");
    } catch (err) {
      console.error("OTP verify error:", err);
      if (err.code === "auth/invalid-verification-code") {
        setOtpError("Incorrect OTP. Please check and try again.");
        setOtp("");                      // clear so they can retype straight away
      } else if (err.code === "auth/code-expired") {
        setOtpError("OTP has expired. Please request a new one.");
        setOtp("");
        setOtpSent(false);
      } else {
        setOtpError("Verification failed. Please try again.");
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleOtpChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    if (otpError) setOtpError("");
    if (digits.length === 6) handleVerifyOTP(digits);   // auto-verify
  };

  const handleResendOTP = () => {
    setOtp("");
    handleSendOTP();
  };

  // ── Details → (OTP) → Payment ──────────────────────────────────────────────
  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    persistCustomer();

    // Already verified this number on this device → skip OTP completely
    if (phoneVerified) {
      setStep("payment");
      return;
    }

    setOtp("");
    setOtpError("");
    setOtpSent(false);
    setConfirmationResult(null);
    setStep("otp");
    handleSendOTP();                     // send straight away — no extra click
  };

  // ── Order finished (shared by COD + Razorpay) ──────────────────────────────
  const finishOrder = (order, method) => {
    setPlacedOrder({
      ref:    order?._id ? String(order._id).slice(-6).toUpperCase() : null,
      method,
      total,
      address: customer.address.trim(),
      items:  cart.map((i) => ({
        title: i.title,
        qty:   Number(i.qty)   || 1,
        price: Number(i.price) || 0,
      })),
    });
    setStep("success");
    onOrderPlaced();
  };

  // ── COD order ──────────────────────────────────────────────────────────────
  const handleCODOrder = async () => {
    setOrdering(true);
    setOrderError("");
    try {
      const res = await axios.post(`${API_URL}/api/orders`, {
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
      finishOrder(res.data?.order, "cod");
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
            const verifyRes = await axios.post(`${API_URL}/api/razorpay/verify-payment`, {
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
            finishOrder(verifyRes.data?.order, "razorpay");
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
    if (ordering) return;
    if (!paymentMethod) { setOrderError("Please select a payment method."); return; }
    if (paymentMethod === "cod")      handleCODOrder();
    if (paymentMethod === "razorpay") handleRazorpayPayment();
  };

  // ── Small reusable pieces ──────────────────────────────────────────────────
  const stepIndex   = STEPS.findIndex((s) => s.id === step);
  const showStepper = step !== "success" && cart.length > 0;

  const renderStepper = () => (
    <ol className="checkout-steps" aria-label="Checkout progress">
      {STEPS.map((s, i) => {
        const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
        // Only Cart / Delivery can be jumped back to — OTP is a one-way step
        const canGo = state === "done" && (s.id === "cart" || s.id === "details") && !ordering;
        const dot = <span className="step-dot">{state === "done" ? "✓" : i + 1}</span>;
        return (
          <li
            key={s.id}
            className={`checkout-step ${state}`}
            aria-current={state === "active" ? "step" : undefined}
          >
            {canGo ? (
              <button type="button" className="step-inner" onClick={() => setStep(s.id)}>
                {dot}<span className="step-label">{s.label}</span>
              </button>
            ) : (
              <span className="step-inner">
                {dot}<span className="step-label">{s.label}</span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );

  const renderRecap = () => (
    <div className="delivery-recap">
      <div className="delivery-recap-text">
        <strong>{customer.name.trim()} · +91 {customer.phone}</strong>
        <span>{customer.address.trim()}</span>
      </div>
      <button type="button" className="link-btn" onClick={() => setStep("details")}>Edit</button>
    </div>
  );

  const renderMini = () => (
    <div className="order-summary-mini">
      <span>{itemsLabel}</span>
      <strong>₹{total.toFixed(2)}</strong>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="cart-modal"
      onClick={(e) => { if (e.target === e.currentTarget && canDismiss) onClose(); }}
    >
      <div className="cart-modal-content" role="dialog" aria-modal="true" aria-label="Checkout">
        <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>

        {/* ── Hidden reCAPTCHA anchor — required by Firebase, invisible to user ── */}
        <div id="otp-recaptcha" style={{ display: "none" }} />

        {step !== "success" && <h2>{TITLES[step]}</h2>}
        {showStepper && renderStepper()}

        {/* ── STEP 1: Cart ── */}
        {step === "cart" && (
          <>
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
                        <div className="cart-item-actions">
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
                          <button
                            type="button"
                            className="cart-remove-btn"
                            onClick={() => onRemoveFromCart(item._id)}
                          >
                            Remove
                          </button>
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
                    Total ({itemsLabel}): <strong>₹{total.toFixed(2)}</strong>
                  </div>
                  <button className="place-order-btn" onClick={() => setStep("details")}>
                    Continue to delivery →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── STEP 2: Delivery details ── */}
        {step === "details" && (
          <>
            <p className="details-subtitle">
              {hasSavedDetails
                ? "Welcome back! We've filled in your saved details — check them and continue."
                : "Tell us where to deliver your order."}
            </p>

            <form className="customer-form" onSubmit={handleDetailsSubmit} noValidate ref={formRef}>
              <div className={`customer-field ${errors.name ? "has-error" : ""}`}>
                <label htmlFor="co-name">Full name</label>
                <input
                  id="co-name" name="name" placeholder="e.g. Ramesh Patil"
                  value={customer.name}
                  onChange={handleCustomerChange} onBlur={handleFieldBlur}
                  autoComplete="name" autoFocus={!customer.name}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className={`customer-field ${errors.phone ? "has-error" : ""}`}>
                <label htmlFor="co-phone">
                  Mobile number
                  {phoneVerified && <span className="verified-chip">✓ Verified</span>}
                </label>
                <div className="phone-input">
                  <span className="phone-prefix">+91</span>
                  <input
                    id="co-phone" name="phone" type="tel" inputMode="numeric"
                    placeholder="10-digit mobile number" maxLength={10}
                    value={customer.phone}
                    onChange={handleCustomerChange} onBlur={handleFieldBlur}
                    autoComplete="tel-national"
                    aria-invalid={Boolean(errors.phone)}
                  />
                </div>
                {errors.phone ? (
                  <span className="field-error">{errors.phone}</span>
                ) : (
                  <span className="field-hint">
                    {phoneVerified
                      ? "This number is already verified on this device."
                      : "We'll send a one-time code to verify this number."}
                  </span>
                )}
              </div>

              <div className={`customer-field ${errors.address ? "has-error" : ""}`}>
                <label htmlFor="co-address">Delivery address</label>
                <textarea
                  id="co-address" name="address"
                  placeholder="House no., Street, Village/City, PIN code"
                  value={customer.address}
                  onChange={handleCustomerChange} onBlur={handleFieldBlur}
                  rows={3} autoComplete="street-address"
                  aria-invalid={Boolean(errors.address)}
                />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </div>

              <label className="remember-row">
                <input
                  type="checkbox" checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Save these details on this device for next time
              </label>

              <div className="details-actions">
                <button type="button" className="back-btn" onClick={() => setStep("cart")}>← Back</button>
                <button type="submit" className="place-order-btn">
                  {phoneVerified ? "Continue to payment →" : "Verify phone number →"}
                </button>
              </div>
              {renderMini()}
            </form>
          </>
        )}

        {/* ── STEP 3: OTP verification ── */}
        {step === "otp" && (
          <>
            <p className="details-subtitle">
              {otpSent
                ? <>Enter the 6-digit code sent to <strong>+91 {customer.phone}</strong></>
                : <>We're sending a 6-digit code to <strong>+91 {customer.phone}</strong></>}
            </p>

            <div className="otp-section">
              {otpSending && (
                <div className="otp-status"><span className="spinner" /> Sending OTP…</div>
              )}

              {otpSent && (
                <>
                  <div className="customer-field">
                    <label htmlFor="co-otp">One-time code</label>
                    <input
                      id="co-otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"   /* lets phones auto-fill the SMS code */
                      className="otp-input"
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={handleOtpChange}
                      maxLength={6}
                      autoFocus
                      ref={otpInputRef}
                      disabled={otpVerifying}
                    />
                  </div>

                  <button
                    className="place-order-btn"
                    onClick={() => handleVerifyOTP()}
                    disabled={otpVerifying || otp.length !== 6}
                  >
                    {otpVerifying ? "Verifying…" : "Verify & continue →"}
                  </button>

                  <button
                    type="button"
                    className="otp-resend-btn"
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0 || otpSending}
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                </>
              )}

              {/* Sending failed / code expired → let them retry */}
              {!otpSent && !otpSending && (
                <button className="place-order-btn" onClick={handleSendOTP}>
                  Send OTP →
                </button>
              )}

              {otpError && <p className="order-error">{otpError}</p>}
            </div>

            <div className="details-actions" style={{ marginTop: "16px" }}>
              <button type="button" className="back-btn" onClick={() => setStep("details")}>
                ← Change number
              </button>
            </div>
            {renderMini()}
          </>
        )}

        {/* ── STEP 4: Payment method ── */}
        {step === "payment" && (
          <>
            <p className="details-subtitle">Phone verified ✅ — select how you'd like to pay.</p>

            {renderRecap()}

            <div className="payment-methods">
              <div
                className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}
                onClick={() => { setPaymentMethod("cod"); setOrderError(""); }}
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
                onClick={() => { setPaymentMethod("razorpay"); setOrderError(""); }}
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
              <button type="button" className="back-btn" onClick={() => setStep("details")}>← Back</button>
              <button
                className={`place-order-btn ${paymentMethod === "cod" ? "cod-btn" : "razorpay-btn"}`}
                onClick={handlePaymentSubmit}
                disabled={ordering || !paymentMethod}
              >
                {ordering
                  ? (paymentMethod === "cod" ? "Placing order…" : "Opening payment…")
                  : !paymentMethod
                    ? "Select a payment method"
                    : paymentMethod === "cod"
                      ? `Place order · ₹${total.toFixed(2)}`
                      : `Pay securely · ₹${total.toFixed(2)}`}
              </button>
            </div>

            {paymentMethod === "razorpay" && (
              <p className="secure-note">🔒 Payments are processed securely by Razorpay.</p>
            )}

            {renderMini()}
          </>
        )}

        {/* ── STEP 5: Success ── */}
        {step === "success" && (
          <div className="order-success">
            <div className="order-success-icon">✅</div>
            <h3>Order placed!</h3>
            <p>Thank you, <strong>{customer.name.trim()}</strong>!</p>
            {placedOrder?.ref && <p className="order-ref">Order #{placedOrder.ref}</p>}

            {placedOrder && (
              <div className="success-card">
                {placedOrder.items.map((it, i) => (
                  <div className="success-line" key={`${it.title}-${i}`}>
                    <span>{it.title} × {it.qty}</span>
                    <span>₹{(it.price * it.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="success-line success-total">
                  <span>{placedOrder.method === "razorpay" ? "Paid" : "To pay on delivery"}</span>
                  <span>₹{placedOrder.total.toFixed(2)}</span>
                </div>
                <div className="success-address">📍 {placedOrder.address}</div>
              </div>
            )}

            <p className="success-sub">
              {placedOrder?.method === "razorpay"
                ? "💳 Payment confirmed. Your order is confirmed."
                : "💵 We'll contact you soon. Pay when order arrives."}
            </p>
            <button className="close-after-order-btn" onClick={onClose}>Continue shopping</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPopup;
