import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CartProvider } from "@/components/bag/CartProvider";

/**
 * Storefront chrome: guest-bag state, shop header, and footer wrap every
 * customer route. Admin (`/admin`) and auth (`/sign-in`, `/sign-up`)
 * live outside this group and never inherit it.
 */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </CartProvider>
  );
}
