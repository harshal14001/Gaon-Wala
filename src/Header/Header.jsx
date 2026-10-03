// src/Header/Header.jsx
// Groups the announcement bar (Scroll) + search/logo/cart bar (Banner)
// into one sticky unit that hides on scroll-down and reappears on
// scroll-up.
//
// Why this can't leave a gap or make the page jump:
//  - The header stays in normal document flow (position: sticky), so the
//    page height NEVER changes when it hides/shows — no spacer, no reflow.
//  - It is only allowed to hide once the user has scrolled PAST the
//    header's own height. By then the header's original slot has already
//    scrolled out of view, so sliding it away just reveals content that
//    was sitting behind it. Hiding earlier is what caused the blank patch.
//  - The threshold is the header's live measured height (not a magic
//    number), because it differs across screen sizes.
import { useLayoutEffect, useRef, useState } from "react";
import Scroll from "../Top_Scroll/Scroll";
import Banner from "../Banner/Banner";
import useScrollDirection from "../hooks/useScrollDirection";
import "./Header.css";

const Header = ({ cart, onCartClick, onSearch, onAdminClick }) => {
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const update = () => setHeaderHeight(el.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const direction = useScrollDirection({ topOffset: headerHeight });

  return (
    <div
      ref={headerRef}
      className={`site-header ${direction === "down" ? "site-header--hidden" : ""}`}
    >
      <Scroll />
      <Banner
        cart={cart}
        onCartClick={onCartClick}
        onSearch={onSearch}
        onAdminClick={onAdminClick}
      />
    </div>
  );
};

export default Header;
