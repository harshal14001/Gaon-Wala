// previous hardcode products data in array

// import "./Products.css";
// const allProducts = [
//   { id: 1, title: "Mango", price: "₹99", image: "", category: "Fruits" },
//   { id: 2, title: "Onion", price: "₹49", image: "", category: "Vegetable" },
//   { id: 3, title: "Organic Ghee", price: "₹349", image: "", category: "Milk Products" },
//   { id: 4, title: "Mango Plant", price: "₹399", image: "", category: "Plants" },
//   { id: 5, title: "Soyabean Seeds", price: "₹45", image: "", category: "Seeds" },
//   { id: 6, title: "Jamun Plant", price: "₹399", image: "", category: "Plants" },
//   { id: 7, title: "Chickoo Plant", price: "₹399", image: "", category: "Plants" },
//   { id: 8, title: "Corn", price: "₹99", image: "", category: "Seeds" },
//   { id: 9, title: "Maize", price: "₹99", image: "", category: "Seeds" },
//   { id: 10, title: "Wheat", price: "₹99", image: "", category: "Seeds" },
//   { id: 11, title: "Jowar", price: "₹99", image: "", category: "Seeds" },
//   { id: 12, title: "Lemon", price: "₹99", image: "", category: "Vegetables" },
//   { id: 13, title: "Jamun Plant", price: "₹99", image: "", category: "Plants" },


// ];

// const Products = ({ selectedCategory, searchQuery, cart, setCart }) => {
//   const filteredProducts = allProducts
//     .filter((product) =>
//       selectedCategory === "all" ? true : product.category === selectedCategory
//     )
//     .filter((product) =>
//       product.title.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//   const isInCart = (productId) => cart.some((item) => item.id === productId);

//   const handleAddToCart = (product) => {
//     if (!isInCart(product.id)) {
//       setCart((prevCart) => [...prevCart, product]);
//     }
//   };

//   const handleRemoveFromCart = (productId) => {
//     setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
//   };

//   return (
//     <div className="product-grid">
//       {filteredProducts.map((product) => {
//         const inCart = isInCart(product.id);
//         return (
//           <div className="product-card" key={product.id}>
//             <img src={product.image} alt={product.title} className="product-image" />
//             <h3 className="product-title">{product.title}</h3>
//             <p className="product-price">{product.price}</p>

//             <div className="cart-buttons">
//               {!inCart ? (
//                 <button className="add-to-cart-btn" onClick={() => handleAddToCart(product)}>
//                   Add to Cart
//                 </button>
//               ) : (
//                 <>
//                   <button className="in-cart-btn" disabled>In Cart</button>
//                   <button className="remove-btn" onClick={() => handleRemoveFromCart(product.id)}>
//                     Remove
//                   </button>
//                 </>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default Products;


// new with mongo 

import { useEffect, useState } from 'react';
import axios from 'axios';
import "./Products.css";

const Products = ({ selectedCategory, searchQuery, cart, setCart }) => {
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products");
        setAllProducts(res.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = allProducts
    .filter((product) =>
      selectedCategory === "all"
        ? true
        : product.category.toLowerCase() === selectedCategory.toLowerCase()
    )
  
    .filter((product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const isInCart = (productId) => cart.some((item) => item._id === productId);

  const handleAddToCart = (product) => {
    if (!isInCart(product._id)) {
      setCart((prevCart) => [...prevCart, product]);
    }
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
  };

  return (
    <div className="product-grid">
      {filteredProducts.length === 0 ? (
        <p className="no-products-message">No products available to display.</p>
      ) : (
        filteredProducts.map((product) => {
          const inCart = isInCart(product._id);
          return (
            <div className="product-card" key={product._id}>
              <img
                src={product.image || "/placeholder.png"}
                alt={product.title}
                className="product-image"
              />
              <h3 className="product-title">{product.title}</h3>
              <p className="product-price">₹{product.price}</p>

              <div className="cart-buttons">
                {!inCart ? (
                  <button className="add-to-cart-btn" onClick={() => handleAddToCart(product)}>
                    Add to Cart
                  </button>
                ) : (
                  <>
                    <button className="in-cart-btn" disabled>In Cart</button>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveFromCart(product._id)}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Products;
