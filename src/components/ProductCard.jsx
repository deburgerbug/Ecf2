import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { formatCategory, formatPrice } from "../utils/format";
import WishlistButton from "./WishlistButton";

function ProductCard({ product }) {
  const { cart, addToCart } = useStore();
  const inCart = cart.find((item) => item.id === product.id);
  const outOfStock = product.stock === 0;

  return (
    <article className="product-card">
      <Link className="product-card-link" to={`/products/${product.id}`}>
        <img src={product.thumbnail} alt={product.title} loading="lazy" />
        <div className="product-card-content">
          <span className="product-category">
            {formatCategory(product.category)}
          </span>
          <h2>{product.title}</h2>
        </div>
      </Link>

      {inCart && <span className="card-pill">{inCart.qty} in cart</span>}
      <WishlistButton product={product} />

      <div className="product-card-foot">
        <span className="product-price">{formatPrice(product.price)}</span>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={outOfStock}
          onClick={() => addToCart(product)}
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
