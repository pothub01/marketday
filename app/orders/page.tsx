import RouteHeader, { RouteFooter } from "../components/RouteHeader";

export default function OrdersPage() {
  return <main className="app"><RouteHeader active="orders" /><section className="simple-page"><div className="page-title"><span className="kicker">Your marketday</span><h1>Orders &amp; delivery</h1><p>Sign in to view your active orders, delivery updates, and order history.</p></div><div className="guest-card order-guest"><div className="guest-icon">⌁</div><h2>No orders yet</h2><p>Your orders and delivery tracking will appear here after you sign in and place your first Marketday order.</p><button className="primary">Sign in to view orders <span>→</span></button></div></section><RouteFooter /></main>;
}
