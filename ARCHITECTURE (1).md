# E-Commerce Frontend: Architecture, Process, Data Flow, Trade-offs

Scope: frontend only. No backend, no auth, no payment gateway. Product data comes from the public DummyJSON API. Cart, wishlist and order history live in browser localStorage.

Revision 2 added: wishlist, hero slider, reusable carousel, category cards (carousel) with category filtering, compact UI. Sections marked (R2) describe these. One checkout bug from revision 1 was found and fixed (section 14).

Stack: React 19, react-router-dom 7, Vite 8, plain CSS, ESLint (react-hooks + react-refresh rules). No state library, no CSS framework, no TypeScript.

---

## 1. Requirements as understood

1. Products page: list, search by title, filter by category.
2. Product details page: full information for one product.
3. Add to cart from card and from details page.
4. Cart page: change quantity, remove item, see total.
5. Proceed to checkout: show payment methods; clicking Place order always succeeds.
6. Orders / History page: list of placed orders.
7. (R2) Wishlist: heart toggle on cards and details page, wishlist link with count in the navbar, wishlist page.
8. (R2) Slider component: auto-advancing featured banner.
9. (R2) Category cards in a carousel; clicking a card shows only that category's products.
10. (R2) Compact UI that uses the available width.

Explicit non-goals: Add/Edit/Delete product (removed from the earlier version), real payments, user accounts, server persistence.

---

## 2. How the work was approached (process)

Step 1. Read the existing repo before writing anything. Findings:
- Home page, product card, details page, product service already worked against DummyJSON.
- `OrdersPage` was a placeholder. `Navbar.jsx` and `ProductList.jsx` were stubs/empty.
- `main.jsx` had the `App.css` import commented out, so styles were not loading.
- `ProductCard` wrapped everything in a `<Link>`, which makes an Add to cart button inside it invalid HTML.
- `.env` held `API_URL` but Vite only exposes `VITE_`-prefixed variables to client code, so it was never used.

Step 2. Decide what to keep. The router layout, the service module, the filtering logic in `HomePage` were sound. They were kept and extended, not rewritten.

Step 3. Model the domain: what is a CartItem, what is an Order, what must be snapshotted (section 5).

Step 4. Classify state by who owns it (section 7). This decided where each piece of data lives.

Step 5. Build bottom-up so every layer compiles and can be reasoned about alone: utils, then store, then components, then pages, then routes, then CSS.

Step 6. Verify with `npm run build` and `npm run lint`. Runtime behavior against live DummyJSON was not exercised in the build environment (network restricted), so manual click-through testing on your machine is still required.

---

## 3. Directory structure

```
@latest/
  index.html                 Vite entry HTML, mounts #root
  vite.config.js             React plugin only
  package.json               scripts: dev, build, lint, preview
  src/
    main.jsx                 React root, StrictMode, loads CSS
    App.jsx                  Provider + Router + route table + layout
    index.css                global base: font, box-sizing, body background
    App.css                  all component/page styles
    services/
      productService.js      network: getProducts (slim, all items), getProductById
    store/
      StoreContext.js        createContext only
      StoreProvider.jsx      all cart + wishlist + order state and actions
      useStore.js            hook that reads the context
    utils/
      format.js              formatPrice, formatCategory, formatDate
      storage.js             loadJSON, saveJSON (safe localStorage)
    components/              reusable, props-driven UI
      Navbar.jsx
      ProductCard.jsx
      ProductList.jsx
      QuantityControl.jsx
      Carousel.jsx           (R2) generic scroll-snap carousel with arrow buttons
      HeroSlider.jsx         (R2) auto-advancing one-slide-at-a-time banner
      CategoryCarousel.jsx   (R2) category cards rendered inside Carousel
      WishlistButton.jsx     (R2) heart toggle, overlay or inline variant
    pages/                   one per route, owns data loading
      HomePage.jsx
      ProductDetailsPage.jsx
      CartPage.jsx
      CheckoutPage.jsx
      OrderSuccessPage.jsx
      OrdersPage.jsx
      WishlistPage.jsx       (R2)
```

Unrelated or unused: `fileModule/` (Node fs experiment), `.env` and the `dotenv` dependency (unused), `src/data/products.json` (unused, uses string ids like "p1" that would conflict with DummyJSON numeric ids), `some.md` (reference card).

---

## 4. Routes

