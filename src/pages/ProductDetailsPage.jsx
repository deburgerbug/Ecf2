import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QuantityControl from "../components/QuantityControl";
import WishlistButton from "../components/WishlistButton";
import { getProductById } from "../services/productService";
import { useStore } from "../store/useStore";
import { formatCategory, formatPrice } from "../utils/format";

function ProductDetailsPage() {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { id } = useParams();
  const { cart, addToCart } = useStore();

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setQty(1);
      try {
        const data = await getProductById(id);
        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load product");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p role="status">Loading product...</p>;
  if (error) return <p role="alert">Error: {error}</p>;
  if (!product) return <p>Product not found.</p>;

  const inCart = cart.find((item) => item.id === product.id);
  const outOfStock = product.stock === 0;

  return (
    <section className="details">
      <Link className="back-link" to="/">
        ← Back to products
      </Link>

      <div className="details-layout">
        <img
          className="details-image"
          src={product.thumbnail}
          alt={product.title}
        />

        <div className="details-info">
          <p className="product-category">{formatCategory(product.category)}</p>
          <h1>{product.title}</h1>
          {product.brand && <p className="muted">by {product.brand}</p>}
          <p className="details-price">{formatPrice(product.price)}</p>
          <p>{product.description}</p>

          <dl className="details-meta">
            <div>
              <dt>Rating</dt>
              <dd>{product.rating} / 5</dd>
            </div>
            <div>
              <dt>In stock</dt>
              <dd>{product.stock}</dd>
            </div>
            {product.availabilityStatus && (
              <div>
                <dt>Availability</dt>
                <dd>{product.availabilityStatus}</dd>
              </div>
            )}
            {product.shippingInformation && (
              <div>
                <dt>Shipping</dt>
                <dd>{product.shippingInformation}</dd>
              </div>
            )}
            {product.warrantyInformation && (
              <div>
                <dt>Warranty</dt>
                <dd>{product.warrantyInformation}</dd>
              </div>
            )}
            {product.returnPolicy && (
              <div>
                <dt>Returns</dt>
                <dd>{product.returnPolicy}</dd>
              </div>
            )}
          </dl>

          <div className="details-actions">
            <QuantityControl value={qty} max={product.stock} onChange={setQty} />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={outOfStock}
              onClick={() => addToCart(product, qty)}
            >
              {outOfStock ? "Out of stock" : "Add to cart"}
            </button>
            <WishlistButton product={product} variant="inline" />
            {inCart && (
              <Link className="btn btn-secondary btn-sm" to="/cart">
                View cart ({inCart.qty})
              </Link>
            )}
          </div>
        </div>
      </div>

      {product.reviews?.length > 0 && (
        <div className="reviews">
          <h2>Reviews</h2>
          <ul>
            {product.reviews.map((review) => (
              <li key={`${review.reviewerEmail}-${review.date}`}>
                <strong>{review.reviewerName}</strong>
                <span className="muted"> · {review.rating}/5</span>
                <p>{review.comment}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default ProductDetailsPage;
