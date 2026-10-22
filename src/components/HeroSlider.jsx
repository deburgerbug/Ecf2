import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatCategory, formatPrice } from "../utils/format";

/**
 * Auto-advancing banner slider (one slide visible at a time).
 * Pauses on hover/focus; auto-play is disabled for reduced-motion users.
 */
function HeroSlider({ slides, interval = 5000 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  // `index` is a dependency so a manual change restarts the timer.
  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(timer);
  }, [paused, count, interval, index]);

  if (count === 0) return null;

  const go = (next) => setIndex((next + count) % count);

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured products"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="hero-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
        aria-live={paused ? "polite" : "off"}
      >
        {slides.map((product, i) => (
          <article
            key={product.id}
            className="hero-slide"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={i !== index}
          >
            <div className="hero-text">
              <span className="product-category">
                Top rated · {formatCategory(product.category)}
              </span>
              <h2>{product.title}</h2>
              <p className="hero-meta">
                <strong>{formatPrice(product.price)}</strong>
                <span className="muted"> · ★ {product.rating}</span>
              </p>
              <Link
                className="btn btn-primary btn-sm"
                to={`/products/${product.id}`}
                tabIndex={i === index ? 0 : -1}
              >
                Shop now
              </Link>
            </div>
            <img src={product.thumbnail} alt={product.title} />
          </article>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className="carousel-btn prev"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-btn next"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
          >
            ›
          </button>
          <div className="hero-dots">
            {slides.map((product, i) => (
              <button
                key={product.id}
                type="button"
                className={i === index ? "active" : ""}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default HeroSlider;