| Path | Component | Purpose | Guard |
|---|---|---|---|
| `/` | HomePage | hero slider, category carousel, product grid, search. Optional `?category=<slug>` | invalid slug falls back to all |
| `/home` | redirect to `/` | legacy alias | none |
| `/products/:id` | ProductDetailsPage | full product info, add to cart | none |
| `/wishlist` | WishlistPage | saved products (R2) | empty state if none |
| `/cart` | CartPage | edit cart, proceed | shows empty state if cart empty |
| `/checkout` | CheckoutPage | payment method, place order | redirects to `/cart` if cart empty |
| `/order-success/:id` | OrderSuccessPage | confirmation | shows "not found" if id not in orders |
| `/orders` | OrdersPage | order history | shows empty state if none |
| `*` | redirect to `/` | unknown URLs | none |

All routes render inside `AppLayout` (Navbar + `<main><Outlet/></main>`), so the navbar never remounts on navigation.

---

## 5. Domain model

Product (from DummyJSON, read-only). Fields used: `id, title, price, category, description, thumbnail, rating, stock, brand, availabilityStatus, shippingInformation, warrantyInformation, returnPolicy, reviews[]`.

CartItem (stored in cart state, a snapshot subset of Product plus quantity):

```
{ id, title, price, thumbnail, category, stock, rating, qty }
```

WishlistItem (R2): the same snapshot without `qty`: `{ id, title, price, thumbnail, category, stock, rating }`. Cart and wishlist share one `toSnapshot(product)` function in the store, so a wishlist item can be passed straight to `addToCart`.

Order (stored in orders state):

```
{
  id:            "ORD-<base36 timestamp>",
  createdAt:     ISO string,
  items:         CartItem[]   (copied at placement time),
  total:         number       (computed at placement time),
  paymentMethod: "UPI" | "Credit / Debit card" | "Net banking" | "Cash on delivery",
  status:        "Confirmed"
}
```

Why snapshot instead of storing only product ids: an order is a historical record. If a price changes later, past orders must not change. Same reason the order stores its own `total` instead of recomputing it from current prices.

---

## 6. File-by-file detail

### 6.1 `src/main.jsx`
Creates the React root, wraps in `StrictMode`, imports `index.css` then `App.css`, renders `<App/>`. Change from original: `App.css` import was commented out; now active.

### 6.2 `src/App.jsx`
Composition root. Order of nesting matters:

```
<StoreProvider>        state available to everything below
  <BrowserRouter>      URL state available to everything below
    <Routes>
      <Route element={<AppLayout/>}>   shared shell
        ...page routes...
```

`StoreProvider` is outside the router because the store does not need router hooks. Either order works; provider-outside keeps the store alive for the app lifetime.

`AppLayout` renders `Navbar` and `<main>` containing `<Outlet/>`, where the matched page appears.

### 6.3 `src/services/productService.js`
Pure network layer. Two async functions:
- `getProducts()`: `GET https://dummyjson.com/products?limit=0&select=id,title,price,thumbnail,category,stock,rating`, returns `data.products` (array). `limit=0` returns every product (about 194), `select` trims each item to the fields cards, carousels and the cart need. (R2: was `limit=30` with full objects.)
- `getProductById(id)`: `GET https://dummyjson.com/products/:id`, returns the product object.
Both throw `Error` on non-2xx so pages can catch and show a message. No React imports. Swapping to a real backend later means editing only this file (and the base URL).

### 6.4 `src/utils/format.js`
Pure functions, no state.
- `formatPrice(n)`: `Intl.NumberFormat` USD.
- `formatCategory(c)`: replaces `-` with space (CSS capitalizes it).
- `formatDate(iso)`: locale date and time.

### 6.5 `src/utils/storage.js`
- `loadJSON(key, fallback)`: reads and parses; returns fallback on missing key, bad JSON, or storage access errors (private mode, disabled storage).
- `saveJSON(key, value)`: stringifies and writes; silently ignores failures (quota, disabled). App then works in memory only.

### 6.6 `src/store/StoreContext.js`
Exports only the context object (`createContext(null)`). Separated into its own file because the `react-refresh/only-export-components` lint rule forbids files that export both components and non-components. Keeping context, provider, and hook in three files satisfies Fast Refresh.

### 6.7 `src/store/useStore.js`
`useContext(StoreContext)`, throws a clear error if used outside the provider. Every component reads the store through this hook only.

### 6.8 `src/store/StoreProvider.jsx`
The only file with business logic. Contents:

State:
- `cart` (CartItem[]), initialized lazily from localStorage key `shop.cart.v1`.
- `orders` (Order[]), initialized lazily from `shop.orders.v1`.
- `wishlist` (WishlistItem[]), initialized lazily from `shop.wishlist.v1`. (R2)

Helper `clampQty(qty, stock)`: forces quantity into `[1, stock]`; if stock is missing or 0, ceiling is 99.

