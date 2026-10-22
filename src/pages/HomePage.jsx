import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryCarousel from "../components/CategoryCarousel";
import HeroSlider from "../components/HeroSlider";
import ProductList from "../components/ProductList";
import { getProducts } from "../services/productService";
import { formatCategory } from "../utils/format";

const FEATURED_COUNT = 6;

function HomePage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Selected category lives in the URL (?category=slug): shareable, Back works.
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    async function loadProducts() {
      try {
        setProducts(await getProducts());
      } catch (err) {
        setError(err.message || "Unable to load products.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  // One card per category: name, item count, cover image (first product).
  const categories = useMemo(() => {
    const bySlug = new Map();
    for (const product of products) {
      const entry = bySlug.get(product.category);
      if (entry) {
        entry.count += 1;
      } else {
        bySlug.set(product.category, {
          slug: product.category,
          name: formatCategory(product.category),
          count: 1,
          image: product.thumbnail,
        });
      }
    }
    return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const featured = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, FEATURED_COUNT),
    [products],
  );

  const requested = searchParams.get("category");
  const category = categories.some((c) => c.slug === requested)
    ? requested
    : "all";

  function selectCategory(slug) {
    const next = new URLSearchParams(searchParams);
    if (slug === "all" || slug === category) next.delete("category");
    else next.set("category", slug);
    setSearchParams(next);
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    const matchesCategory = category === "all" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  if (loading) return <p role="status">Loading products...</p>;
  if (error) return <p role="alert">Error: {error}</p>;

  const heading =
    category === "all" ? "All products" : formatCategory(category);

  return (
    <>
      <HeroSlider slides={featured} />

      <CategoryCarousel
        categories={categories}
        total={products.length}
        active={category}
        onSelect={selectCategory}
      />

      <div className="toolbar">
        <h1>
          <span className="cap">{heading}</span>{" "}
          <span className="muted count">({filteredProducts.length})</span>
        </h1>
        <label>
          <span className="visually-hidden">Search products</span>
          <input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
      </div>

      <ProductList products={filteredProducts} />
    </>
  );
}

export default HomePage;
