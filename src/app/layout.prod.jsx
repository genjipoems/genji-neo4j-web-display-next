"use client";

import "../styles/globals.css";
// import Header from '../components/Header.prod';
import Nav from "../components/Nav.prod";
import MobileNav from "../components/MobileNav.prod";
import MobileWarning from "../components/MobileWarning.prod";
import { usePathname } from "next/navigation";
import Script from "next/script";
import Footer from "../components/Footer.prod";
import { SessionProvider } from "next-auth/react";
import { useMobileRouteProtection } from "../hooks/useMobileRouteProtection";

export const metadata = {
  title: "The Tale of Genji Poem Database",
  description: "The Tale of Genji Poem Database Website",
  // viewport: 'width=device-width, initial-scale=1',
};

const Layout = ({ children }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  // Enable mobile route protection
  useMobileRouteProtection();

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`main ${isLoginPage ? "login-page" : ""}`}>
        <SessionProvider>
          <MobileWarning />
          {!isLoginPage && (
            <div className="top">
              {/* <Header /> */}
              <Nav />
              <MobileNav />
            </div>
          )}
          <main className="bottom">{children}</main>
          <Footer />
          {/* Chatbot */}
          {/* <Script id="chatbot-config">
            {`
            window.difyChatbotConfig = {
              token: '${process.env.NEXT_PUBLIC_DIFY_CHATBOT_TOKEN}',
              baseUrl: '${process.env.NEXT_PUBLIC_DIFY_API_BASE_URL}',
         };
        `}
          </Script>
          <Script
            src={`${process.env.NEXT_PUBLIC_DIFY_API_BASE_URL}/embed.min.js`}
            id="dify-chatbot"
            defer
          /> */}
          <Script
            strategy="afterInteractive"
            src="https://www.googletagmanager.com/gtag/js?id=G-4N5VNJMQSS"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4N5VNJMQSS');
          `}
          </Script>
        </SessionProvider>
      </body>
    </html>
  );
};

export default Layout;