Actions (all wrapped in `useCallback`, all use functional `setState` so they do not capture stale state, except `placeOrder`):
- `addToCart(product, qty=1)`: if the id exists, increases qty (clamped); otherwise appends a new CartItem snapshot.
- `removeFromCart(id)`: filters the item out.
- `setQuantity(id, qty)`: sets qty (clamped).
- `clearCart()`.
- `placeOrder({paymentMethod})`: returns null if cart empty. Otherwise computes total from the current cart, builds the Order with a snapshot of items, prepends it to `orders` (newest first), empties the cart, returns the order so the caller can navigate to its id.
- `clearOrders()`.
- `toggleWishlist(product)` (R2): removes the item if present, otherwise appends a snapshot.
- `clearWishlist()` (R2).

Derived values (`useMemo`): `cartCount` (sum of qty), `cartTotal` (sum of price x qty), `wishlistIds` (a `Set` of ids, R2, for O(1) "is wishlisted" checks in every card). Not stored in state.

Persistence: three `useEffect`s write `cart`, `orders` and `wishlist` to localStorage whenever they change.

Context value is memoized and exposes: `cart, cartCount, cartTotal, orders, wishlist, wishlistIds, addToCart, removeFromCart, setQuantity, clearCart, toggleWishlist, clearWishlist, placeOrder, clearOrders`.

### 6.9 `src/components/Navbar.jsx`
Reads `cartCount` and `wishlist`. Renders brand link and four `NavLink`s (Products with `end` so it is only active on exactly `/`, Wishlist with a count badge (R2), Cart with a count badge, Orders). `NavLink` adds the `active` class used by CSS.

### 6.10 `src/components/ProductCard.jsx`
Props: `product`. Reads `cart` and `addToCart`. Structure:

```
<article>                                    position: relative
  <Link>  image + category + title  </Link>    navigates to details
  <span "n in cart">                           overlay pill, top-left (R2)
  <WishlistButton/>                            overlay heart, top-right (R2)
  <div>   price + <button Add to cart/>  </div> does NOT navigate
</article>
```

The button and the heart are siblings of the link, not children, so clicking them never triggers navigation and the HTML is valid. (R2: price moved to the footer row beside the button, "In cart" became an overlay pill, title clamps to two lines. All to save vertical space.) Disabled with "Out of stock" label when `stock === 0`.

### 6.11 `src/components/ProductList.jsx`
Props: `products`. Renders the grid or the "No products match" message. Exists so `HomePage` handles data and filters while this handles presentation.

### 6.12 `src/components/QuantityControl.jsx`
Controlled component: props `value, max, onChange, label`. Minus disabled at 1, plus disabled at `max` (or 99). Holds no state; the parent owns the number. Used in both CartPage (value comes from the store) and ProductDetailsPage (value is local state).

### 6.13 `src/pages/HomePage.jsx`
Local state: `products, searchTerm, loading, error`. Selected category is URL state via `useSearchParams` (`?category=slug`). (R2)
- `useEffect` on mount calls `getProducts()`, sets products or error, then clears loading.
- `categories` via `useMemo` (R2): one entry per category `{slug, name, count, image}`; count and cover image come from the loaded products; sorted by name.
- `featured` via `useMemo` (R2): top 6 by rating, a sorted copy (the original array is not mutated).
- `category`: the URL value if it matches a known slug, otherwise `"all"`.
- `selectCategory(slug)`: sets or deletes the `category` param; selecting the active card or "All" clears it. Other params are preserved by cloning `URLSearchParams`.
- `filteredProducts`: computed every render from products + searchTerm + category (case-insensitive title substring AND category match).
- Renders loading, error, or `<HeroSlider/>` + `<CategoryCarousel/>` + toolbar (heading with count, search box) + `<ProductList/>`. The old category `<select>` was removed; the cards replace it.

### 6.14 `src/pages/ProductDetailsPage.jsx`
Reads `:id` via `useParams`. Local state: `product, error, loading, qty`.
- `useEffect([id])` fetches the product, resets `qty` to 1, and uses a `cancelled` flag set in the cleanup so a slow response from a previous id cannot overwrite the current one.
- Reads `cart` and `addToCart` from the store to show a "View cart (n)" link when the item is already in the cart.
- Optional DummyJSON fields (brand, shipping, warranty, returns, reviews) render only when present.
- Add to cart passes the chosen `qty`.
- (R2) An inline `WishlistButton` sits beside Add to cart.

### 6.15 `src/pages/CartPage.jsx`
Reads `cart, cartTotal, cartCount, setQuantity, removeFromCart, clearCart`. Empty cart shows an empty state with a link to products. Otherwise two columns: item list (thumbnail link, title link, unit price, `QuantityControl`, line total, Remove from cart) and a sticky summary with Proceed to checkout, which does `navigate("/checkout")`.

### 6.16 `src/pages/CheckoutPage.jsx`
Local state: `method` (selected payment id, default UPI). `PAYMENT_METHODS` is a module-level constant array.
- If cart is empty: `<Navigate to="/cart" replace/>` (guard, also prevents landing here after an order is placed and the user hits Back).
- Place order: finds the label for the selected method, calls `placeOrder({paymentMethod})`, sets a local `placed` flag, then `navigate("/order-success/<id>", {replace: true})`. The `placed` flag is what keeps the empty-cart guard from redirecting to `/cart` (see section 14). `replace` removes checkout from history so Back does not return to a now-empty checkout.
- No validation, no gateway call. The note on the page says so.

### 6.17 `src/pages/OrderSuccessPage.jsx`
Reads `:id`, finds the order in `orders`, shows confirmation with id, total, payment method. Works after refresh because orders persist. Unknown id shows a not-found state.

### 6.18 `src/pages/OrdersPage.jsx`
Reads `orders, clearOrders`. Empty state or a list of order cards: header (id, date, status), item rows (thumbnail, linked title, qty x unit price, line total), footer (payment method, order total). Item titles link back to `/products/:id`.

### 6.19 (R2) `src/components/Carousel.jsx`
Generic horizontal carousel. Structure: wrapper (relative) > prev button + scroll track (`overflow-x: auto`, `scroll-snap-type: x proximity`, scrollbar hidden) > inner flex row (`width: max-content`) > children (the cards) + next button.
- Scrolling is native (touch, trackpad, wheel all work). Buttons call `track.scrollBy({left: +/- 0.8 * clientWidth, behavior: "smooth"})`.
- `edges` state `{start, end}` disables the arrow at either end. It is recomputed from `scrollLeft/clientWidth/scrollWidth` on the `scroll` event and from a `ResizeObserver` watching both the track and the inner row, so it stays correct when the window resizes or the content changes width.
- `update` skips `setState` when the value is unchanged, avoiding re-renders on every scroll event.
- The component knows nothing about categories; it only lays out children. That is what makes it reusable.

### 6.20 (R2) `src/components/HeroSlider.jsx`
Banner that shows one slide at a time. Props: `slides` (products), `interval` (default 5000 ms).
- State: `index` (current slide), `paused`.
- Layout: a flex track of full-width slides moved with `transform: translateX(-index * 100%)` (CSS transition for the animation). Prev/next buttons and dots call `go(i)`, which wraps around with modulo.
- Auto-play: a `setInterval` in an effect, cleared on cleanup. `index` is a dependency so any manual change restarts the timer. Disabled when `paused`, when there is one slide, or when the user prefers reduced motion.
- Pauses on mouse enter/leave and focus/blur.
- Accessibility: `aria-roledescription="carousel"`, each slide labeled "n of N", off-screen slides `aria-hidden` and their link `tabIndex=-1`, live region is `off` while auto-playing and `polite` when paused, dots have `aria-current`.

### 6.21 (R2) `src/components/CategoryCarousel.jsx`
Props: `categories, total, active, onSelect`. Renders an "All" card (with total count) followed by one card per category (cover image, name, item count) inside `Carousel`. Cards are `<button aria-pressed>`; the active one is highlighted. It holds no state and does no filtering: it reports the click through `onSelect(slug)` and `HomePage` decides what that means.

### 6.22 (R2) `src/components/WishlistButton.jsx`
Reads `wishlistIds` and `toggleWishlist` from the store. `variant="overlay"` renders the round heart on a card image; `variant="inline"` renders a labelled button ("Add to wishlist" / "In wishlist") on the details page. Uses `aria-pressed` and a product-specific `aria-label`.

### 6.23 (R2) `src/pages/WishlistPage.jsx`
Reads `wishlist` and `clearWishlist`. Empty state or a toolbar (title, count, Clear wishlist) plus `ProductList` fed with the wishlist snapshots. Cards on this page are the same `ProductCard`, so heart toggle and Add to cart work identically.

### 6.24 CSS
- `index.css`: tokens and resets (font, `box-sizing: border-box`, body background).
- `index.css` also sets `html { font-size: 15px }`, so every `rem` value is about 6 percent smaller than the 16px default (R2, compactness).
- `App.css`: one file, grouped by sections (layout, buttons, hero slider, generic carousel, category cards, product grid/card, details, quantity, cart/checkout, empty/success, orders, misc, responsive). Plain class names, no CSS modules. Breakpoints at 800px (stack two-column layouts, un-stick summary) and 560px (tighter padding, two-column product grid, compact cart rows).

