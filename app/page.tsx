"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LocationSelector from "./components/LocationSelector";
import AuthModal from "./components/AuthModal";
import AuthStatus from "./components/AuthStatus";

type Category = "All" | "Vegetables" | "Fruits" | "Meat" | "Seafood" | "Pantry";
type View = "shop" | "orders" | "account" | "admin";

type Product = {
  id: number;
  name: string;
  category: Exclude<Category, "All">;
  unit: string;
  price: number;
  oldPrice?: number;
  image: string;
  badge?: string;
  color: string;
};

const products: Product[] = [
  { id: 1, name: "Baguio strawberries", category: "Fruits", unit: "250g punnet", price: 189, oldPrice: 225, image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=85", badge: "Best seller", color: "#ffe5de" },
  { id: 2, name: "Japanese cucumber", category: "Vegetables", unit: "500g pack", price: 95, image: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=600&q=85", color: "#e2f1dc" },
  { id: 3, name: "Atlantic salmon fillet", category: "Seafood", unit: "250g portion", price: 420, oldPrice: 460, image: "https://images.unsplash.com/photo-1599084993091-1cb5c0721b55?auto=format&fit=crop&w=600&q=85", badge: "Fresh today", color: "#fff0d8" },
  { id: 4, name: "Free-range chicken", category: "Meat", unit: "Whole · 1.2kg", price: 398, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=85", color: "#f5e4d9" },
  { id: 5, name: "Cherry tomatoes", category: "Vegetables", unit: "250g punnet", price: 110, image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&q=85", color: "#ffe3de" },
  { id: 6, name: "Carabao mangoes", category: "Fruits", unit: "3 pieces", price: 165, image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=85", badge: "In season", color: "#fff0bd" },
  { id: 7, name: "Tiger prawns", category: "Seafood", unit: "500g · cleaned", price: 525, image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=85", color: "#fce4d3" },
  { id: 8, name: "Farm eggs", category: "Pantry", unit: "12 pieces", price: 138, image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=85", color: "#f6eddb" },
];

const categories: { name: Category; icon: string; count: string }[] = [
  { name: "All", icon: "✦", count: "48 items" },
  { name: "Vegetables", icon: "🥬", count: "16 items" },
  { name: "Fruits", icon: "🍋", count: "12 items" },
  { name: "Meat", icon: "🍗", count: "9 items" },
  { name: "Seafood", icon: "🦐", count: "8 items" },
  { name: "Pantry", icon: "🧺", count: "6 items" },
];

function peso(value: number) {
  return `₱${value.toLocaleString("en-PH")}`;
}

export default function Home() {
  const [view, setView] = useState<View>("shop");
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = useMemo(
    () => products.filter((product) => (category === "All" || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase())),
    [category, query],
  );
  const cartItems = products.filter((product) => cart[product.id]);
  const itemCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * cart[item.id], 0);
  const delivery = subtotal >= 1000 || subtotal === 0 ? 0 : 59;

  function addToCart(id: number) {
    setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
    const item = products.find((product) => product.id === id);
    setNotice(`${item?.name} added to your cart`);
    setTimeout(() => setNotice(""), 2200);
  }

  function updateCart(id: number, change: number) {
    setCart((current) => {
      const next = Math.max(0, (current[id] || 0) + change);
      const copy = { ...current };
      if (next === 0) delete copy[id]; else copy[id] = next;
      return copy;
    });
  }

  return (
    <main className="app">
      <div className="announcement"><span>✦</span> Free delivery on orders over ₱1,000 <span>•</span> Same-day delivery until 5 PM</div>
      <header className="header">
        <button className="brand" onClick={() => setView("shop")} aria-label="Marketday home"><span className="brand-mark">m</span><span>marketday<span className="brand-dot">.</span></span></button>
        <button className="mobile-menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen}>☰</button>
        <nav className={`main-nav ${menuOpen ? "menu-open" : ""}`}>
          <Link onClick={() => setMenuOpen(false)} className={view === "shop" ? "active" : ""} href="/">Shop</Link>
          <Link onClick={() => setMenuOpen(false)} className={view === "orders" ? "active" : ""} href="/orders">My orders</Link>
          <Link onClick={() => setMenuOpen(false)} className={view === "account" ? "active" : ""} href="/account">Account</Link>
        </nav>
        <div className="header-actions">
          <LocationSelector />
          <AuthStatus />
          <button className="cart-button" onClick={() => setCartOpen(true)}><span>Cart</span><b>{itemCount}</b></button>
        </div>
      </header>

      {notice && <div className="toast">✓ {notice}</div>}

      {view === "shop" && <ShopView category={category} setCategory={setCategory} query={query} setQuery={setQuery} filtered={filtered} addToCart={addToCart} setView={setView} />}
      {view === "orders" && <OrdersView />}
      {view === "account" && <AccountView setView={setView} />}
      {view === "admin" && <AdminView setView={setView} />}

      <footer><div className="footer-brand"><span className="brand-mark">m</span><span>marketday<span className="brand-dot">.</span></span></div><p>Good food starts at the market.</p><div className="footer-links"><span>About</span><span>Help center</span><span>Delivery areas</span><Link href="/admin">Admin preview</Link></div></footer>

      {cartOpen && <CartDrawer items={cartItems} cart={cart} subtotal={subtotal} delivery={delivery} updateCart={updateCart} close={() => setCartOpen(false)} checkout={() => { setCartOpen(false); setView("orders"); setNotice("Checkout is ready — your delivery slot is reserved"); setTimeout(() => setNotice(""), 3000); }} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </main>
  );
}

function ShopView({ category, setCategory, query, setQuery, filtered, addToCart, setView }: { category: Category; setCategory: (category: Category) => void; query: string; setQuery: (query: string) => void; filtered: Product[]; addToCart: (id: number) => void; setView: (view: View) => void }) {
  return <div>
    <section className="hero"><div className="hero-copy"><div className="pill"><span>●</span> Your neighborhood market, online</div><h1>Fresh from<br /><em>our market</em><br />to your table.</h1><p>Hand-picked produce, quality cuts, and the freshest catch — delivered to your doorstep with care.</p><div className="hero-actions"><button className="primary" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>Shop fresh picks <span>→</span></button><span className="trust">✓ Picked fresh daily<br /><b>by real market people</b></span></div></div><div className="hero-art"><div className="hero-sun" /><div className="hero-card hero-card-main"><Image src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85" alt="Fresh market produce" fill sizes="(max-width: 800px) 80vw, 360px" priority /><span className="image-label">Today&apos;s harvest</span></div><div className="floating-note note-top"><span>✦</span><b>4.9/5</b><small>from happy shoppers</small></div><div className="floating-note note-bottom"><span>♧</span><b>25 min</b><small>average delivery</small></div></div></section>
    <section className="category-section"><div className="section-heading"><div><span className="kicker">Browse the market</span><h2>What are you looking for?</h2></div><span className="small-muted">Fresh picks, always changing <span>↗</span></span></div><div className="category-list">{categories.map((item) => <button key={item.name} className={`category-card ${category === item.name ? "selected" : ""}`} onClick={() => setCategory(item.name)}><span className="category-icon">{item.icon}</span><strong>{item.name}</strong><small>{item.count}</small></button>)}</div></section>
    <section className="products-section" id="products"><div className="section-heading product-heading"><div><span className="kicker">Picked for you</span><h2>Market favorites</h2></div><div className="product-tools"><div className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the market" /></div><button className="filter">☷ <span>Filter</span></button></div></div><div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} addToCart={addToCart} />)}</div>{filtered.length === 0 && <div className="empty">No market finds matched that search. Try another name.</div>}<button className="view-all" onClick={() => { setCategory("All"); setQuery(""); }}>View all products <span>→</span></button></section>
    <section className="promise"><div className="promise-copy"><span className="kicker">The marketday promise</span><h2>Good food, made<br /><em>simple.</em></h2><p>We work with local farmers, fishers, and growers to bring the best of the market to your kitchen. No middlemen. No guesswork. Just good food.</p><button className="text-button" onClick={() => setView("account")}>More about us <span>→</span></button></div><div className="promise-items"><div><span>01</span><strong>Quality first</strong><p>Every item is checked by our team before it leaves the market.</p></div><div><span>02</span><strong>Fair & local</strong><p>We partner with people who care about what they grow and make.</p></div><div><span>03</span><strong>Right to you</strong><p>Chilled, packed with care, and delivered on the day you choose.</p></div></div></section>
  </div>;
}

function ProductCard({ product, addToCart }: { product: Product; addToCart: (id: number) => void }) {
  return <article className="product-card"><div className="product-image" style={{ backgroundColor: product.color }}><Image src={product.image} alt={product.name} fill sizes="(max-width: 800px) 50vw, 260px" />{product.badge && <span className="badge">{product.badge}</span>}<button className="quick-add" onClick={() => addToCart(product.id)} aria-label={`Add ${product.name} to cart`}>+</button></div><div className="product-info"><div><h3>{product.name}</h3><p>{product.unit}</p></div><div className="price-row"><strong>{peso(product.price)}</strong>{product.oldPrice && <del>{peso(product.oldPrice)}</del>}<button onClick={() => addToCart(product.id)}>Add</button></div></div></article>;
}

function CartDrawer({ items, cart, subtotal, delivery, updateCart, close, checkout }: { items: Product[]; cart: Record<number, number>; subtotal: number; delivery: number; updateCart: (id: number, change: number) => void; close: () => void; checkout: () => void }) {
  return <div className="overlay" onClick={close}><aside className="cart-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><span className="kicker">Your basket</span><h2>{Object.values(cart).reduce((a, b) => a + b, 0)} items</h2></div><button onClick={close} aria-label="Close basket">×</button></div>{items.length === 0 ? <div className="cart-empty"><span>🧺</span><h3>Your basket is waiting</h3><p>Add something fresh from the market.</p></div> : <><div className="cart-items">{items.map((item) => <div className="cart-item" key={item.id}><Image src={item.image} alt="" width={62} height={62} /><div><strong>{item.name}</strong><small>{item.unit}</small><b>{peso(item.price)}</b></div><div className="stepper"><button onClick={() => updateCart(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button><span>{cart[item.id]}</span><button onClick={() => updateCart(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button></div></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><b>{peso(subtotal)}</b></div><div><span>Delivery</span><b>{delivery === 0 ? "Free" : peso(delivery)}</b></div><div className="total"><span>Total</span><b>{peso(subtotal + delivery)}</b></div><button className="primary checkout" onClick={checkout}>Continue to checkout <span>→</span></button><small>🔒 Secure checkout · Pay with card, GCash, or cash</small></div></>}</aside></div>;
}

function OrdersView() {
  return <section className="simple-page"><div className="page-title"><span className="kicker">Your marketday</span><h1>Orders &amp; delivery</h1><p>Keep an eye on your fresh finds from market to doorstep.</p></div><div className="order-card"><div className="order-top"><div><span className="order-id">ORDER #MK-28491</span><h2>Arriving today</h2><p>Tuesday, 8 September · 3:00–5:00 PM</p></div><span className="status-pill">On the way</span></div><div className="progress"><div className="progress-line"><span /></div><div className="progress-step done"><b>✓</b><span>Confirmed</span></div><div className="progress-step done"><b>✓</b><span>Being packed</span></div><div className="progress-step current"><b>●</b><span>On the way</span></div><div className="progress-step"><b>○</b><span>Delivered</span></div></div><div className="driver"><div className="avatar">JM</div><div><strong>Juan is bringing your order</strong><p>We&apos;ll notify you when he&apos;s nearby.</p></div><button>Message</button></div></div><div className="past-orders"><div className="section-heading"><div><span className="kicker">Order history</span><h2>Past orders</h2></div><button className="text-button">View all →</button></div><div className="past-row"><span>MK-28470</span><span>30 Aug 2026</span><span>8 items</span><strong>₱1,284</strong><button>Reorder</button></div><div className="past-row"><span>MK-28392</span><span>22 Aug 2026</span><span>5 items</span><strong>₱890</strong><button>Reorder</button></div></div></section>;
}

function AccountView({ setView }: { setView: (view: View) => void }) {
  return <section className="simple-page account-page"><div className="page-title"><span className="kicker">Welcome back</span><h1>Hi, Jamie.</h1><p>Manage your details and make your next market run even easier.</p></div><div className="account-grid"><div className="account-card profile"><div className="large-avatar">JR</div><h2>Jamie Reyes</h2><p>jamie.reyes@email.com</p><button className="outline">Edit profile</button></div><div className="account-card"><span className="account-icon">⌖</span><h3>Delivery addresses</h3><p><b>Home</b><br />24 Narra Street, New Manila<br />Quezon City, 1112</p><button className="text-button">Manage addresses →</button></div><div className="account-card"><span className="account-icon">▣</span><h3>Payment methods</h3><p><b>Visa ending in 4242</b><br />Your payment details are secure.</p><button className="text-button">Manage payments →</button></div></div><div className="account-banner"><div><span className="kicker">Need a hand?</span><h2>Our market people are here for you.</h2><p>Questions about an order, delivery, or an ingredient?</p></div><button className="primary" onClick={() => setView("orders")}>Visit help center →</button></div></section>;
}

function AdminView({ setView }: { setView: (view: View) => void }) {
  return <section className="admin-page"><div className="admin-head"><div><span className="kicker">Marketday admin</span><h1>Good morning, Ana.</h1><p>Here&apos;s what&apos;s happening with your market today.</p></div><button className="primary" onClick={() => setView("shop")}>View storefront ↗</button></div><div className="stats"><div><span>Today&apos;s sales</span><strong>₱28,460</strong><small className="up">↑ 14.8% vs yesterday</small></div><div><span>Orders today</span><strong>42</strong><small className="up">↑ 8 new since 9 AM</small></div><div><span>Low stock alerts</span><strong>7</strong><small className="warning">Needs your attention</small></div><div><span>Avg. delivery time</span><strong>31 min</strong><small className="up">↓ 6 min this week</small></div></div><div className="admin-columns"><div className="admin-panel"><div className="panel-heading"><div><span className="kicker">Live orders</span><h2>Today&apos;s orders</h2></div><button className="text-button">View all →</button></div><div className="admin-order"><span className="order-dot packing" /><div><strong>#MK-28503 · Mia Santos</strong><small>3 items · ₱680 · Quezon City</small></div><span className="admin-status">Packing</span></div><div className="admin-order"><span className="order-dot delivery" /><div><strong>#MK-28502 · Leo Cruz</strong><small>8 items · ₱1,420 · San Juan</small></div><span className="admin-status">On the way</span></div><div className="admin-order"><span className="order-dot ready" /><div><strong>#MK-28501 · Bea Lim</strong><small>5 items · ₱940 · New Manila</small></div><span className="admin-status">Ready</span></div></div><div className="admin-panel"><div className="panel-heading"><div><span className="kicker">Catalog</span><h2>Stock watch</h2></div><button className="text-button">Manage →</button></div><div className="stock-row"><div className="tiny-product strawberry" /><div><strong>Baguio strawberries</strong><small>Only 4 left</small></div><span className="stock-low">Low</span></div><div className="stock-row"><div className="tiny-product salmon" /><div><strong>Atlantic salmon fillet</strong><small>Only 8 left</small></div><span className="stock-low">Low</span></div><div className="stock-row"><div className="tiny-product mango" /><div><strong>Carabao mangoes</strong><small>32 in stock</small></div><span className="stock-good">Good</span></div></div></div></section>;
}
