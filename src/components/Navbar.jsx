import { NavLink, Link } from "react-router-dom";
import { useStore } from "../store/useStore";

function Navbar() {
  const { cartCount, wishlist } = useStore();

  return (
    <header className="site-header">
      <Link className="site-brand" to="/">
        Shop
      </Link>
      <nav aria-label="Main navigation">
        <NavLink to="/" end>
          Products
        </NavLink>
        <NavLink to="/wishlist">
          <span aria-hidden="true">♥</span> Wishlist
          {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
        </NavLink>
        <NavLink to="/cart">
          Cart
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </NavLink>
        <NavLink to="/orders">Orders</NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
