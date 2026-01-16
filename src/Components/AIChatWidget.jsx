// src/Components/AIChatWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import './AIChatWidget.css'; // This works because .css is in the same folder

// ✅ CORRECT IMPORTS (Use ../ to go up one level to 'src', then into 'icons')
import amicoImage from "../icons/chat-bot-amico.png";
import farmerAvatar from "../icons/hello-chat-bot.webm";

const AIChatWidget = ({ onAddToCart }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'ai', text: "Namaste! I am your GaonWala Assistant. How can I help you shop today?", products: [] }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { type: 'user', text: input, products: [] };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg.text })
            });
            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, {
                    type: 'ai',
                    text: data.responseMessage,
                    products: data.productsToDisplay || []
                }]);
            } else {
                setMessages(prev => [...prev, { type: 'ai', text: "Sorry, I couldn't find that.", products: [] }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { type: 'ai', text: "Network connection failed.", products: [] }]);
        } finally {
            setLoading(false);
        }
    };

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
                        <video
                            src={farmerAvatar}
                            autoPlay loop muted playsInline
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <video
                                src={farmerAvatar}
                                autoPlay loop muted playsInline
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <h3>GaonWala AI Assistant</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>×</button>
                    </div>

                    <div className="ai-messages">
                        {messages.map((msg, index) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                <div className={`message ${msg.type}`}>{msg.text}</div>
                                {msg.products?.length > 0 && (
                                    <div className="ai-product-list">
                                        {msg.products.map(product => (
                                            <div key={product._id} className="ai-product-card">
                                                <img src={product.image} alt={product.title} className="ai-product-img" />
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, fontSize: '14px' }}>{product.title}</h4>
                                                    <p style={{ margin: 0, fontSize: '12px', color: 'green' }}>₹{product.price}</p>
                                                </div>
                                                <button
                                                    className="ai-add-btn"
                                                    onClick={() => onAddToCart && onAddToCart(product)}
                                                >
                                                    Add +
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        )}                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-input-area">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask regarding products..."
                        />
                        <button onClick={handleSend}>➤</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatWidget;