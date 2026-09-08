import RouteHeader, { RouteFooter } from "../components/RouteHeader";
import Link from "next/link";

export default function AccountPage() {
  return <main className="app"><RouteHeader active="account" /><section className="simple-page account-page"><div className="page-title"><span className="kicker">Your marketday account</span><h1>Shop with us.</h1><p>Sign in to save your details, track orders, and check out faster.</p></div><div className="guest-card"><div className="guest-icon">♙</div><h2>Welcome to Marketday</h2><p>You&apos;re currently browsing as a guest. Sign in or create an account to access your orders, saved addresses, and payment methods.</p><div className="guest-actions"><button className="primary">Sign in <span>→</span></button><button className="outline">Create account</button></div></div><div className="account-banner"><div><span className="kicker">Need a hand?</span><h2>Our market people are here for you.</h2><p>Questions about an order, delivery, or an ingredient?</p></div><Link className="primary" href="/">Continue shopping →</Link></div></section><RouteFooter /></main>;
}