Compaction measures (R2): `main` max-width 1400px with 1rem padding; grid column minimum 165px with 0.7rem gaps; small cards with 2-line title clamp; heading, count and search share one toolbar row; category select replaced by a one-row carousel; hero capped near 9rem tall; details page uses a 20rem image column plus an info column; meta rows and reviews use multi-column grids.

---

## 7. State architecture

Four kinds of state, each with one home:

| Kind | Examples | Lives in | Why |
|---|---|---|---|
| Server state | products list, one product | page component local state | only that page needs it; fetched on mount |
| Global client state | cart, orders, wishlist | `StoreProvider` (context) | needed by navbar, cards, cart, checkout, orders |
| Local UI state | searchTerm, selectedCategory, qty on details, selected payment method | the component using it | nobody else cares; resets naturally on unmount |
| URL state | current page, product id, order id, selected category (`?category=`) | react-router | shareable, survives refresh, Back button works |

Derived (never stored): `cartCount`, `cartTotal`, `wishlistIds`, `filteredProducts`, `categories` (with counts and cover images), `featured`, per-line totals, "in cart" and "wishlisted" flags.

Why the selected category is in the URL and the search text is not: a category is a place you navigate to (Back should undo it, a link should reproduce it); search text is transient typing, and putting it in the URL would flood history with an entry per keystroke unless debounced.

Ownership rule used throughout: state lives in the lowest component that all its consumers share. Cart is read by Navbar (header) and pages (main), so the lowest common ancestor is `App`; hence the provider there.

---

## 8. Data flow diagrams

### 8.1 Overall

```
                 DummyJSON API
                      |
                productService.js
                      |
        +-------------+--------------+
        |                            |
   HomePage (state)         ProductDetailsPage (state)
        |                            |
   ProductList -> ProductCard        |
        |                            |
        +----------- addToCart ------+
                       |
                  StoreProvider  <---->  localStorage
                  (cart, orders)
                       |
     +-----------------+-----------------+----------------+
     |                 |                 |                |
  Navbar           CartPage         CheckoutPage      OrdersPage
 (badge)        (edit, remove)     (placeOrder)      (history)
```

### 8.2 Product browsing

```
mount HomePage
  -> useEffect -> getProducts() -> fetch
  -> setProducts(list), setLoading(false)
user types in search / picks category
  -> setSearchTerm / setSelectedCategory
  -> re-render -> filteredProducts recomputed -> ProductList re-renders
```
No network call on filtering; everything is client-side over the 30 loaded items.

### 8.2b (R2) Category selection

```
click category card -> CategoryCarousel.onSelect(slug)
  -> HomePage.selectCategory(slug)
       same slug as current, or "all"  -> delete ?category
       otherwise                       -> set ?category=slug
  -> setSearchParams -> URL changes -> HomePage re-renders
  -> `category` re-derived from URL (unknown slug => "all")
  -> filteredProducts recomputed -> heading, count, grid update
  -> card highlight follows `active` prop
Back button -> previous URL -> same chain in reverse
```

### 8.2c (R2) Wishlist

```
click heart -> WishlistButton -> toggleWishlist(product)
  -> setWishlist(prev => remove if present else append snapshot)
  -> wishlistIds (Set) recomputed
  -> every heart re-evaluates `wishlistIds.has(id)`; Navbar badge = wishlist.length
  -> useEffect([wishlist]) -> saveJSON("shop.wishlist.v1")
/wishlist -> ProductList over the snapshots (same ProductCard)
```

### 8.3 Add to cart (from a card)

```
click [Add to cart]
  -> ProductCard: addToCart(product)
  -> StoreProvider: setCart(prev => merge or append)
  -> React re-renders consumers of the context:
       Navbar badge (cartCount recomputed)
       ProductCard "In cart: n"
  -> useEffect([cart]) -> saveJSON("shop.cart.v1", cart)
```

### 8.4 Cart edit

```
[+]/[-]  -> QuantityControl.onChange(newQty)
         -> CartPage: setQuantity(id, newQty)
         -> clampQty -> setCart(map)
         -> cartTotal, cartCount recomputed -> summary, badge update

[Remove] -> removeFromCart(id) -> setCart(filter)
```

### 8.5 Checkout and order placement

