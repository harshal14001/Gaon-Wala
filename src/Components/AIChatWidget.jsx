// src/Components/AIChatWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import { API_URL } from '../config.js';
import './AIChatWidget.css';

import amicoImage   from "../icons/chat-bot-amico.png";
import farmerAvatar from "../icons/hello-chat-bot.webm";

const AIChatWidget = ({ cart = [], onAddToCart, onUpdateQty }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'ai', text: "Namaste! 🙏 I am your GaonWala Assistant. How can I help you shop today?", products: [] }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [messages, isOpen]);

    // ── Cart helpers ───────────────────────────────────────────────────────
    const getCartQty = (productId) => {
        const item = cart.find((x) => x._id === productId);
        return item ? item.qty : 0;
    };

    const handleIncrement = (product) => {
        const qty = getCartQty(product._id);
        if (qty === 0) {
            onAddToCart && onAddToCart(product);
        } else if (qty < (product.stock ?? Infinity)) {
            onUpdateQty && onUpdateQty(product._id, qty + 1);
        }
    };

    const handleDecrement = (product) => {
        const qty = getCartQty(product._id);
        if (qty > 0) onUpdateQty && onUpdateQty(product._id, qty - 1);
    };

    // ── AI send ────────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMsg = { type: 'user', text: input, products: [] };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg.text })
            });

            const data = await response.json();

            if (!response.ok) {
                // 503, 500, any error status — show friendly message
                setMessages(prev => [...prev, {
                    type: 'ai',
                    text: "⏳ Something went wrong on our end. Please try again in a moment!",
                    products: [],
                    isError: true,
                }]);
                return;
            }

            if (data.success) {
                setMessages(prev => [...prev, {
                    type: 'ai',
                    text: data.responseMessage,
                    products: data.productsToDisplay || []
                }]);
            } else {
                setMessages(prev => [...prev, {
                    type: 'ai',
                    text: "Sorry, I couldn't process that. Please try again.",
                    products: [],
                    isError: true,
                }]);
            }
        } catch {
            setMessages(prev => [...prev, {
                type: 'ai',
                text: "⚠️ Could not reach the server. Please check your connection.",
                products: [],
                isError: true,
            }]);
        } finally {
            setLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="ai-widget-container">

            {/* Desktop Trigger */}
            {!isOpen && (
                <div className="ai-desktop-trigger" onClick={() => setIsOpen(true)}>
                    <div className="ai-trigger-text">
                        Questioned what to shop?
                        <span>Ask our AI</span>
                    </div>
                    <div className="ai-trigger-img-container">
                        <img src={amicoImage} alt="AI Assistant" className="ai-trigger-img" />
                    </div>
                </div>
            )}

            {/* Mobile Trigger */}
            {!isOpen && (
                <div className="ai-mobile-container" onClick={() => setIsOpen(true)}>
                    <div className="ai-mobile-text">
                        Questioned what to shop? <br />
                        <span>Ask our AI</span>
                    </div>
                    <button className="ai-mobile-trigger">
                        <video src={farmerAvatar} autoPlay loop muted playsInline
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <video src={farmerAvatar} autoPlay loop muted playsInline
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            <h3>GaonWala AI Assistant</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                    </div>

                    <div className="ai-messages">
                        {messages.map((msg, index) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                <div className={`message ${msg.type} ${msg.isError ? 'message-error' : ''}`}>
                                    {msg.text}
                                </div>

                                {msg.products?.length > 0 && (
                                    <div className="ai-product-list">
                                        {msg.products.map(product => {
                                            const qty        = getCartQty(product._id);
                                            const inCart     = qty > 0;
                                            const atMax      = qty >= (product.stock ?? Infinity);
                                            const outOfStock = (product.stock ?? 1) === 0;

                                            return (
                                                <div key={product._id} className="ai-product-card">
                                                    <img src={product.image} alt={product.title} className="ai-product-img" />
                                                    <div className="ai-product-info">
                                                        <h4>{product.title}</h4>
                                                        <p>₹{product.price}</p>
                                                    </div>

                                                    {outOfStock ? (
                                                        <span className="ai-out-badge">Out of Stock</span>
                                                    ) : !inCart ? (
                                                        <button className="ai-add-btn" onClick={() => handleIncrement(product)}>
                                                            Add +
                                                        </button>
                                                    ) : (
                                                        <div className="ai-stepper">
                                                            <button className="ai-stepper-btn" onClick={() => handleDecrement(product)}>−</button>
                                                            <span className="ai-stepper-qty">{qty}</span>
                                                            <button
                                                                className={`ai-stepper-btn ${atMax ? "ai-stepper-max" : ""}`}
                                                                onClick={() => handleIncrement(product)}
                                                                disabled={atMax}
                                                                title={atMax ? `Max ${product.stock} available` : ""}
                                                            >+</button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-input-area">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask regarding products..."
                            disabled={loading}
                        />
                        <button onClick={handleSend} disabled={loading}>➤</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatWidget;
