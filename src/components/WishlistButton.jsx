import { useStore } from "../store/useStore";

/**
 * Heart toggle. variant "overlay" = round icon button on a card image;
 * variant "inline" = labelled button (details page).
 */
function WishlistButton({ product, variant = "overlay" }) {
  const { wishlistIds, toggleWishlist } = useStore();
  const active = wishlistIds.has(product.id);

  return (
    <button
      type="button"
      className={
        variant === "inline"
          ? `btn btn-secondary btn-sm wish-inline${active ? " active" : ""}`
          : `wish-btn${active ? " active" : ""}`
      }
      aria-pressed={active}
      aria-label={
        active
          ? `Remove ${product.title} from wishlist`
          : `Add ${product.title} to wishlist`
      }
      onClick={() => toggleWishlist(product)}
    >
      <span aria-hidden="true">{active ? "♥" : "♡"}</span>
      {variant === "inline" && (active ? " In wishlist" : " Add to wishlist")}
    </button>
  );
}

export default WishlistButton;
