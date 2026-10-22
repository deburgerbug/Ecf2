import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Generic horizontal carousel: native scroll + scroll-snap, with prev/next
 * buttons that disable at the edges. Children are the slides/cards.
 */
function Carousel({ children, label, className = "" }) {
  const trackRef = useRef(null);
  const innerRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const start = el.scrollLeft <= 1;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setEdges((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end },
    );
  }, []);

  // Recompute edges when the viewport or the content width changes.
  useEffect(() => {
    const observer = new ResizeObserver(update);
    if (trackRef.current) observer.observe(trackRef.current);
    if (innerRef.current) observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, [update]);

  function scrollByPage(direction) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div
      className={`carousel ${className}`.trim()}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <button
        type="button"
        className="carousel-btn prev"
        aria-label="Scroll left"
        disabled={edges.start}
        onClick={() => scrollByPage(-1)}
      >
        ‹
      </button>
      <div className="carousel-track" ref={trackRef} onScroll={update}>
        <div className="carousel-inner" ref={innerRef}>
          {children}
        </div>
      </div>
      <button
        type="button"
        className="carousel-btn next"
        aria-label="Scroll right"
        disabled={edges.end}
        onClick={() => scrollByPage(1)}
      >
        ›
      </button>
    </div>
  );
}

export default Carousel;
