import { Link, useParams } from "react-router-dom";
import { useStore } from "../store/useStore";
import { formatPrice } from "../utils/format";

function OrderSuccessPage() {
  const { id } = useParams();
  const { orders } = useStore();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <section className="empty-state">
        <h1>Order not found</h1>
        <Link className="btn btn-primary" to="/orders">
          View order history
        </Link>
      </section>
    );
  }

  return (
    <section className="empty-state">
      <div className="success-mark" aria-hidden="true">
        ✓
      </div>
      <h1>Order placed</h1>
      <p>
        Order <strong>{order.id}</strong> · {formatPrice(order.total)} ·{" "}
        {order.paymentMethod}
      </p>
      <div className="row-gap">
        <Link className="btn btn-primary" to="/orders">
          View order history
        </Link>
        <Link className="btn btn-secondary" to="/">
          Continue shopping
        </Link>
      </div>
    </section>
  );
}

export default OrderSuccessPage;
