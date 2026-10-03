// src/hooks/useScrollDirection.js
import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether the page is being scrolled "up" or "down".
 * Used to auto-hide a sticky header on scroll-down and bring it
 * back on scroll-up — same behaviour on every screen size.
 *
 * - threshold: ignores tiny jitters/trackpad noise below this many px
 * - topOffset: always reports "up" near the very top, so the header
 *              never gets stuck hidden when there's nothing above it
 */
const useScrollDirection = ({ threshold = 8, topOffset = 60 } = {}) => {
  const [direction, setDirection] = useState("up");
  const lastScrollY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateDirection = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= topOffset) {
        setDirection("up");
        lastScrollY.current = currentScrollY;
        ticking.current = false;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 ? "down" : "up");
        lastScrollY.current = currentScrollY;
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, topOffset]);

  return direction;
};

export default useScrollDirection;
