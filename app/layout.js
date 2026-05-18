import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppEffects } from "@/components/app-effects";

export const metadata = {
  title: "VisualMind | Learn Smarter, Not Harder",
  description: "A premium ed-tech platform that turns boring content into visual learning."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AppEffects>{children}</AppEffects>
        </ThemeProvider>
      </body>
    </html>
  );
}
