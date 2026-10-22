import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { formatPrice } from "../utils/format";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", hint: "Pay using any UPI app" },
  { id: "card", label: "Credit / Debit card", hint: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net banking", hint: "All major banks" },
  { id: "cod", label: "Cash on delivery", hint: "Pay when the order arrives" },
];

function CheckoutPage() {
  const { cart, cartTotal, placeOrder } = useStore();
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id);
  const [placed, setPlaced] = useState(false);
  const navigate = useNavigate();

  // Empty-cart guard. `placed` prevents it from firing when placeOrder()
  // empties the cart and would otherwise redirect to /cart instead of the
  // success page.
  if (placed) return null;
  if (cart.length === 0) return <Navigate to="/cart" replace />;

  function handlePlaceOrder() {
    const selected = PAYMENT_METHODS.find((m) => m.id === method);
    const order = placeOrder({ paymentMethod: selected.label });
    if (order) setPlaced(true);
    if (order) navigate(`/order-success/${order.id}`, { replace: true });
  }

  return (
    <section>
      <Link className="back-link" to="/cart">
        ← Back to cart
      </Link>
      <h1>Checkout</h1>

      <div className="cart-layout">
        <div>
          <fieldset className="payment">
            <legend>Payment method</legend>
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m.id}
                className={`payment-option${method === m.id ? " selected" : ""}`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={m.id}
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                />
                <span>
                  <strong>{m.label}</strong>
                  <span className="muted">{m.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="muted note">
            Demo checkout: no payment gateway is connected. Placing the order
            succeeds immediately.
          </p>
        </div>

        <aside className="summary">
          <h2>Order summary</h2>
          <ul className="summary-items">
            {cart.map((item) => (
              <li key={item.id} className="summary-row">
                <span>
                  {item.title} × {item.qty}
                </span>
                <span>{formatPrice(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handlePlaceOrder}
          >
            Place order
          </button>
        </aside>
      </div>
    </section>
  );
}

export default CheckoutPage;
