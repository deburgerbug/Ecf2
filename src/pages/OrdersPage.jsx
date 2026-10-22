import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { formatDate, formatPrice } from "../utils/format";

function OrdersPage() {
  const { orders, clearOrders } = useStore();

  if (orders.length === 0) {
    return (
      <section className="empty-state">
        <h1>No orders yet</h1>
        <p className="muted">Placed orders will appear here.</p>
        <Link className="btn btn-primary" to="/">
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="toolbar">
        <h1>Order history</h1>
        <button type="button" className="btn btn-link" onClick={clearOrders}>
          Clear history
        </button>
      </div>

      <ul className="order-list">
        {orders.map((order) => (
          <li key={order.id} className="order">
            <header className="order-head">
              <div>
                <strong>{order.id}</strong>
                <span className="muted"> · {formatDate(order.createdAt)}</span>
              </div>
              <span className="status">{order.status}</span>
            </header>

            <ul className="order-items">
              {order.items.map((item) => (
                <li key={item.id}>
                  <img src={item.thumbnail} alt={item.title} />
                  <Link to={`/products/${item.id}`}>{item.title}</Link>
                  <span className="muted">
                    {item.qty} × {formatPrice(item.price)}
                  </span>
                  <span>{formatPrice(item.price * item.qty)}</span>
                </li>
              ))}
            </ul>

            <footer className="order-foot">
              <span className="muted">Paid via {order.paymentMethod}</span>
              <strong>Total {formatPrice(order.total)}</strong>
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default OrdersPage;
