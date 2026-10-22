import { useCallback, useEffect, useMemo, useState } from "react";
import { StoreContext } from "./StoreContext";
import { loadJSON, saveJSON } from "../utils/storage";

const CART_KEY = "shop.cart.v1";
const ORDERS_KEY = "shop.orders.v1";
const WISHLIST_KEY = "shop.wishlist.v1";

function clampQty(qty, stock) {
  const max = Number.isFinite(stock) && stock > 0 ? stock : 99;
  return Math.max(1, Math.min(qty, max));
}

// Subset of a product kept in cart and wishlist (snapshot).
function toSnapshot(product) {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    thumbnail: product.thumbnail,
    category: product.category,
    stock: product.stock,
    rating: product.rating,
  };
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => loadJSON(CART_KEY, []));
  const [orders, setOrders] = useState(() => loadJSON(ORDERS_KEY, []));
  const [wishlist, setWishlist] = useState(() => loadJSON(WISHLIST_KEY, []));

  useEffect(() => saveJSON(CART_KEY, cart), [cart]);
  useEffect(() => saveJSON(ORDERS_KEY, orders), [orders]);
  useEffect(() => saveJSON(WISHLIST_KEY, wishlist), [wishlist]);

  /* ---------- cart ---------- */
  const addToCart = useCallback((product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: clampQty(item.qty + qty, item.stock) }
            : item,
        );
      }
      return [
        ...prev,
        { ...toSnapshot(product), qty: clampQty(qty, product.stock) },
      ];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const setQuantity = useCallback((id, qty) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: clampQty(qty, item.stock) } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  /* ---------- wishlist ---------- */
  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) =>
      prev.some((item) => item.id === product.id)
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, toSnapshot(product)],
    );
  }, []);

  const clearWishlist = useCallback(() => setWishlist([]), []);

  /* ---------- orders ---------- */
  const placeOrder = useCallback(
    ({ paymentMethod }) => {
      if (cart.length === 0) return null;
      const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
      const order = {
        id: `ORD-${Date.now().toString(36).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        items: cart,
        total,
        paymentMethod,
        status: "Confirmed",
      };
      setOrders((prev) => [order, ...prev]);
      setCart([]);
      return order;
    },
    [cart],
  );

  const clearOrders = useCallback(() => setOrders([]), []);

  /* ---------- derived ---------- */
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart],
  );
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart],
  );
  const wishlistIds = useMemo(
    () => new Set(wishlist.map((item) => item.id)),
    [wishlist],
  );

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      cartTotal,
      orders,
      wishlist,
      wishlistIds,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
      toggleWishlist,
      clearWishlist,
      placeOrder,
      clearOrders,
    }),
    [
      cart,
      cartCount,
      cartTotal,
      orders,
      wishlist,
      wishlistIds,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
      toggleWishlist,
      clearWishlist,
      placeOrder,
      clearOrders,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
