import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gunnison County Housing Calculator",
  description: "Find affordable housing listings you qualify for in Gunnison County.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
