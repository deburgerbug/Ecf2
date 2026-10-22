function QuantityControl({ value, max, onChange, label = "Quantity" }) {
  const limit = Number.isFinite(max) && max > 0 ? max : 99;

  return (
    <div className="qty" role="group" aria-label={label}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= limit}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

export default QuantityControl;
