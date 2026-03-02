import "./globals.css";

export const metadata = {
  title: "PersonaForge",
  description: "Persona-style character chat builder",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
