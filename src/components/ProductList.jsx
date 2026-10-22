import ProductCard from "./ProductCard";

function ProductList({ products }) {
  if (products.length === 0) {
    return <p className="empty-results">No products match your search.</p>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductList;
