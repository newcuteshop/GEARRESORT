export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="from-surface via-background min-h-screen bg-gradient-to-br to-sky-50/40">
      {children}
    </main>
  );
}
