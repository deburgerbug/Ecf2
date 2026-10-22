import { Link, useNavigate } from "react-router-dom";
import QuantityControl from "../components/QuantityControl";
import { useStore } from "../store/useStore";
import { formatPrice } from "../utils/format";

function CartPage() {
  const { cart, cartTotal, cartCount, setQuantity, removeFromCart, clearCart } =
    useStore();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <section className="empty-state">
        <h1>Your cart is empty</h1>
        <p className="muted">Add products to see them here.</p>
        <Link className="btn btn-primary" to="/">
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="toolbar">
        <h1>Cart</h1>
        <button type="button" className="btn btn-link" onClick={clearCart}>
          Clear cart
        </button>
      </div>

      <div className="cart-layout">
        <ul className="cart-list">
          {cart.map((item) => (
            <li key={item.id} className="cart-item">
              <Link to={`/products/${item.id}`}>
                <img src={item.thumbnail} alt={item.title} />
              </Link>
              <div className="cart-item-info">
                <Link to={`/products/${item.id}`} className="cart-item-title">
                  {item.title}
                </Link>
                <span className="muted">{formatPrice(item.price)} each</span>
                <QuantityControl
                  value={item.qty}
                  max={item.stock}
                  label={`Quantity for ${item.title}`}
                  onChange={(qty) => setQuantity(item.id, qty)}
                />
              </div>
              <div className="cart-item-side">
                <strong>{formatPrice(item.price * item.qty)}</strong>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove from cart
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="summary">
          <h2>Summary</h2>
          <div className="summary-row">
            <span>Items</span>
            <span>{cartCount}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => navigate("/checkout")}
          >
            Proceed to checkout
          </button>
        </aside>
      </div>
    </section>
  );
}

export default CartPage;
