export const metadata = { title: "Asmabeauty – Tableau de bord", description: "Dashboard neutre" };
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