```
/cart  [Proceed to checkout] -> navigate("/checkout")
/checkout
  guard: cart empty? -> redirect /cart
  select payment -> setMethod (local)
  [Place order] -> placeOrder({paymentMethod})
       builds Order {items snapshot, total, method, createdAt, id}
       setOrders([order, ...prev]); setCart([])
       returns order
  -> navigate("/order-success/:id", replace)
/order-success/:id
  orders.find(id) -> render confirmation
  effects persist both orders and the now-empty cart
```

### 8.6 Order history

```
/orders -> reads orders from context -> renders list (newest first)
Clear history -> clearOrders() -> setOrders([]) -> persisted
```

### 8.7 First load / refresh

```
StoreProvider mounts
  useState(() => loadJSON(key, [])) runs once (lazy initializer)
  -> cart and orders restored before first render
  -> no flash of empty cart
```

---

## 9. Key patterns and why they were chosen

1. Context + provider for cart/orders instead of prop drilling or a library. Five or more distant consumers need the same data; context is built in and enough at this size.
2. Context, provider, hook split into three files. Satisfies the Fast Refresh lint rule and keeps responsibilities single.
3. Functional `setState(prev => ...)` in actions. Always operates on the latest state, avoids stale closures, lets `addToCart`, `removeFromCart`, `setQuantity` have stable identities (empty deps).
4. Lazy `useState(() => loadJSON(...))`. Reads localStorage once, not on every render, and avoids a flash of empty state.
5. Derived values computed, not stored. One source of truth, no sync bugs.
6. Snapshot data in cart items and orders. Historical correctness.
7. `clampQty` in one place. Stock limits enforced by the store, UI disabling is only a convenience, so a bug in a component cannot break the invariant.
8. Guard routes by component logic (`Navigate`, empty states) instead of a route-guard abstraction. Simple, visible.
9. `navigate(..., {replace: true})` after placing an order. Prevents Back from returning to checkout.
10. Controlled `QuantityControl`. One component, two owners of the number (store vs local), no duplicated UI.
11. Presentational/container split (`HomePage` loads and filters, `ProductList`/`ProductCard` render). Components stay reusable and easy to read.
12. Cancel flag in the details fetch effect. Prevents stale-response overwrite when `:id` changes quickly.
13. Button placed outside the card `<Link>`. Valid HTML, correct keyboard and click behavior.
14. (R2) URL as state for the selected category. Gives Back-button and shareable-link behavior for free and removes a piece of local state.
15. (R2) One generic `Carousel`, specialized by composition (`CategoryCarousel`). The mechanism (scroll, snap, edge detection) is separate from the content (categories). A product carousel would reuse it unchanged.
16. (R2) Native scrolling with scroll-snap instead of a transform-based slider for the category row. Touch and trackpad behavior is free and accessible; JavaScript only adds arrow buttons.
17. (R2) Transform-based `HeroSlider` for the banner, because it needs exactly one visible slide, wrap-around and dots, which native scroll does not express well.
18. (R2) `Set` of ids for wishlist lookup instead of `array.some` inside every card.
19. (R2) Slim list payload with `select=` and full object only on the details page. Lists need a few fields; details need all of them.
20. (R2) Semantics and accessibility basics: `role="status"`/`role="alert"` on loading/error, `aria-label` on qty buttons, `aria-live` on the count, visually-hidden labels on search/select, real `<fieldset>/<legend>/<label>` for payment radios.

---

## 10. Trade-offs and known limitations

State management
- Single context means any change (e.g. one cart quantity) re-renders every component that calls `useStore()`, including all cards. Fine for 30 products. Fix when it matters: split into CartContext and OrdersContext, or move to `useReducer`/Zustand with selectors.
- `placeOrder` depends on `cart` via closure (deps `[cart]`), so its identity changes with the cart and so does the context value. Acceptable here. A reducer would remove the dependency.
- Business logic is imperative callbacks, not a reducer. Easier to read now; harder to test and reason about as actions multiply.

Data and persistence
- localStorage is per browser, not synced across tabs (no `storage` event listener). Two tabs can overwrite each other.
- Keys are versioned (`.v1`) but there is no migration code. Changing the shape later requires adding one.
- Cart stores a snapshot of `price` and `stock`. If prices or stock change on the server, the cart is stale. There is no revalidation at checkout.
- Order id is `Date.now()` in base36: unique enough for one browser, not globally unique. Use `crypto.randomUUID()` for something sturdier.
- Effects write to localStorage on first mount too (rewriting the value just loaded). Harmless, slightly wasteful.

