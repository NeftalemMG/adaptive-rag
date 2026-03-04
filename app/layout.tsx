import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AdaptiveRAG - Multi-Vector Indexing",
  description: "Cost-based adaptive vector selection for different document collections",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <div style={{
            flex: 1,
            marginLeft: "252px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
