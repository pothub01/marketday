"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RouteHeader, { RouteFooter } from "../components/RouteHeader";
import { supabase } from "../../lib/supabase";

function getSavedDeliveryAddress() {
  if (typeof window === "undefined") return "Set a delivery address";
  const saved = JSON.parse(window.localStorage.getItem("marketday-saved-addresses") || "[]") as Array<{ address?: string; isDefault?: boolean }>;
  return window.localStorage.getItem("marketday-address") || saved.find((item) => item.isDefault)?.address || "Set a delivery address";
}

type CheckoutItem = { id: number; name: string; unit: string; price: number; quantity: number };

function getCartItems() {
  if (typeof window === "undefined") return [];
  return JSON.parse(window.localStorage.getItem("marketday-cart-items") || "[]") as CheckoutItem[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [customerName, setCustomerName] = useState("Marketday shopper");
  const [deliveryAddress] = useState(getSavedDeliveryAddress);
  const [cartItems] = useState<CheckoutItem[]>(getCartItems);
  const [subtotal] = useState(() => Number(typeof window === "undefined" ? 0 : window.localStorage.getItem("marketday-cart-subtotal") || 0));
  const [delivery] = useState(() => Number(typeof window === "undefined" ? 0 : window.localStorage.getItem("marketday-cart-delivery") || 0));
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => {
      const metadata = data.user?.user_metadata;
      setCustomerName(metadata?.full_name || metadata?.display_name || data.user?.email || "Marketday shopper");
    });
  }, []);

  function placeOrder() {
    if (paymentMethod === "online") return;
    const order = { id: `MK-${Date.now().toString().slice(-6)}`, address: deliveryAddress, customer: customerName, items: cartItems, total: subtotal + delivery, paymentMethod: "Cash on delivery", status: "Packing", createdAt: new Date().toISOString() };
    const existing = JSON.parse(window.localStorage.getItem("marketday-orders") || "[]") as unknown[];
    window.localStorage.setItem("marketday-orders", JSON.stringify([...existing, order]));
    window.localStorage.setItem("marketday-latest-order", JSON.stringify(order));
    setPlaced(true);
    window.setTimeout(() => router.push("/orders"), 900);
  }

  return <main className="app"><RouteHeader active="shop" /><section className="simple-page checkout-page"><div className="page-title"><span className="kicker">Almost there</span><h1>Complete your order</h1><p>Review your delivery details and choose how you&apos;d like to pay.</p></div><div className="checkout-layout"><div className="checkout-form"><div className="checkout-section"><h2>Delivery details</h2><label>Full name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label><label>Delivery address<input value={deliveryAddress} readOnly /><Link className="checkout-address-link" href="/account">Choose a default or saved address →</Link></label><label>Delivery slot<select defaultValue="today"><option value="today">Today · 3:00–5:00 PM</option><option value="tomorrow">Tomorrow · 9:00–11:00 AM</option></select></label></div><div className="checkout-section"><h2>How would you like to pay?</h2><button type="button" className={`payment-choice ${paymentMethod === "cod" ? "selected" : ""}`} onClick={() => setPaymentMethod("cod")}><span>₱</span><div><strong>Cash on delivery</strong><small>Pay your rider when your order arrives</small></div>{paymentMethod === "cod" && <b>✓</b>}</button><button type="button" className={`payment-choice ${paymentMethod === "online" ? "selected" : ""}`} onClick={() => setPaymentMethod("online")}><span>▣</span><div><strong>Online payment</strong><small>Card, GCash, Maya, and online banking</small></div>{paymentMethod === "online" && <b>✓</b>}</button>{paymentMethod === "online" && <p className="payment-note">Online payment will be connected soon. You can select this option now while PayMongo setup is pending.</p>}</div></div><aside className="checkout-summary"><span className="kicker">Order summary</span><h2>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} items</h2>{cartItems.map((item) => <div key={item.id}><span>{item.name} × {item.quantity}</span><b>₱{(item.price * item.quantity).toLocaleString("en-PH")}</b></div>)}<div><span>Delivery</span><b>{delivery === 0 ? "Free" : `₱${delivery.toLocaleString("en-PH")}`}</b></div><div className="total"><span>Total</span><b>₱{(subtotal + delivery).toLocaleString("en-PH")}</b></div>{placed ? <p className="order-success">Order placed. Your rider will collect ₱{(subtotal + delivery).toLocaleString("en-PH")} on delivery.</p> : <button className="primary checkout" onClick={placeOrder} disabled={paymentMethod === "online" || cartItems.length === 0}>Place order with {paymentMethod === "cod" ? "COD" : "online payment"} <span>→</span></button>}<small>{paymentMethod === "cod" ? "Pay safely when your order arrives." : "Payment integration will be enabled soon."}</small><Link href="/">← Continue shopping</Link></aside></div></section><RouteFooter /></main>;
}
