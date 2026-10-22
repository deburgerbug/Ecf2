const API_URL = "https://dummyjson.com/products";

// Slim list payload: only the fields cards, carousels and the cart need.
const LIST_FIELDS = "id,title,price,thumbnail,category,stock,rating";

export async function getProducts() {
  const response = await fetch(`${API_URL}?limit=0&select=${LIST_FIELDS}`);

  if (!response.ok) {
    throw new Error("Failed to fetch products.");
  }
  const data = await response.json();
  return data.products;
}

export async function getProductById(id) {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch product.");
  }
  return response.json();
}
