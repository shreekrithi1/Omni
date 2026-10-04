import "./globals.css";
export const metadata = { title: "OmniControl AI", description: "The Personal Operating Room" };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
