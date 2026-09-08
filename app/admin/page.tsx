"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RouteHeader, { RouteFooter } from "../components/RouteHeader";
import { supabase } from "../../lib/supabase";

type AdminProduct = { id: number; name: string; category: string; price: number; stock: number; available: boolean };
type AdminOrder = { id: string; customer: string; items: number; total: string; area: string; address?: string; paymentMethod?: string; status: "Packing" | "Ready" | "On the way" | "Delivered" | "Cancelled" };

const initialProducts: AdminProduct[] = [
  { id: 1, name: "Baguio strawberries", category: "Fruits", price: 189, stock: 4, available: true },
  { id: 2, name: "Japanese cucumber", category: "Vegetables", price: 95, stock: 24, available: true },
  { id: 3, name: "Atlantic salmon fillet", category: "Seafood", price: 420, stock: 8, available: true },
  { id: 4, name: "Free-range chicken", category: "Meat", price: 398, stock: 0, available: false },
];

const initialOrders: AdminOrder[] = [
  { id: "#MK-28503", customer: "Mia Santos", items: 3, total: "₱680", area: "Quezon City", status: "Packing" },
  { id: "#MK-28502", customer: "Leo Cruz", items: 8, total: "₱1,420", area: "San Juan", status: "On the way" },
  { id: "#MK-28501", customer: "Bea Lim", items: 5, total: "₱940", area: "New Manila", status: "Ready" },
];

function getInitialAdminOrders() {
  if (typeof window === "undefined") return initialOrders;
  const savedOrders = JSON.parse(window.localStorage.getItem("marketday-orders") || "[]") as Array<{ id: string; customer: string; address?: string; paymentMethod?: string; status: AdminOrder["status"] }>;
  return [...initialOrders, ...savedOrders.map((order) => ({ ...order, items: 3, total: "₱763", area: order.address || "Delivery address" }))];
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [checkingSession, setCheckingSession] = useState(Boolean(supabase));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(getInitialAdminOrders);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders">("overview");

  useEffect(() => {
    let mounted = true;
    if (!supabase) return () => { mounted = false; };
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user;
      const configuredEmails = [process.env.NEXT_PUBLIC_ADMIN_EMAIL, ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",")].filter((value): value is string => Boolean(value)).map((value) => value.trim().toLowerCase());
      const isAdmin = user?.app_metadata?.role === "admin" || user?.user_metadata?.role === "admin" || (!!user?.email && configuredEmails.includes(user.email.toLowerCase()));
      setLoggedIn(Boolean(isAdmin));
      setAdminName(user?.user_metadata?.full_name || user?.user_metadata?.display_name || "Admin");
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setLoggedIn(Boolean(session?.user));
      setAdminName(session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.display_name || "Admin");
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
      return;
    }
    setBusy(true);
    try {
      const health = await fetch("/api/supabase-check", { cache: "no-store" });
      if (!health.ok) {
        setBusy(false);
        setMessage("The deployed app cannot reach Supabase. Check the project is active and that the Vercel variables belong to the same Supabase project.");
        return;
      }
    } catch {
      setBusy(false);
      setMessage("The deployed app cannot verify its Supabase connection. Redeploy the latest Vercel build and try again.");
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage(error.message === "Failed to fetch"
        ? "Unable to connect to Supabase. Check your Vercel Supabase URL, anon key, and project status."
        : error.message);
      return;
    }
    const configuredEmails = [
      process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(","),
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.trim().toLowerCase())
    const userEmail = data.user?.email?.trim().toLowerCase();
    const isAdmin = data.user?.app_metadata?.role === "admin"
      || data.user?.user_metadata?.role === "admin"
      || (!!userEmail && configuredEmails.includes(userEmail));
    if (!isAdmin) {
      await supabase.auth.signOut();
      setMessage("This account does not have admin access.");
      return;
    }
    setAdminName(data.user.user_metadata?.full_name || data.user.user_metadata?.display_name || "Admin");
    setLoggedIn(true);
  }

  function updateProduct(id: number, field: "price" | "stock", value: number) {
    setProducts((current) => current.map((product) => product.id === id ? { ...product, [field]: Math.max(0, value), available: field === "stock" ? value > 0 : product.available } : product));
  }

  function toggleAvailability(id: number) {
    setProducts((current) => current.map((product) => product.id === id ? { ...product, available: !product.available } : product));
  }

  function updateOrder(id: string, status: AdminOrder["status"]) {
    setOrders((current) => {
      const next = current.map((order) => order.id === id ? { ...order, status } : order);
      window.localStorage.setItem("marketday-orders", JSON.stringify(next.filter((order) => order.id.startsWith("MK-"))));
      return next;
    });
  }

  function deleteOrder(id: string) {
    setOrders((current) => {
      const next = current.filter((order) => order.id !== id);
      window.localStorage.setItem("marketday-orders", JSON.stringify(next.filter((order) => order.id.startsWith("MK-"))));
      return next;
    });
  }

  if (checkingSession) return <main className="app"><RouteHeader active="shop" /><section className="admin-login"><div className="admin-login-card"><span className="brand-mark">m</span><p>Checking your admin session…</p></div></section><RouteFooter /></main>;
  if (!loggedIn) return <main className="app"><RouteHeader active="shop" /><section className="admin-login"><div className="admin-login-card"><span className="brand-mark">m</span><span className="kicker">Marketday admin</span><h1>Sign in to your store.</h1><p>Use the Supabase admin account configured for your Marketday workspace.</p><form onSubmit={signIn}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@yourstore.com" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{message && <div className="admin-message">{message}</div>}<button className="primary" disabled={busy}>{busy ? "Signing in…" : "Sign in to admin"} <span>→</span></button></form><Link href="/">← Back to storefront</Link></div></section><RouteFooter /></main>;

  return <main className="app"><RouteHeader active="shop" /><section className="admin-page"><div className="admin-head"><div><span className="kicker">Marketday admin</span><h1>Good morning, {adminName}.</h1><p>Manage products, orders, and today&apos;s market operations.</p></div><div className="admin-head-actions"><span className="admin-live">● Live dashboard</span><Link className="primary" href="/">View storefront ↗</Link></div></div><div className="admin-tabs"><button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Overview</button><button className={activeTab === "products" ? "active" : ""} onClick={() => setActiveTab("products")}>Products &amp; stock</button><button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>Orders</button></div>{activeTab === "overview" && <><div className="stats"><div><span>Today&apos;s sales</span><strong>₱28,460</strong><small className="up">↑ 14.8% vs yesterday</small></div><div><span>Orders today</span><strong>{orders.length + 39}</strong><small className="up">↑ 8 new since 9 AM</small></div><div><span>Low stock alerts</span><strong>{products.filter((product) => product.stock < 10).length}</strong><small className="warning">Needs your attention</small></div><div><span>Avg. delivery time</span><strong>31 min</strong><small className="up">↓ 6 min this week</small></div></div><div className="admin-columns"><div className="admin-panel"><div className="panel-heading"><div><span className="kicker">Live orders</span><h2>Today&apos;s orders</h2></div><button className="text-button" onClick={() => setActiveTab("orders")}>Manage →</button></div>{orders.map((order) => <AdminOrderRow key={order.id} order={order} updateOrder={updateOrder} />)}</div><div className="admin-panel"><div className="panel-heading"><div><span className="kicker">Catalog</span><h2>Stock watch</h2></div><button className="text-button" onClick={() => setActiveTab("products")}>Manage →</button></div>{products.slice(0, 3).map((product) => <StockRow key={product.id} product={product} />)}</div></div></>}{activeTab === "products" && <ProductManager products={products} updateProduct={updateProduct} toggleAvailability={toggleAvailability} />}{activeTab === "orders" && <OrderManager orders={orders} updateOrder={updateOrder} deleteOrder={deleteOrder} />}</section><RouteFooter /></main>;
}

