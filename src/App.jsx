
import { useState } from 'react';
import Banner from './Banner/Banner';
import Icons from './Icons/Icons';
import Products from './Products/Products';
import Scroll from './Top_Scroll/Scroll';
import CartPopup from './Cart/CartPopup';

const App = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); 

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  return (
    <>
      <Scroll />
      <Banner
        cart={cart}
        onCartClick={() => setShowCart(true)}
        onSearch={setSearchQuery} // Pass search setter
      />
      <Icons onCategorySelect={setSelectedCategory} />
      <Products
        selectedCategory={selectedCategory}
        searchQuery={searchQuery} //  Pass query
        cart={cart}
        setCart={setCart}
      />
      {showCart && (
        <CartPopup
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemoveFromCart={handleRemoveFromCart}
        />
      )}
    </>
  );
};

export default App;