Networking
- Manual fetch state (loading/error/data) is repeated in two pages. TanStack Query would remove the duplication, add caching, retries, and dedupe.
- No caching: opening the same product twice refetches. Home list refetches on every visit to `/`.
- (R2) All products (about 194, slim fields) are fetched in one request so category cards, counts and filtering are complete. Cost: a larger first payload and rendering up to 194 cards at once (images are `loading="lazy"`, but the DOM nodes exist). No pagination or virtualization. Real fix at scale: server-side `search` and `category` endpoints with pagination or infinite scroll, debounced search, list virtualization.
- (R2) Categories, counts and cover images are derived from the loaded products. This is accurate only because the whole catalog is loaded; with pagination they would need `/products/categories` or a backend aggregate.
- Product id types: DummyJSON ids are numbers; `useParams` yields strings. Works because the details page only uses the id for the URL; cart matching uses ids from product objects. Mixing in the unused `products.json` (string ids) would break matching.
- No request timeout or retry; no distinction between network error and HTTP error beyond the message.
- `HomePage` fetch has no cancel flag. It has no changing dependency so a stale-response race cannot occur; in StrictMode dev it fetches twice, which is expected.

Checkout and business rules
- Payment is a label only. No validation, no address, no tax, no shipping, no discounts, no currency handling (USD fixed).
- Double-click protection on Place order is not implemented; practical risk is low because the page unmounts via navigation, but it is not guarded.
- Destructive actions (Clear cart, Clear history) have no confirmation.
- Order status is always "Confirmed"; there is no lifecycle.

UI and routing
- `BrowserRouter` requires a server-side fallback to `index.html` when deployed (Netlify/Vercel rewrite, nginx try_files). Otherwise refreshing `/cart` returns 404.
- Single global CSS file with plain class names. Simple, but collisions and dead CSS become a risk as it grows. Options: CSS Modules, Tailwind, or co-located styles.
- No scroll restoration or focus management on route change; no skip link; no keyboard trap checks. Accessibility is baseline, not audited.
- No tests. Pure functions (`clampQty`, formatters) and the store are the best first targets.
- No TypeScript, so shapes (CartItem, Order) are documented only here.

(R2) additions
- Wishlist is a snapshot like the cart: price and stock can go stale. It is also per-browser and not synced across tabs.
- Wishlist items on `/wishlist` render through `ProductCard`, so the Add to cart button uses snapshot stock; there is no revalidation.
- Hero slider chooses "top rated" by sorting the whole list on every change of `products` (cheap, memoized). It has no admin or curation concept.
- Hero auto-play respects reduced-motion by not starting; it does not offer a visible pause button (hover/focus pause only), which is a gap against strict WCAG 2.2.2 guidance for auto-moving content.
- `Carousel` arrow state relies on `ResizeObserver` and scroll events; images loading late inside cards do not change card width (fixed `min-width`) so this is stable, but a carousel of variable-width content would need extra care.
- Category carousel does not scroll the active card into view after a URL-driven selection (for example arriving via a shared link to a category far to the right).
- Search text resets when you leave and return to `/` (local state), while category persists (URL).
- Compactness is a density trade-off: smaller type (15px root), tighter padding, and 2-line title clamping show more items per screen but reduce touch-target size on small buttons (`btn-sm` is about 1.9rem tall, about 28px, under the 44px mobile guideline).
- Browser support: scroll-snap, `ResizeObserver`, `line-clamp`, `aria-roledescription` are all supported by current evergreen browsers; no polyfills.

Rejected alternatives
- Redux/Zustand: overkill for two arrays and six actions at this stage.
- Storing the whole product in the cart: bloats localStorage; a subset is enough.
- Fetching categories from `/products/categories`: extra request; derived from loaded products instead (valid while the full catalog is loaded, see above).
- (R2) Keeping a category `<select>` next to the cards: duplicate control that costs a row of space; removed.
- (R2) Third-party slider library (Swiper, Embla): more features, extra dependency; the two components here are about 100 lines each and enough for this scope.
- Modal or drawer cart: more state and focus handling; a page is simpler and URL-addressable.

---

## 11. Changes made to the original code

| File | Change | Reason |
|---|---|---|
| main.jsx | enabled `App.css` import | styles were not loading |
| App.jsx | added provider, new routes, uses `Navbar` | cart/checkout flow |
| Navbar.jsx | implemented (was stub) | links + cart badge |
| ProductCard.jsx | link no longer wraps the button; Add to cart added | valid HTML, feature |
| ProductList.jsx | implemented (was empty) | separate presentation from data |
| HomePage.jsx | uses `ProductList`, `formatCategory` | structure |
| ProductDetailsPage.jsx | added qty, Add to cart, cancel guard, optional fields | feature + correctness |
| OrdersPage.jsx | replaced placeholder with history | feature |
| productService.js | limit 12 to 30 | more useful category filter |
| index.css, App.css | rewritten | layout and states for all pages |