function AdminOrderRow({ order, updateOrder }: { order: AdminOrder; updateOrder: (id: string, status: AdminOrder["status"]) => void }) {
  return <div className="admin-order"><span className={`order-dot ${order.status === "Packing" ? "packing" : order.status === "On the way" ? "delivery" : order.status === "Cancelled" ? "cancelled" : "ready"}`} /><div><strong>{order.id} · {order.customer}</strong><small>{order.items} items · {order.total} · {order.area}</small></div><select value={order.status} onChange={(event) => updateOrder(order.id, event.target.value as AdminOrder["status"])}><option>Packing</option><option>Ready</option><option>On the way</option><option>Delivered</option><option>Cancelled</option></select></div>;
}

function StockRow({ product }: { product: AdminProduct }) {
  return <div className="stock-row"><div className={`tiny-product ${product.category.toLowerCase()}`} /><div><strong>{product.name}</strong><small>{product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}</small></div><span className={product.stock < 10 ? "stock-low" : "stock-good"}>{product.stock < 10 ? "Low" : "Good"}</span></div>;
}

function ProductManager({ products, updateProduct, toggleAvailability }: { products: AdminProduct[]; updateProduct: (id: number, field: "price" | "stock", value: number) => void; toggleAvailability: (id: number) => void }) {
  return <div className="admin-panel manager-panel"><div className="panel-heading"><div><span className="kicker">Catalog management</span><h2>Products &amp; stock</h2></div><button className="primary">+ Add product</button></div><div className="product-table"><div className="table-head"><span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Availability</span></div>{products.map((product) => <div className="table-row" key={product.id}><strong>{product.name}</strong><span>{product.category}</span><label>₱<input type="number" value={product.price} onChange={(event) => updateProduct(product.id, "price", Number(event.target.value))} /></label><label><input type="number" value={product.stock} onChange={(event) => updateProduct(product.id, "stock", Number(event.target.value))} /></label><button className={product.available ? "available" : "unavailable"} onClick={() => toggleAvailability(product.id)}>{product.available ? "Available" : "Hidden"}</button></div>)}</div></div>;
}

function OrderManager({ orders, updateOrder, deleteOrder }: { orders: AdminOrder[]; updateOrder: (id: string, status: AdminOrder["status"]) => void; deleteOrder: (id: string) => void }) {
  return <div className="admin-panel manager-panel"><div className="panel-heading"><div><span className="kicker">Fulfillment</span><h2>Manage orders</h2></div></div>{orders.map((order) => <div className="order-manager-row" key={order.id}><div><strong>{order.id} · {order.customer}</strong><small>{order.items} items · {order.total} · {order.area}</small></div><div className="order-manager-actions"><select value={order.status} onChange={(event) => updateOrder(order.id, event.target.value as AdminOrder["status"])}><option>Packing</option><option>Ready</option><option>On the way</option><option>Delivered</option><option>Cancelled</option></select><button className="order-cancel" onClick={() => updateOrder(order.id, "Cancelled")} disabled={order.status === "Delivered" || order.status === "Cancelled"}>Cancel</button><button className="order-delete" onClick={() => deleteOrder(order.id)}>Delete</button></div></div>)}</div>;
}
