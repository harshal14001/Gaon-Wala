// backend/utils/notificationService.js
//
// Sends WhatsApp + SMS order notifications via Twilio.
//
// SETUP (one-time):
//   1. Sign up at https://www.twilio.com (free trial)
//   2. Get Account SID + Auth Token from Twilio Console
//   3. For WhatsApp: Go to Messaging → Try WhatsApp → note your sandbox number + join code
//      Customer must text "join <code>" to +14155238886 ONCE to receive sandbox messages
//   4. For SMS: Your Twilio trial number is the from number
//   5. Add credentials to backend/.env (see .env.example)
//
// PRODUCTION UPGRADE:
//   - WhatsApp: Apply for WhatsApp Business API (Meta approval, 3-7 days)
//   - SMS: Upgrade Twilio account, get a dedicated Indian number (DLT registration needed)

import twilio from "twilio";

// Twilio client — initialised lazily so missing credentials don't crash the server
let client = null;

const getClient = () => {
  if (!client) {
    const sid    = process.env.TWILIO_ACCOUNT_SID;
    const token  = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
      console.warn("⚠️  Twilio credentials not set — notifications disabled.");
      return null;
    }
    client = twilio(sid, token);
  }
  return client;
};

// ── Format Indian phone → E.164 ─────────────────────────────────────────────
// Accepts: "9876543210" or "09876543210" or "+919876543210"
// Returns: "+919876543210"
const toE164 = (phone) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
};

// ── Build message text ───────────────────────────────────────────────────────
const buildMessage = (type, customer, order) => {
  const itemList = order.items
    .map((i) => `  • ${i.title} × ${i.qty}`)
    .join("\n");

  if (type === "cod") {
    return (
      `✅ *Order Placed — GaonWala* 🌾\n\n` +
      `Namaste ${customer.name}! Your order has been placed successfully.\n\n` +
      `📦 *Items:*\n${itemList}\n\n` +
      `💰 *Total:* ₹${order.total.toFixed(2)}\n` +
      `🚚 *Payment:* Cash on Delivery\n` +
      `📍 *Deliver to:* ${customer.address}\n\n` +
      `We'll contact you soon to confirm delivery. Thank you! 🙏`
    );
  }

  if (type === "razorpay") {
    return (
      `✅ *Payment Confirmed — GaonWala* 🌾\n\n` +
      `Namaste ${customer.name}! Your payment was successful.\n\n` +
      `📦 *Items:*\n${itemList}\n\n` +
      `💰 *Total Paid:* ₹${order.total.toFixed(2)}\n` +
      `💳 *Payment:* Online (Razorpay)\n` +
      `📍 *Deliver to:* ${customer.address}\n\n` +
      `Your order is confirmed. We'll deliver soon! 🙏`
    );
  }

  if (type === "status_update") {
    const emoji = {
      Confirmed:  "✅",
      Delivered:  "🎉",
      Cancelled:  "❌",
      Pending:    "⏳",
    }[order.status] || "📦";

    return (
      `${emoji} *Order Update — GaonWala*\n\n` +
      `Namaste ${customer.name}!\n` +
      `Your order status has been updated to: *${order.status}*\n\n` +
      `💰 Total: ₹${order.total.toFixed(2)}\n` +
      `Thank you for shopping with GaonWala! 🌾`
    );
  }
};

// ── Send WhatsApp message ────────────────────────────────────────────────────
const sendWhatsApp = async (toPhone, message) => {
  const twilio = getClient();
  if (!twilio) return;

  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886"; // Twilio sandbox default

  await twilio.messages.create({
    from,
    to:   `whatsapp:${toE164(toPhone)}`,
    body: message,
  });

  console.log(`📱 WhatsApp sent to ${toPhone}`);
};

// ── Send SMS ─────────────────────────────────────────────────────────────────
const sendSMS = async (toPhone, message) => {
  const twilio = getClient();
  if (!twilio) return;

  const from = process.env.TWILIO_SMS_FROM;
  if (!from) {
    console.warn("⚠️  TWILIO_SMS_FROM not set — SMS skipped.");
    return;
  }

  // Strip markdown bold (*text*) for plain SMS
  const plainText = message.replace(/\*/g, "");

  await twilio.messages.create({
    from,
    to:   toE164(toPhone),
    body: plainText,
  });

  console.log(`📨 SMS sent to ${toPhone}`);
};

// ── Main exported function ───────────────────────────────────────────────────
// type: "cod" | "razorpay" | "status_update"
// IMPORTANT: always fire-and-forget — never await this in controllers
// so a Twilio failure never blocks order creation
export const sendOrderNotification = async (type, customer, order) => {
  try {
    const message = buildMessage(type, customer, order);
    if (!message) return;

    // Send both in parallel — WhatsApp + SMS
    await Promise.allSettled([
      sendWhatsApp(customer.phone, message),
      sendSMS(customer.phone, message),
    ]);

  } catch (err) {
    // Log but never throw — notification failure must not break the order flow
    console.error("❌ Notification error (non-fatal):", err.message);
  }
};
