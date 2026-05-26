import twilio from "twilio";

let client = null;

const getClient = () => {
  if (!client) {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      console.warn("⚠️  Twilio credentials not set — notifications disabled.");
      return null;
    }
    client = twilio(sid, token);
  }
  return client;
};

// Accepts: "9876543210" / "09876543210" / "+919876543210"
// Returns: "+919876543210"
const toE164 = (phone) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
};

const buildMessage = (type, customer, order) => {
  const itemList = order.items.map((i) => `  • ${i.title} × ${i.qty}`).join("\n");

  if (type === "cod") return (
    `✅ *Order Placed — GaonWala* 🌾\n\n` +
    `Namaste ${customer.name}! Your order has been placed successfully.\n\n` +
    `📦 *Items:*\n${itemList}\n\n` +
    `💰 *Total:* ₹${order.total.toFixed(2)}\n` +
    `🚚 *Payment:* Cash on Delivery\n` +
    `📍 *Deliver to:* ${customer.address}\n\n` +
    `We'll contact you soon to confirm delivery. Thank you! 🙏`
  );

  if (type === "razorpay") return (
    `✅ *Payment Confirmed — GaonWala* 🌾\n\n` +
    `Namaste ${customer.name}! Your payment was successful.\n\n` +
    `📦 *Items:*\n${itemList}\n\n` +
    `💰 *Total Paid:* ₹${order.total.toFixed(2)}\n` +
    `💳 *Payment:* Online (Razorpay)\n` +
    `📍 *Deliver to:* ${customer.address}\n\n` +
    `Your order is confirmed. We'll deliver soon! 🙏`
  );

  if (type === "status_update") {
    const emoji = { Confirmed: "✅", Delivered: "🎉", Cancelled: "❌", Pending: "⏳" }[order.status] || "📦";
    return (
      `${emoji} *Order Update — GaonWala*\n\n` +
      `Namaste ${customer.name}!\n` +
      `Your order status: *${order.status}*\n\n` +
      `💰 Total: ₹${order.total.toFixed(2)}\n` +
      `Thank you for shopping with GaonWala! 🌾`
    );
  }
};

const sendWhatsApp = async (toPhone, message) => {
  const tw = getClient();
  if (!tw) return;

  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  await tw.messages.create({
    from,
    to:   `whatsapp:${toE164(toPhone)}`,
    body: message,
  });

  console.log(`📱 WhatsApp sent to ${toPhone}`);
};

const sendSMS = async (toPhone, message) => {
  const tw = getClient();
  if (!tw) return;

  const from = process.env.TWILIO_SMS_FROM;
  if (!from) {
    console.warn("⚠️  TWILIO_SMS_FROM not set — SMS skipped.");
    return;
  }

  const plainText = message.replace(/\*/g, "");

  await tw.messages.create({
    from,
    to:   toE164(toPhone),
    body: plainText,
  });

  console.log(`📨 SMS sent to ${toPhone}`);
};

// Fire-and-forget — notification failure never blocks order creation
export const sendOrderNotification = async (type, customer, order) => {
  try {
    const message = buildMessage(type, customer, order);
    if (!message) return;

    await Promise.allSettled([
      sendWhatsApp(customer.phone, message),
      sendSMS(customer.phone, message),
    ]);

  } catch (err) {
    console.error("❌ Notification error (non-fatal):", err.message);
  }
};
