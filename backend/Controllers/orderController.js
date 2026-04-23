import Order from "../Models/Order.js";
import Product from "../Models/Products.js";

// POST /api/orders  — public, called by customer from cart (CASH ON DELIVERY only)
export const placeOrder = async (req, res) => {
  try {
    const { customer, items, total } = req.body;

    if (!customer?.name || !customer?.phone || !customer?.address) {
      return res.status(400).json({ message: "Customer name, phone and address are required" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // ── Stock validation — check all items before touching DB ──────────────
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product "${item.title}" not found.` });
      }
      if (product.stock < item.qty) {
        return res.status(400).json({
          message: `Sorry, only ${product.stock} unit(s) of "${product.title}" are left in stock.`,
        });
      }
    }

    // ── Deduct stock atomically for each item ──────────────────────────────
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.qty },
      });
    }

    // ── Create the order (COD — no payment verification needed) ───────────
    const order = await Order.create({
      customer,
      items,
      total,
      paymentMethod: "cash_on_delivery",
      paymentStatus: "pending",
      status: "Pending",
    });

    res.status(201).json({ message: "Order placed successfully! COD selected.", order });

  } catch (err) {
    console.error("Place order error:", err);
    res.status(500).json({ message: "Failed to place order" });
  }
};

// GET /api/orders  — protected, admin only
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// PATCH /api/orders/:id/status  — protected, admin only
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};
