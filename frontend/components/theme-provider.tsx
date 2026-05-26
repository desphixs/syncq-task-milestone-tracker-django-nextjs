"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * GLOBAL THEME PROVIDER wrapper component
 * 
 * Analogy:
 * Think of this provider like a central visual coordinator for the building.
 * It broadcasts the current color scheme preference (light or dark) down to all
 * rooms and elements, ensuring that everyone matches the same aesthetic layout!
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
