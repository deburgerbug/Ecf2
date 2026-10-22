import Carousel from "./Carousel";

/**
 * Category cards in a carousel. Clicking a card selects that category;
 * clicking the active card again (or "All") clears the filter.
 */
function CategoryCarousel({ categories, total, active, onSelect }) {
  return (
    <Carousel label="Product categories" className="categories">
      <button
        type="button"
        className={`cat-card${active === "all" ? " active" : ""}`}
        aria-pressed={active === "all"}
        onClick={() => onSelect("all")}
      >
        <span className="cat-icon" aria-hidden="true">
          ▦
        </span>
        <span>
          <strong>All</strong>
          <small>{total} items</small>
        </span>
      </button>

      {categories.map((category) => (
        <button
          key={category.slug}
          type="button"
          className={`cat-card${active === category.slug ? " active" : ""}`}
          aria-pressed={active === category.slug}
          onClick={() => onSelect(category.slug)}
        >
          <img src={category.image} alt="" loading="lazy" />
          <span>
            <strong>{category.name}</strong>
            <small>{category.count} items</small>
          </span>
        </button>
      ))}
    </Carousel>
  );
}

export default CategoryCarousel;