New: `store/*`, `utils/*`, `QuantityControl.jsx`, `CartPage.jsx`, `CheckoutPage.jsx`, `OrderSuccessPage.jsx`.

### Revision 2 changes

| File | Change | Reason |
|---|---|---|
| productService.js | `limit=0` + `select=` slim fields | complete catalog for categories without a heavy payload |
| StoreProvider.jsx | wishlist state, `toggleWishlist`, `clearWishlist`, `wishlistIds`, shared `toSnapshot`, `rating` in snapshot | wishlist feature, hero uses rating |
| Navbar.jsx | Wishlist link with badge | feature |
| ProductCard.jsx | heart overlay, price in footer row, in-cart pill, compact layout | feature + density |
| HomePage.jsx | hero slider, category carousel, URL-based category, merged toolbar, select removed | feature + density |
| ProductDetailsPage.jsx | wishlist button, smaller action buttons | feature + density |
| CheckoutPage.jsx | `placed` flag in the guard | bug fix (section 14) |
| CartPage.jsx, OrdersPage.jsx | header row uses the shared `toolbar` class | density |
| App.jsx | `/wishlist` route | feature |
| index.css, App.css | 15px root, compact spacing, new component styles | density |

New in R2: `Carousel.jsx`, `HeroSlider.jsx`, `CategoryCarousel.jsx`, `WishlistButton.jsx`, `WishlistPage.jsx`.

---

## 12. How to read the app when debugging

1. Wrong number on screen: find which state it derives from, then which action changed that state.
2. Cart or wishlist not updating: check the action in `StoreProvider` (is it using the functional form), then whether the component reads from `useStore()` or from stale local state.
3. Data gone after refresh: check `loadJSON`/`saveJSON` keys in DevTools, Application, Local Storage (`shop.cart.v1`, `shop.orders.v1`, `shop.wishlist.v1`).
4. Page blank or flash: check loading/error branches in the page and the Network tab for the DummyJSON call.
5. Wrong page after action: check `navigate` target and `replace` flag, then the destination route's guard.
6. Style issue: confirm `App.css` import in `main.jsx`, then the class name in the section of `App.css`.

---

## 13. Suggested next steps (in order of learning value)

1. Rebuild the project from scratch without looking, in the order: static card, fetch, filter, router, cart context, persistence, checkout, history.
2. Rewrite the store with `useReducer` (actions: ADD, REMOVE, SET_QTY, CLEAR_CART, PLACE_ORDER). Compare readability and testability.
3. Replace manual fetching with TanStack Query. Observe what disappears.
4. Convert to TypeScript; define `Product`, `CartItem`, `Order` types.
5. Add tests: `clampQty`, store actions, a checkout flow test with React Testing Library.
6. Add server-side search and pagination against DummyJSON (`/products/search?q=`, `limit`, `skip`), debounced input.
7. Add a real backend: replace `services/` calls, move cart/orders to the server, add auth. Components should barely change because of the layering.
8. Accessibility pass: focus on route change, skip link, keyboard-only run-through, color contrast check.
9. Deploy with SPA fallback rewrites configured.
10. (R2) Add the integration test used to find the checkout bug as a permanent suite (Vitest + Testing Library, mock `fetch`); wire it to `npm test`.
11. (R2) Add a pause button to the hero slider, scroll the active category card into view, and raise small touch targets on mobile.
12. (R2) Move filtering to the server and add pagination once the catalog is larger than a few hundred items.

---

## 14. Bug found and fixed in revision 2 (affects revision 1)

Symptom: clicking Place order landed on the empty cart page instead of the order-success page. The order was created and saved correctly; only the navigation outcome was wrong.

Cause: `placeOrder()` empties the cart (an urgent state update) and `navigate()` to the success page is applied as a transition. The checkout page re-rendered with an empty cart first, its guard (`<Navigate to="/cart" replace />`) fired, and that redirect won.

Fix: a local `placed` flag set in the same handler. The guard returns `null` while `placed` is true and only redirects for a genuinely empty cart (direct visit to `/checkout`, or Back after ordering). The flag is state, not a ref, because reading a ref during render is discouraged and would not trigger the re-render.

Lesson: a guard that depends on state your own action mutates can fight the action. When an action changes the condition a guard watches, either order the effects so the navigation commits first, or tell the guard the action is in progress.

How it was found: a temporary integration test (jsdom, mocked fetch) walked the whole flow. Six scenarios passed after the fix: slim fetch URL, category filter and URL sync, invalid category fallback, wishlist toggle with persistence, full add-to-cart-to-history flow, hero slider navigation. The test file was not kept in the project.
