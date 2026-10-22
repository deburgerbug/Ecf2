import { Link } from "react-router-dom";
import ProductList from "../components/ProductList";
import { useStore } from "../store/useStore";

function WishlistPage() {
  const { wishlist, clearWishlist } = useStore();

  if (wishlist.length === 0) {
    return (
      <section className="empty-state">
        <h1>Your wishlist is empty</h1>
        <p className="muted">Tap the heart on any product to save it here.</p>
        <Link className="btn btn-primary" to="/">
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="toolbar">
        <h1>
          Wishlist <span className="muted count">({wishlist.length})</span>
        </h1>
        <button type="button" className="btn btn-link" onClick={clearWishlist}>
          Clear wishlist
        </button>
      </div>
      <ProductList products={wishlist} />
    </section>
  );
}

export default WishlistPage;
